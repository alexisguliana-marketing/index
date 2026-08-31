import type { TaskCategory, VendorCategorySlug } from "@wedding-univers/types";

/**
 * Crosswalk between vendor professions (§12, `VENDOR_PROFESSIONS`) and
 * budget/task categories (§6, `TASK_CATEGORIES`) — the two taxonomies were
 * designed independently (one describes trades, the other planning
 * activities) and don't share slugs. Used only to find the couple's
 * relevant budgeted amount when scoring a Wedding Match (§16 "Budget"
 * criterion): e.g. a photographer's match uses the "photography" budget
 * line, if the couple has one.
 */
export const VENDOR_TO_TASK_CATEGORY: Record<VendorCategorySlug, TaskCategory> = {
  photographer: "photography",
  videographer: "video",
  caterer: "catering",
  dj: "music",
  musician: "music",
  florist: "flowers",
  decorator: "decoration",
  wedding_planner: "administrative",
  venue: "venue",
  bridal_wear: "dress",
  groom_wear: "suit",
  jewelry: "other",
  hair: "beauty",
  makeup: "beauty",
  pastry: "catering",
  transport: "transport",
  rental: "other",
  entertainment: "other",
  stationery: "invitations",
  other: "other",
};
