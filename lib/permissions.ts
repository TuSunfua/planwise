export const ROLES = ["owner"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = ["project:view"] as const;
export type Permission = (typeof PERMISSIONS)[number];

// A new key is an entry in PERMISSIONS and in the roles that hold it.
const GRANTS: Record<Role, readonly Permission[]> = {
  owner: ["project:view"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return Object.hasOwn(GRANTS, role) && GRANTS[role].includes(permission);
}
