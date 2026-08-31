import assert from "node:assert/strict";
import { test } from "node:test";

import { generateDefaultChecklist } from "../checklist";

test("generates only the rules that fall in the current window before the wedding", () => {
  const referenceDate = new Date("2026-01-01T00:00:00Z");
  const weddingDate = new Date("2026-08-01T00:00:00Z"); // ~7 months out

  const items = generateDefaultChecklist(weddingDate, referenceDate);

  assert.ok(items.length > 0);
  assert.ok(items.every((item) => item.title && item.category && item.priority));
  // 7 months out should include the 6-9 month bucket (e.g. la robe) …
  assert.ok(items.some((item) => item.title === "Choisir la robe de mariée"));
  // … but not the 12-18 month bucket (déjà passé) nor the last-month bucket (pas encore).
  assert.ok(!items.some((item) => item.title === "Définir le budget global"));
  assert.ok(!items.some((item) => item.title === "Essayage final de la tenue"));
});

test("suggested due dates land before the wedding date", () => {
  const referenceDate = new Date("2026-01-01T00:00:00Z");
  const weddingDate = new Date("2027-01-01T00:00:00Z");

  const items = generateDefaultChecklist(weddingDate, referenceDate);

  for (const item of items) {
    assert.ok(new Date(item.suggestedDueDate).getTime() <= weddingDate.getTime());
  }
});

test("returns nothing once the wedding date is in the past", () => {
  const referenceDate = new Date("2026-06-01T00:00:00Z");
  const weddingDate = new Date("2026-01-01T00:00:00Z");

  assert.deepEqual(generateDefaultChecklist(weddingDate, referenceDate), []);
});
