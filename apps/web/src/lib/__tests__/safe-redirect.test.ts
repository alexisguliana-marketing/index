import assert from "node:assert/strict";
import { test } from "node:test";

import { safeRedirectTarget } from "../safe-redirect";

test("accepts a same-site relative path", () => {
  assert.equal(safeRedirectTarget("/compte"), "/compte");
});

test("falls back on a protocol-relative URL (open redirect attempt)", () => {
  assert.equal(safeRedirectTarget("//evil.example.com"), "/compte");
});

test("falls back on an absolute URL", () => {
  assert.equal(safeRedirectTarget("https://evil.example.com"), "/compte");
});

test("falls back on a missing value", () => {
  assert.equal(safeRedirectTarget(null), "/compte");
});

test("honors a custom fallback", () => {
  assert.equal(safeRedirectTarget(null, "/connexion"), "/connexion");
});
