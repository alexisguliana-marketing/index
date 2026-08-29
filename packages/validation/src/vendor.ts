import { z } from "zod";

export const vendorCategorySlugSchema = z.enum([
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
]);

export const createVendorSchema = z.object({
  name: z.string().trim().min(1).max(140),
  tagline: z.string().trim().max(160).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  city: z.string().trim().max(120).nullable().optional(),
  travelRadiusKm: z.number().int().min(0).max(2000).nullable().optional(),
  experienceYears: z.number().int().min(0).max(80).nullable().optional(),
  capacityMin: z.number().int().min(0).nullable().optional(),
  capacityMax: z.number().int().min(0).nullable().optional(),
  categorySlugs: z.array(vendorCategorySlugSchema).min(1),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;

export const createVendorServiceSchema = z.object({
  vendorId: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).nullable().optional(),
  price: z.number().min(0),
});

export type CreateVendorServiceInput = z.infer<typeof createVendorServiceSchema>;

export const vendorSearchFiltersSchema = z.object({
  categorySlug: vendorCategorySlugSchema.optional(),
  city: z.string().trim().max(120).optional(),
  maxDistanceKm: z.number().int().min(0).max(2000).optional(),
  maxPrice: z.number().min(0).optional(),
  style: z.string().trim().max(40).optional(),
  availableOn: z.string().date().optional(),
  minRating: z.number().min(0).max(5).optional(),
});

export type VendorSearchFilters = z.infer<typeof vendorSearchFiltersSchema>;
