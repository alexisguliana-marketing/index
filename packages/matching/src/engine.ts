import { DEFAULT_MATCH_WEIGHTS, type MatchWeights } from "./weights";
import type {
  CoupleMatchProfile,
  MatchCriterionResult,
  MatchResult,
  VendorMatchProfile,
} from "./types";

/**
 * Wedding Match — purely algorithmic, rule-based scoring engine (Principe 2 :
 * pas d'IA gadget). Every criterion is a small deterministic function so the
 * whole engine stays auditable and the weights can be tuned without touching
 * this file (cahier des charges §16-17).
 */

function haversineDistanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const earthRadiusKm = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(h));
}

function scoreBudget(couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0; // filled in by caller with the active weight
  if (couple.budgetForCategory === null || vendor.priceMin === null) {
    return { key: "budget", label: "Budget", weight, score: 0.5, satisfied: false, explanation: "Budget non renseigné." };
  }
  const priceMin = vendor.priceMin;
  const priceMax = vendor.priceMax ?? vendor.priceMin;
  if (couple.budgetForCategory >= priceMin) {
    const headroom = priceMax > priceMin ? (couple.budgetForCategory - priceMin) / (priceMax - priceMin) : 1;
    return {
      key: "budget",
      label: "Budget",
      weight,
      score: Math.min(1, 0.7 + 0.3 * Math.min(1, headroom)),
      satisfied: true,
      explanation: "Budget compatible avec les prestations proposées.",
    };
  }
  const gapRatio = (priceMin - couple.budgetForCategory) / priceMin;
  return {
    key: "budget",
    label: "Budget",
    weight,
    score: Math.max(0, 1 - gapRatio),
    satisfied: false,
    explanation: "Budget inférieur au tarif minimum de ce prestataire.",
  };
}

function scoreLocation(couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (couple.latitude === null || couple.longitude === null || vendor.latitude === null || vendor.longitude === null) {
    return { key: "location", label: "Localisation", weight, score: 0.5, satisfied: false, explanation: "Localisation non renseignée." };
  }
  const distanceKm = haversineDistanceKm(
    { latitude: couple.latitude, longitude: couple.longitude },
    { latitude: vendor.latitude, longitude: vendor.longitude },
  );
  const radiusKm = vendor.travelRadiusKm ?? 50;
  const withinRadius = distanceKm <= radiusKm;
  const score = withinRadius ? Math.max(0.6, 1 - distanceKm / (radiusKm * 2)) : Math.max(0, 1 - (distanceKm - radiusKm) / radiusKm);
  return {
    key: "location",
    label: "Localisation",
    weight,
    score: Math.min(1, score),
    satisfied: withinRadius,
    explanation: `${Math.round(distanceKm)} km de votre lieu${withinRadius ? "" : " (hors zone d'intervention)"}.`,
  };
}

function scoreAvailability(_couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (vendor.isAvailableOnDate === null) {
    return { key: "availability", label: "Disponibilité", weight, score: 0.5, satisfied: false, explanation: "Disponibilité inconnue à cette date." };
  }
  return {
    key: "availability",
    label: "Disponibilité",
    weight,
    score: vendor.isAvailableOnDate ? 1 : 0,
    satisfied: vendor.isAvailableOnDate,
    explanation: vendor.isAvailableOnDate ? "Disponible à votre date." : "Non disponible à votre date.",
  };
}

function scoreStyle(couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (!couple.style || vendor.styles.length === 0) {
    return { key: "style", label: "Style", weight, score: 0.5, satisfied: false, explanation: "Style non renseigné." };
  }
  const matches = vendor.styles.includes(couple.style);
  return {
    key: "style",
    label: "Style",
    weight,
    score: matches ? 1 : 0.2,
    satisfied: matches,
    explanation: matches ? "Spécialisé dans votre style." : "Ne propose pas votre style habituellement.",
  };
}

function scoreWeddingType(couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (!couple.ceremonyType || vendor.ceremonyTypes.length === 0) {
    return { key: "weddingType", label: "Type de mariage", weight, score: 0.5, satisfied: false, explanation: "Type de cérémonie non renseigné." };
  }
  const matches = vendor.ceremonyTypes.includes(couple.ceremonyType);
  return {
    key: "weddingType",
    label: "Type de mariage",
    weight,
    score: matches ? 1 : 0.3,
    satisfied: matches,
    explanation: matches ? "Expérience avec des mariages similaires." : "Peu d'expérience avec ce type de cérémonie.",
  };
}

