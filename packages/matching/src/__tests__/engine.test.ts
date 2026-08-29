import assert from "node:assert/strict";
import { test } from "node:test";

import { computeMatchScore, topReasons } from "../engine";
import type { CoupleMatchProfile, VendorMatchProfile } from "../types";

const couple: CoupleMatchProfile = {
  weddingDate: "2027-09-12",
  budgetForCategory: 2000,
  latitude: 49.1829,
  longitude: -0.3707,
  style: "rustic",
  ceremonyType: "secular",
  guestCountEstimate: 120,
  preferenceTags: ["outdoor", "natural-light"],
};

const goodVendor: VendorMatchProfile = {
  vendorId: "vendor-good",
  priceMin: 1200,
  priceMax: 2500,
  latitude: 49.1,
  longitude: -0.4,
  travelRadiusKm: 100,
  isAvailableOnDate: true,
  styles: ["rustic", "boho"],
  ceremonyTypes: ["secular", "civil"],
  capacityMin: 50,
  capacityMax: 200,
  experienceYears: 8,
  ratingAverage: 4.9,
  tags: ["outdoor", "natural-light"],
};

const poorVendor: VendorMatchProfile = {
  ...goodVendor,
  vendorId: "vendor-poor",
  priceMin: 5000,
  priceMax: 8000,
  isAvailableOnDate: false,
  styles: ["luxury"],
  ceremonyTypes: ["religious"],
  tags: [],
};

test("scores a well-matched vendor highly and explains why", () => {
  const result = computeMatchScore(couple, goodVendor);
  assert.ok(result.score >= 80, `expected high score, got ${result.score}`);
  const reasons = topReasons(result);
  assert.ok(reasons.length > 0);
  assert.ok(reasons.every((r) => r.satisfied));
});

test("scores a poorly-matched vendor lower than a well-matched one", () => {
  const good = computeMatchScore(couple, goodVendor);
  const poor = computeMatchScore(couple, poorVendor);
  assert.ok(poor.score < good.score);
});

test("weights still sum to a 0..100 range", () => {
  const result = computeMatchScore(couple, goodVendor);
  assert.ok(result.score >= 0 && result.score <= 100);
});
