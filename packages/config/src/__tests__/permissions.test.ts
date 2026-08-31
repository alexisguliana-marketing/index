import assert from "node:assert/strict";
import { test } from "node:test";

import { getPermissionsForRole, hasPermission, type WeddingPermission } from "../permissions";
import type { WeddingRole } from "@wedding-univers/types";

const ALL_ROLES: WeddingRole[] = ["admin", "witness", "planner", "guest_manager", "member"];

test("hasPermission agrees with getPermissionsForRole for every role", () => {
  const allPermissions: WeddingPermission[] = [
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
  ];

  for (const role of ALL_ROLES) {
    const granted = getPermissionsForRole(role);
    for (const permission of allPermissions) {
      assert.equal(
        hasPermission(role, permission),
        granted.includes(permission),
        `hasPermission(${role}, ${permission}) disagrees with getPermissionsForRole`,
      );
    }
  }
});

test("only admin can invite or remove members (§10-11 — RLS mirrors this)", () => {
  for (const role of ALL_ROLES) {
    const expected = role === "admin";
    assert.equal(hasPermission(role, "members.invite"), expected, `members.invite for ${role}`);
    assert.equal(hasPermission(role, "members.remove"), expected, `members.remove for ${role}`);
  }
});

test("admin has every permission", () => {
  const permissions = getPermissionsForRole("admin");
  assert.ok(permissions.length > 0);
  for (const role of ALL_ROLES) {
    for (const permission of getPermissionsForRole(role)) {
      assert.ok(permissions.includes(permission), `admin is missing ${permission} (granted to ${role})`);
    }
  }
});

test("every role can at least view the budget (§10)", () => {
  for (const role of ALL_ROLES) {
    assert.ok(hasPermission(role, "budget.view"), `${role} should have budget.view`);
  }
});

test("plain members have no management permissions", () => {
  const permissions = getPermissionsForRole("member");
  const managementPermissions = permissions.filter((permission) => permission !== "budget.view");
  assert.deepEqual(managementPermissions, []);
});
