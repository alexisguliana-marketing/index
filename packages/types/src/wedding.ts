import type {
  BudgetTier,
  CeremonyType,
  GuestGroup,
  GuestRsvpStatus,
  TaskCategory,
  TaskPriority,
  TaskStatus,
  WeddingRole,
  WeddingStyle,
} from "./enums";

export interface Wedding {
  id: string;
  createdBy: string;
  partner1FirstName: string;
  partner2FirstName: string;
  date: string | null;
  isDateFlexible: boolean;
  location: string | null;
  isVenueKnown: boolean;
  guestCountEstimate: number | null;
  budgetTotal: number | null;
  style: WeddingStyle | null;
  ceremonyType: CeremonyType | null;
  budgetTier: BudgetTier | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeddingMember {
  id: string;
  weddingId: string;
  userId: string;
  role: WeddingRole;
  invitedAt: string;
  joinedAt: string | null;
}

export interface Task {
  id: string;
  weddingId: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  dueDate: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeMemberId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItem {
  id: string;
  weddingId: string;
  category: TaskCategory;
  label: string;
  planned: number;
  spent: number;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetSummary {
  total: number;
  spent: number;
  committed: number;
  remaining: number;
  percentUsed: number;
}

export interface Guest {
  id: string;
  weddingId: string;
  firstName: string;
  lastName: string;
  group: GuestGroup;
  email: string | null;
  phone: string | null;
  rsvpStatus: GuestRsvpStatus;
  plusOne: boolean;
  childrenCount: number;
  needsAccommodation: boolean;
  mealPreference: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
