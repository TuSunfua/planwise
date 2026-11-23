export const ROLES = ["owner"] as const;
export type Role = (typeof ROLES)[number];

export type Permission = "project:view";

// A new key is an entry in Permission and in the roles that hold it.
const GRANTS: Record<Role, readonly Permission[]> = {
  owner: ["project:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return Object.hasOwn(GRANTS, role) && GRANTS[role].includes(permission);
}
