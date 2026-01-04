import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { logClinicianAction } from "./audit";

export type PermissionName = 
  | 'content:read'
  | 'content:write'
  | 'content:delete'
  | 'patient:read'
  | 'patient:write'
  | 'patient:delete'
  | 'assessment:read'
  | 'assessment:write'
  | 'email:send'
  | 'user:manage'
  | 'audit:view'
  | 'settings:manage'
  | 'admin:access';

const DEFAULT_PERMISSIONS: { name: PermissionName; description: string; category: string }[] = [
  { name: 'content:read', description: 'View educational content', category: 'content' },
  { name: 'content:write', description: 'Create and edit content', category: 'content' },
  { name: 'content:delete', description: 'Delete content', category: 'content' },
  { name: 'patient:read', description: 'View patient information', category: 'patient' },
  { name: 'patient:write', description: 'Create and update patient records', category: 'patient' },
  { name: 'patient:delete', description: 'Delete patient records', category: 'patient' },
  { name: 'assessment:read', description: 'View assessments and results', category: 'assessment' },
  { name: 'assessment:write', description: 'Create and manage assessments', category: 'assessment' },
  { name: 'email:send', description: 'Send emails to patients', category: 'email' },
  { name: 'user:manage', description: 'Manage user accounts', category: 'user' },
  { name: 'audit:view', description: 'View audit logs', category: 'audit' },
  { name: 'settings:manage', description: 'Manage system settings', category: 'settings' },
  { name: 'admin:access', description: 'Access admin panel', category: 'admin' },
];

const ROLE_PERMISSIONS: Record<string, PermissionName[]> = {
  clinician: [
    'content:read',
    'content:write',
    'patient:read',
    'patient:write',
    'assessment:read',
    'assessment:write',
    'email:send',
  ],
  admin: [
    'content:read',
    'content:write',
    'content:delete',
    'patient:read',
    'patient:write',
    'patient:delete',
    'assessment:read',
    'assessment:write',
    'email:send',
    'user:manage',
    'audit:view',
    'settings:manage',
    'admin:access',
  ],
  readonly: [
    'content:read',
    'patient:read',
    'assessment:read',
  ],
  support: [
    'content:read',
    'patient:read',
    'assessment:read',
    'audit:view',
  ],
};

export async function seedPermissions(): Promise<void> {
  const existingPermissions = await storage.getPermissions();
  
  for (const perm of DEFAULT_PERMISSIONS) {
    const exists = existingPermissions.find(p => p.name === perm.name);
    if (!exists) {
      const created = await storage.createPermission(perm);
      console.log(`[RBAC] Created permission: ${perm.name}`);
      
      // Assign to appropriate roles
      for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
        if (permissions.includes(perm.name)) {
          await storage.assignPermissionToRole(role, created.id);
        }
      }
    }
  }
}

export function requirePermission(permissionName: PermissionName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user;
    const hasPermission = await storage.hasPermission(user.role, permissionName);

    if (!hasPermission) {
      await logClinicianAction(req, user, 'permission_denied', {
        details: { 
          requiredPermission: permissionName,
          userRole: user.role 
        },
        outcome: 'denied',
      });
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}

export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      await logClinicianAction(req, req.user, 'permission_denied', {
        details: { 
          requiredRoles: roles,
          userRole: req.user.role 
        },
        outcome: 'denied',
      });
      return res.status(403).json({ error: "Insufficient role privileges" });
    }

    next();
  };
}