function scoreCapacity(couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (couple.guestCountEstimate === null || (vendor.capacityMin === null && vendor.capacityMax === null)) {
    return { key: "capacity", label: "Capacité", weight, score: 0.5, satisfied: false, explanation: "Capacité non renseignée." };
  }
  const min = vendor.capacityMin ?? 0;
  const max = vendor.capacityMax ?? Number.POSITIVE_INFINITY;
  const fits = couple.guestCountEstimate >= min && couple.guestCountEstimate <= max;
  return {
    key: "capacity",
    label: "Capacité",
    weight,
    score: fits ? 1 : 0.3,
    satisfied: fits,
    explanation: fits ? "Capacité adaptée à votre nombre d'invités." : "Capacité potentiellement inadaptée à votre nombre d'invités.",
  };
}

function scoreExperience(vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (vendor.experienceYears === null) {
    return { key: "experience", label: "Expérience", weight, score: 0.5, satisfied: false, explanation: "Expérience non renseignée." };
  }
  const score = Math.min(1, vendor.experienceYears / 10);
  return {
    key: "experience",
    label: "Expérience",
    weight,
    score,
    satisfied: vendor.experienceYears >= 3,
    explanation: `${vendor.experienceYears} an(s) d'expérience en mariage.`,
  };
}

function scoreReviews(vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (vendor.ratingAverage === null) {
    return { key: "reviews", label: "Avis", weight, score: 0.5, satisfied: false, explanation: "Pas encore d'avis." };
  }
  return {
    key: "reviews",
    label: "Avis",
    weight,
    score: vendor.ratingAverage / 5,
    satisfied: vendor.ratingAverage >= 4,
    explanation: `Note moyenne de ${vendor.ratingAverage.toFixed(1)}/5.`,
  };
}

function scorePreferences(couple: CoupleMatchProfile, vendor: VendorMatchProfile): MatchCriterionResult {
  const weight = 0;
  if (couple.preferenceTags.length === 0) {
    return { key: "preferences", label: "Préférences", weight, score: 0.5, satisfied: false, explanation: "Aucune préférence renseignée." };
  }
  const matchingTags = couple.preferenceTags.filter((tag) => vendor.tags.includes(tag));
  const score = matchingTags.length / couple.preferenceTags.length;
  return {
    key: "preferences",
    label: "Préférences",
    weight,
    score,
    satisfied: score > 0,
    explanation: matchingTags.length > 0 ? `Correspond à ${matchingTags.length} de vos préférences.` : "Ne correspond pas à vos préférences.",
  };
}

/**
 * Computes a Wedding Match score. Symmetric by design: the same function
 * powers both the couple → vendor recommendations (§16-17) and the vendor →
 * couple "opportunités" reverse matching (§18) — only the caller's iteration
 * direction differs, see `rankVendorsForCouple` / `rankCouplesForVendor`.
 */
export function computeMatchScore(
  couple: CoupleMatchProfile,
  vendor: VendorMatchProfile,
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
): MatchResult {
  const criteria: MatchCriterionResult[] = [
    { ...scoreBudget(couple, vendor), weight: weights.budget },
    { ...scoreLocation(couple, vendor), weight: weights.location },
    { ...scoreAvailability(couple, vendor), weight: weights.availability },
    { ...scoreStyle(couple, vendor), weight: weights.style },
    { ...scoreWeddingType(couple, vendor), weight: weights.weddingType },
    { ...scoreCapacity(couple, vendor), weight: weights.capacity },
    { ...scoreExperience(vendor), weight: weights.experience },
    { ...scoreReviews(vendor), weight: weights.reviews },
    { ...scorePreferences(couple, vendor), weight: weights.preferences },
  ];

  const weightedScore = criteria.reduce((total, criterion) => total + criterion.score * criterion.weight, 0);

  return {
    vendorId: vendor.vendorId,
    score: Math.round(weightedScore * 100),
    criteria,
  };
}

export function rankVendorsForCouple(
  couple: CoupleMatchProfile,
  vendors: VendorMatchProfile[],
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
): MatchResult[] {
  return vendors
    .map((vendor) => computeMatchScore(couple, vendor, weights))
    .sort((a, b) => b.score - a.score);
}

/** Vendor-side "opportunités" view (§18): same engine, couples ranked instead of vendors. */
export function rankCouplesForVendor(
  vendor: VendorMatchProfile,
  couples: (CoupleMatchProfile & { weddingId: string })[],
  weights: MatchWeights = DEFAULT_MATCH_WEIGHTS,
): (MatchResult & { weddingId: string })[] {
  return couples
    .map((couple) => ({ ...computeMatchScore(couple, vendor, weights), weddingId: couple.weddingId }))
    .sort((a, b) => b.score - a.score);
}

/** Top explanations to surface in the UI (§17 — never show a bare percentage). */
export function topReasons(result: MatchResult, limit = 5): MatchCriterionResult[] {
  return [...result.criteria]
    .filter((criterion) => criterion.satisfied)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}
