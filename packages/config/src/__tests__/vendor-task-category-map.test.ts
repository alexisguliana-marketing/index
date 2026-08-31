import assert from "node:assert/strict";
import { test } from "node:test";

import { TASK_CATEGORIES, VENDOR_PROFESSIONS } from "../taxonomies";
import { VENDOR_TO_TASK_CATEGORY } from "../vendor-task-category-map";

test("every vendor profession has a task category mapping", () => {
  for (const profession of VENDOR_PROFESSIONS) {
    assert.ok(
      profession.slug in VENDOR_TO_TASK_CATEGORY,
      `missing mapping for vendor profession "${profession.slug}"`,
    );
  }
});

test("every mapped value is a real task category slug", () => {
  const validSlugs = new Set(TASK_CATEGORIES.map((category) => category.slug));
  for (const [vendorSlug, taskSlug] of Object.entries(VENDOR_TO_TASK_CATEGORY)) {
    assert.ok(validSlugs.has(taskSlug), `"${vendorSlug}" maps to unknown task category "${taskSlug}"`);
  }
});
