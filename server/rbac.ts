/**
 * Architecture: Authorization helpers for role-based access control.
 */

import type { Request, Response, NextFunction } from "express";
import { createAppContext, checkUserPermission } from "./application";
import {
  logAuditEvent,
  logClinicianAction,
  logPatientAction,
  logSystemAction,
} from "./infrastructure/audit";
import { buildAuditRequestContext } from "./http/audit-context";
import {
  DEFAULT_PERMISSIONS,
  ROLE_PERMISSIONS,
  getEffectiveRole,
  isSuperAdmin,
} from "./rbac-policy";
import type { PermissionName } from "./rbac-policy";

const appContext = createAppContext({
  audit: { logAuditEvent, logClinicianAction, logPatientAction, logSystemAction },
});

export { DEFAULT_PERMISSIONS, ROLE_PERMISSIONS, isSuperAdmin, getEffectiveRole };
export type { PermissionName };

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
    const hasPermission = await checkUserPermission(appContext, {
      userId: user.id,
      userRole: effectiveRole,
      permissionName,
    });

    if (!hasPermission) {
      await logClinicianAction(buildAuditRequestContext(req), user, 'permission_denied', {
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
      await logClinicianAction(buildAuditRequestContext(req), req.user, 'permission_denied', {
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
      await logClinicianAction(buildAuditRequestContext(req), req.user, 'permission_denied', {
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

export { seedPermissions } from "./application/rbac/seed-permissions";
