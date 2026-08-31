import type { WeddingRole } from "@wedding-univers/types";

/**
 * Role-based permission matrix for a wedding project (cahier des charges §10).
 * Built in from the foundation so every feature phase can gate actions
 * through `hasPermission` instead of re-inventing role checks.
 */
export type WeddingPermission =
  | "wedding.edit"
  | "wedding.delete"
  | "members.invite"
  | "members.remove"
  | "tasks.manage"
  | "budget.manage"
  | "budget.view"
  | "guests.manage"
  | "vendors.contact"
  | "favorites.manage";

const ROLE_PERMISSIONS: Record<WeddingRole, WeddingPermission[]> = {
  admin: [
    "wedding.edit",
    "wedding.delete",
    "members.invite",
    "members.remove",
    "tasks.manage",
    "budget.manage",
    "budget.view",
    "guests.manage",
    "vendors.contact",
    "favorites.manage",
  ],
  planner: [
    "tasks.manage",
    "budget.manage",
    "budget.view",
    "guests.manage",
    "vendors.contact",
    "favorites.manage",
  ],
  witness: ["tasks.manage", "budget.view", "favorites.manage"],
  guest_manager: ["guests.manage", "budget.view"],
  member: ["budget.view"],
};

export function getPermissionsForRole(role: WeddingRole): WeddingPermission[] {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(role: WeddingRole, permission: WeddingPermission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
