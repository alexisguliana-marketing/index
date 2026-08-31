import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BUDGET_TIERS,
  CEREMONY_TYPES,
  GUEST_GROUPS,
  TASK_CATEGORIES,
  VENDOR_PROFESSIONS,
  WEDDING_ROLES,
  WEDDING_STYLES,
} from "../taxonomies";

/**
 * These taxonomies mirror `packages/types/src/enums.ts` and the matching
 * `check` constraints in `supabase/migrations` — all three must stay in
 * sync. Listing the enum values again here (rather than importing the
 * union type, which TypeScript can't turn into a runtime array) catches
 * silent drift: a slug added to one place and forgotten in the others.
 */
test("every WeddingRole has a label", () => {
  const roles = ["admin", "witness", "planner", "guest_manager", "member"];
  const labelled = WEDDING_ROLES.map((role) => role.slug);
  assert.deepEqual([...labelled].sort(), [...roles].sort());
});

test("every WeddingStyle has a label", () => {
  const styles = ["rustic", "classic", "boho", "luxury", "urban", "beach", "vintage", "modern", "other"];
  assert.deepEqual(
    WEDDING_STYLES.map((style) => style.slug).sort(),
    [...styles].sort(),
  );
});

test("every CeremonyType has a label", () => {
  assert.deepEqual(
    CEREMONY_TYPES.map((type) => type.slug).sort(),
    ["religious", "civil", "secular", "other"].sort(),
  );
});

test("every BudgetTier has a label", () => {
  assert.deepEqual(
    BUDGET_TIERS.map((tier) => tier.slug).sort(),
    ["economical", "moderate", "premium", "luxury"].sort(),
  );
});

test("every GuestGroup has a label", () => {
  assert.deepEqual(
    GUEST_GROUPS.map((group) => group.slug).sort(),
    ["family", "friends", "colleagues", "witnesses", "other"].sort(),
  );
});

test("every TaskCategory has a label", () => {
  const categories = [
    "venue",
    "catering",
    "photography",
    "video",
    "music",
    "decoration",
    "flowers",
    "dress",
    "suit",
    "beauty",
    "invitations",
    "transport",
    "accommodation",
    "ceremony",
    "administrative",
    "other",
  ];
  assert.deepEqual(
    TASK_CATEGORIES.map((category) => category.slug).sort(),
    [...categories].sort(),
  );
});

test("every VendorCategorySlug has a label", () => {
  const professions = [
    "photographer",
    "videographer",
    "caterer",
    "dj",
    "musician",
    "florist",
    "decorator",
    "wedding_planner",
    "venue",
    "bridal_wear",
    "groom_wear",
    "jewelry",
    "hair",
    "makeup",
    "pastry",
    "transport",
    "rental",
    "entertainment",
    "stationery",
    "other",
  ];
  assert.deepEqual(
    VENDOR_PROFESSIONS.map((profession) => profession.slug).sort(),
    [...professions].sort(),
  );
});

test("no taxonomy has duplicate slugs", () => {
  for (const taxonomy of [WEDDING_ROLES, WEDDING_STYLES, CEREMONY_TYPES, BUDGET_TIERS, GUEST_GROUPS, TASK_CATEGORIES, VENDOR_PROFESSIONS]) {
    const slugs = taxonomy.map((entry) => entry.slug);
    assert.equal(new Set(slugs).size, slugs.length);
  }
});
