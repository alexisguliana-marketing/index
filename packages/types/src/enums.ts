/**
 * Enumerations shared across web, mobile and Supabase.
 * Kept in sync with `supabase/migrations` — update both together.
 */

export type WeddingRole = "admin" | "witness" | "planner" | "guest_manager" | "member";

export type TaskStatus = "todo" | "in_progress" | "done";

export type TaskPriority = "low" | "medium" | "high";

export type TaskCategory =
  | "venue"
  | "catering"
  | "photography"
  | "video"
  | "music"
  | "decoration"
  | "flowers"
  | "dress"
  | "suit"
  | "beauty"
  | "invitations"
  | "transport"
  | "accommodation"
  | "ceremony"
  | "administrative"
  | "other";

export type GuestGroup = "family" | "friends" | "colleagues" | "witnesses" | "other";

export type GuestRsvpStatus = "pending" | "confirmed" | "declined";

export type CeremonyType = "religious" | "civil" | "secular" | "other";

export type WeddingStyle =
  | "rustic"
  | "classic"
  | "boho"
  | "luxury"
  | "urban"
  | "beach"
  | "vintage"
  | "modern"
  | "other";

export type BudgetTier = "economical" | "moderate" | "premium" | "luxury";

export type VendorCategorySlug =
  | "photographer"
  | "videographer"
  | "caterer"
  | "dj"
  | "musician"
  | "florist"
  | "decorator"
  | "wedding_planner"
  | "venue"
  | "bridal_wear"
  | "groom_wear"
  | "jewelry"
  | "hair"
  | "makeup"
  | "pastry"
  | "transport"
  | "rental"
  | "entertainment"
  | "stationery"
  | "other";

export type NotificationType =
  | "task_created"
  | "task_overdue"
  | "invitation_received"
  | "member_joined"
  | "new_message"
  | "vendor_reply"
  | "new_favorite"
  | "recommendation"
  | "project_activity";

export type ConversationParticipantType = "couple" | "vendor";

export type MediaKind = "photo" | "video";
