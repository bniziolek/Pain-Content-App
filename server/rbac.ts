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
  | 'user:permissions'
  | 'audit:view'
  | 'audit:export'
  | 'settings:manage'
  | 'billing:view'
  | 'billing:manage'
  | 'admin:access'
  | 'super:impersonate';

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
  { name: 'user:permissions', description: 'Manage user permissions', category: 'user' },
  { name: 'audit:view', description: 'View audit logs', category: 'audit' },
  { name: 'audit:export', description: 'Export audit logs and compliance reports', category: 'audit' },
  { name: 'settings:manage', description: 'Manage system settings', category: 'settings' },
  { name: 'billing:view', description: 'View billing and subscription info', category: 'billing' },
  { name: 'billing:manage', description: 'Manage subscriptions and apply credits', category: 'billing' },
  { name: 'admin:access', description: 'Access admin panel', category: 'admin' },
  { name: 'super:impersonate', description: 'Switch persona to view as other roles', category: 'super' },
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
    'billing:view',
    'admin:access',
  ],
  super_admin: [
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
    'user:permissions',
    'audit:view',
    'audit:export',
    'settings:manage',
    'billing:view',
    'billing:manage',
    'admin:access',
    'super:impersonate',
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

export function isSuperAdmin(user: { role: string }): boolean {
  return user.role === 'super_admin';
}

export function getEffectiveRole(user: { role: string; activePersona?: string | null }): string {
  if (user.activePersona && isSuperAdmin(user)) {
    return user.activePersona;
  }
  return user.role;
}

export async function checkUserPermission(userId: string, userRole: string, permissionName: PermissionName): Promise<boolean> {
  if (userRole === 'super_admin') {
    return true;
  }
  
  const userOverride = await storage.getUserPermissionOverride(userId, permissionName);
  if (userOverride !== null) {
    return userOverride;
  }
  
  return await storage.hasPermission(userRole, permissionName);
}

export function requirePermission(permissionName: PermissionName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user;
    
    if (isSuperAdmin(user)) {
      return next();
    }
    
    const effectiveRole = getEffectiveRole(user);
    const hasPermission = await checkUserPermission(user.id, effectiveRole, permissionName);

    if (!hasPermission) {
      await logClinicianAction(req, user, 'permission_denied', {
        details: { 
          requiredPermission: permissionName,
          userRole: user.role,
          effectiveRole: effectiveRole
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

    if (isSuperAdmin(req.user)) {
      return next();
    }

    const effectiveRole = getEffectiveRole(req.user);
    if (!roles.includes(effectiveRole)) {
      await logClinicianAction(req, req.user, 'permission_denied', {
        details: { 
          requiredRoles: roles,
          userRole: req.user.role,
          effectiveRole: effectiveRole
        },
        outcome: 'denied',
      });
      return res.status(403).json({ error: "Insufficient role privileges" });
    }

    next();
  };
}

export function requireSuperAdmin() {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!isSuperAdmin(req.user)) {
      await logClinicianAction(req, req.user, 'permission_denied', {
        details: { 
          requiredRole: 'super_admin',
          userRole: req.user.role 
        },
        outcome: 'denied',
      });
      return res.status(403).json({ error: "Super admin access required" });
    }

    next();
  };
}

export { DEFAULT_PERMISSIONS, ROLE_PERMISSIONS };
