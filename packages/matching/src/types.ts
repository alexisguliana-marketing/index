import type { CeremonyType, WeddingStyle } from "@wedding-univers/types";

export interface CoupleMatchProfile {
  weddingDate: string | null;
  budgetForCategory: number | null;
  latitude: number | null;
  longitude: number | null;
  style: WeddingStyle | null;
  ceremonyType: CeremonyType | null;
  guestCountEstimate: number | null;
  preferenceTags: string[];
}

export interface VendorMatchProfile {
  vendorId: string;
  priceMin: number | null;
  priceMax: number | null;
  latitude: number | null;
  longitude: number | null;
  travelRadiusKm: number | null;
  isAvailableOnDate: boolean | null;
  styles: WeddingStyle[];
  ceremonyTypes: CeremonyType[];
  capacityMin: number | null;
  capacityMax: number | null;
  experienceYears: number | null;
  ratingAverage: number | null;
  tags: string[];
}

export type MatchCriterionKey =
  | "budget"
  | "location"
  | "availability"
  | "style"
  | "weddingType"
  | "capacity"
  | "experience"
  | "reviews"
  | "preferences";

export interface MatchCriterionResult {
  key: MatchCriterionKey;
  label: string;
  weight: number;
  /** Normalized 0..1 score for this criterion alone. */
  score: number;
  satisfied: boolean;
  /** Human-readable reason, e.g. "32 km de votre lieu" (cahier des charges §17). */
  explanation: string;
}

export interface MatchResult {
  vendorId: string;
  /** 0..100 overall compatibility score. */
  score: number;
  criteria: MatchCriterionResult[];
}
