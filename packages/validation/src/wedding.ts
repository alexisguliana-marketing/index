import { z } from "zod";

export const weddingStyleSchema = z.enum([
  "rustic",
  "classic",
  "boho",
  "luxury",
  "urban",
  "beach",
  "vintage",
  "modern",
  "other",
]);

export const ceremonyTypeSchema = z.enum(["religious", "civil", "secular", "other"]);

export const budgetTierSchema = z.enum(["economical", "moderate", "premium", "luxury"]);

export const createWeddingSchema = z.object({
  partner1FirstName: z.string().trim().min(1).max(80),
  partner2FirstName: z.string().trim().min(1).max(80),
  date: z.string().date().nullable().optional(),
  isDateFlexible: z.boolean().default(false),
  location: z.string().trim().max(160).nullable().optional(),
  isVenueKnown: z.boolean().default(false),
  guestCountEstimate: z.number().int().min(0).max(5000).nullable().optional(),
  budgetTotal: z.number().min(0).nullable().optional(),
  style: weddingStyleSchema.nullable().optional(),
  ambiance: z.string().trim().max(200).nullable().optional(),
  ceremonyType: ceremonyTypeSchema.nullable().optional(),
  budgetTier: budgetTierSchema.nullable().optional(),
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const taskStatusSchema = z.enum(["todo", "in_progress", "done"]);
export const taskPrioritySchema = z.enum(["low", "medium", "high"]);
export const taskCategorySchema = z.enum([
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
]);

export const createTaskSchema = z.object({
  weddingId: z.string().uuid(),
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).nullable().optional(),
  category: taskCategorySchema,
  dueDate: z.string().date().nullable().optional(),
  priority: taskPrioritySchema.default("medium"),
  status: taskStatusSchema.default("todo"),
  assigneeMemberId: z.string().uuid().nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const createBudgetItemSchema = z.object({
  weddingId: z.string().uuid(),
  category: taskCategorySchema,
  label: z.string().trim().min(1).max(120),
  planned: z.number().min(0),
  spent: z.number().min(0).default(0),
});

export type CreateBudgetItemInput = z.infer<typeof createBudgetItemSchema>;

export const guestGroupSchema = z.enum(["family", "friends", "colleagues", "witnesses", "other"]);
export const guestRsvpStatusSchema = z.enum(["pending", "confirmed", "declined"]);

export const createGuestSchema = z.object({
  weddingId: z.string().uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  group: guestGroupSchema,
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().max(30).nullable().optional(),
  rsvpStatus: guestRsvpStatusSchema.default("pending"),
  plusOne: z.boolean().default(false),
  childrenCount: z.number().int().min(0).max(20).default(0),
  needsAccommodation: z.boolean().default(false),
  mealPreference: z.string().trim().max(120).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
