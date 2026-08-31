import type { MediaKind, VendorCategorySlug, WeddingStyle } from "./enums";

export interface Vendor {
  id: string;
  ownerUserId: string;
  name: string;
  tagline: string | null;
  description: string | null;
  city: string | null;
  travelRadiusKm: number | null;
  experienceYears: number | null;
  capacityMin: number | null;
  capacityMax: number | null;
  ratingAverage: number | null;
  ratingCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorCategory {
  id: string;
  slug: VendorCategorySlug;
  label: string;
  parentId: string | null;
}

export interface VendorCategoryAssignment {
  vendorId: string;
  categoryId: string;
}

export interface VendorService {
  id: string;
  vendorId: string;
  name: string;
  description: string | null;
  price: number;
  createdAt: string;
}

export interface VendorLocation {
  id: string;
  vendorId: string;
  city: string;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
}

export interface VendorAvailability {
  id: string;
  vendorId: string;
  date: string;
  isAvailable: boolean;
}

export interface VendorPortfolioItem {
  id: string;
  vendorId: string;
  mediaId: string;
  kind: MediaKind;
  serviceId: string | null;
  categoryId: string | null;
  style: WeddingStyle | null;
  weddingId: string | null;
  createdAt: string;
}

export interface VendorReview {
  id: string;
  vendorId: string;
  weddingId: string;
  authorUserId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
}

export interface VendorRelationship {
  id: string;
  vendorAId: string;
  vendorBId: string;
  weddingId: string | null;
  createdAt: string;
}
