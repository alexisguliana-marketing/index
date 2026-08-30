import type {
  BudgetTier,
  CeremonyType,
  GuestGroup,
  TaskCategory,
  VendorCategorySlug,
  WeddingStyle,
} from "@wedding-univers/types";

/** Wedding styles (cahier des charges §4/§31). */
export const WEDDING_STYLES: { slug: WeddingStyle; label: string }[] = [
  { slug: "rustic", label: "Champêtre" },
  { slug: "classic", label: "Classique" },
  { slug: "boho", label: "Bohème" },
  { slug: "luxury", label: "Luxe" },
  { slug: "urban", label: "Urbain" },
  { slug: "beach", label: "Bord de mer" },
  { slug: "vintage", label: "Vintage" },
  { slug: "modern", label: "Moderne" },
  { slug: "other", label: "Autre" },
];

/** Ceremony types (cahier des charges §4). */
export const CEREMONY_TYPES: { slug: CeremonyType; label: string }[] = [
  { slug: "religious", label: "Religieuse" },
  { slug: "civil", label: "Civile" },
  { slug: "secular", label: "Laïque" },
  { slug: "other", label: "Autre" },
];

/** Budget tiers, i.e. "niveau de gamme" (cahier des charges §4). */
export const BUDGET_TIERS: { slug: BudgetTier; label: string }[] = [
  { slug: "economical", label: "Économique" },
  { slug: "moderate", label: "Modéré" },
  { slug: "premium", label: "Premium" },
  { slug: "luxury", label: "Luxe" },
];

/** Task categories (cahier des charges §6). */
export const TASK_CATEGORIES: { slug: TaskCategory; label: string }[] = [
  { slug: "venue", label: "Lieu" },
  { slug: "catering", label: "Traiteur" },
  { slug: "photography", label: "Photographie" },
  { slug: "video", label: "Vidéo" },
  { slug: "music", label: "Musique" },
  { slug: "decoration", label: "Décoration" },
  { slug: "flowers", label: "Fleurs" },
  { slug: "dress", label: "Robe" },
  { slug: "suit", label: "Costume" },
  { slug: "beauty", label: "Beauté" },
  { slug: "invitations", label: "Invitations" },
  { slug: "transport", label: "Transport" },
  { slug: "accommodation", label: "Hébergement" },
  { slug: "ceremony", label: "Cérémonie" },
  { slug: "administrative", label: "Administratif" },
  { slug: "other", label: "Autre" },
];

/** Guest groups (cahier des charges §9). */
export const GUEST_GROUPS: { slug: GuestGroup; label: string }[] = [
  { slug: "family", label: "Famille" },
  { slug: "friends", label: "Amis" },
  { slug: "colleagues", label: "Collègues" },
  { slug: "witnesses", label: "Témoins" },
  { slug: "other", label: "Autres" },
];

/**
 * Vendor categories, hierarchical (cahier des charges §12 — "Photographe → mariage →
 * cérémonie → réception"). `parentSlug` is null for top-level professions; sub-tags
 * describe the context a portfolio item was shot in.
 */
export interface VendorCategoryDefinition {
  slug: VendorCategorySlug | string;
  label: string;
  parentSlug: VendorCategorySlug | null;
}

export const VENDOR_PROFESSIONS: { slug: VendorCategorySlug; label: string }[] = [
  { slug: "photographer", label: "Photographe" },
  { slug: "videographer", label: "Vidéaste" },
  { slug: "caterer", label: "Traiteur" },
  { slug: "dj", label: "DJ" },
  { slug: "musician", label: "Musicien" },
  { slug: "florist", label: "Fleuriste" },
  { slug: "decorator", label: "Décorateur" },
  { slug: "wedding_planner", label: "Wedding planner" },
  { slug: "venue", label: "Lieu de réception" },
  { slug: "bridal_wear", label: "Robe" },
  { slug: "groom_wear", label: "Costume" },
  { slug: "jewelry", label: "Bijouterie" },
  { slug: "hair", label: "Coiffure" },
  { slug: "makeup", label: "Maquillage" },
  { slug: "pastry", label: "Pâtisserie" },
  { slug: "transport", label: "Transport" },
  { slug: "rental", label: "Location" },
  { slug: "entertainment", label: "Animation" },
  { slug: "stationery", label: "Papeterie" },
  { slug: "other", label: "Autre" },
];

export const VENDOR_CONTEXT_TAGS: VendorCategoryDefinition[] = [
  { slug: "wedding", label: "Mariage", parentSlug: null },
  { slug: "ceremony", label: "Cérémonie", parentSlug: null },
  { slug: "reception", label: "Réception", parentSlug: null },
  { slug: "engagement", label: "Fiançailles", parentSlug: null },
];
