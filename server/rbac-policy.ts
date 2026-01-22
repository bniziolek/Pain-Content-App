/**
 * Architecture: RBAC policy definitions used by authorization helpers.
 */

export type PermissionName =
  | "content:read"
  | "content:write"
  | "content:delete"
  | "patient:read"
  | "patient:write"
  | "patient:delete"
  | "assessment:read"
  | "assessment:write"
  | "email:send"
  | "user:manage"
  | "user:permissions"
  | "audit:view"
  | "audit:export"
  | "settings:manage"
  | "billing:view"
  | "billing:manage"
  | "admin:access"
  | "super:impersonate";

export const DEFAULT_PERMISSIONS: { name: PermissionName; description: string; category: string }[] = [
  { name: "content:read", description: "View educational content", category: "content" },
  { name: "content:write", description: "Create and edit content", category: "content" },
  { name: "content:delete", description: "Delete content", category: "content" },
  { name: "patient:read", description: "View patient information", category: "patient" },
  { name: "patient:write", description: "Create and update patient records", category: "patient" },
  { name: "patient:delete", description: "Delete patient records", category: "patient" },
  { name: "assessment:read", description: "View assessments and results", category: "assessment" },
  { name: "assessment:write", description: "Create and manage assessments", category: "assessment" },
  { name: "email:send", description: "Send emails to patients", category: "email" },
  { name: "user:manage", description: "Manage user accounts", category: "user" },
  { name: "user:permissions", description: "Manage user permissions", category: "user" },
  { name: "audit:view", description: "View audit logs", category: "audit" },
  { name: "audit:export", description: "Export audit logs and compliance reports", category: "audit" },
  { name: "settings:manage", description: "Manage system settings", category: "settings" },
  { name: "billing:view", description: "View billing and subscription info", category: "billing" },
  { name: "billing:manage", description: "Manage subscriptions and apply credits", category: "billing" },
  { name: "admin:access", description: "Access admin panel", category: "admin" },
  { name: "super:impersonate", description: "Switch persona to view as other roles", category: "super" },
];

export const ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
  clinician: [
    "content:read",
    "content:write",
    "patient:read",
    "patient:write",
    "assessment:read",
    "assessment:write",
    "email:send",
  ],
  admin: [
    "content:read",
    "content:write",
    "content:delete",
    "patient:read",
    "patient:write",
    "patient:delete",
    "assessment:read",
    "assessment:write",
    "email:send",
    "user:manage",
    "audit:view",
    "settings:manage",
    "billing:view",
    "admin:access",
  ],
  super_admin: [
    "content:read",
    "content:write",
    "content:delete",
    "patient:read",
    "patient:write",
    "patient:delete",
    "assessment:read",
    "assessment:write",
    "email:send",
    "user:manage",
    "user:permissions",
    "audit:view",
    "audit:export",
    "settings:manage",
    "billing:view",
    "billing:manage",
    "admin:access",
    "super:impersonate",
  ],
  readonly: [
    "content:read",
    "patient:read",
    "assessment:read",
  ],
  support: [
    "content:read",
    "patient:read",
    "assessment:read",
    "audit:view",
  ],
};

export function isSuperAdmin(user: { role: string }): boolean {
  return user.role === "super_admin";
}

export function getEffectiveRole(user: { role: string; activePersona?: string | null }): string {
  if (user.activePersona && isSuperAdmin(user)) {
    return user.activePersona;
  }
  return user.role;
}
