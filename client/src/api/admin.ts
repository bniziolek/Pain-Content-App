import { fetchAPI, jsonHeaders } from "./base";
import type { AuditLog } from "@shared/api-types";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: string;
  subscriptionStatus: string;
  subscriptionTier: string;
  subscriptionPeriodEnd: string | null;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
}

export interface AdminNote {
  id: string;
  userId: string;
  adminUserId: string;
  note: string;
  createdAt: string;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  createdAt: string;
}

// User Management
export async function getUsers(): Promise<PublicUser[]> {
  return fetchAPI("/admin/users");
}

export async function getUserById(id: string): Promise<PublicUser> {
  return fetchAPI(`/admin/users/${id}`);
}

export async function createUser(user: { email: string; name: string; password?: string; role?: string }): Promise<PublicUser> {
  return fetchAPI("/admin/users", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(user),
  });
}

export async function createTrialUser(email: string, name?: string): Promise<PublicUser> {
  return fetchAPI("/admin/create-trial-user", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ email, name }),
  });
}

export async function updateUser(id: string, updates: { name?: string; email?: string; role?: string }): Promise<PublicUser> {
  return fetchAPI(`/admin/users/${id}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function updateUserSubscription(id: string, updates: {
  subscriptionStatus?: string;
  subscriptionTier?: string;
  subscriptionPeriodEnd?: string;
}): Promise<PublicUser> {
  return fetchAPI(`/admin/users/${id}/subscription`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

export async function extendUserSubscription(id: string, days: number): Promise<PublicUser> {
  return fetchAPI(`/admin/users/${id}/extend-subscription`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ days }),
  });
}

export async function resetUserPassword(id: string, newPassword?: string): Promise<void> {
  await fetchAPI(`/admin/users/${id}/reset-password`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ newPassword }),
  });
}

export async function deleteUser(id: string): Promise<void> {
  await fetchAPI(`/admin/users/${id}`, { method: "DELETE" });
}

// Admin Stats
export async function getAdminStats(): Promise<any> {
  return fetchAPI("/admin/stats");
}

export async function getEnhancedAdminStats(): Promise<any> {
  return fetchAPI("/admin/enhanced-stats");
}

// Admin Notes
export async function getAdminNotes(userId: string): Promise<AdminNote[]> {
  return fetchAPI(`/admin/users/${userId}/notes`);
}

export async function createAdminNote(userId: string, note: string): Promise<AdminNote> {
  return fetchAPI(`/admin/users/${userId}/notes`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ note }),
  });
}

export async function deleteAdminNote(id: string): Promise<void> {
  await fetchAPI(`/admin/notes/${id}`, { method: "DELETE" });
}

// Login History
export async function getLoginHistory(userId: string): Promise<LoginHistoryEntry[]> {
  return fetchAPI(`/admin/users/${userId}/login-history`);
}

// User Content Activity
export async function getUserContentActivity(userId: string): Promise<any> {
  return fetchAPI(`/admin/users/${userId}/content-activity`);
}

// User Data Export
export async function exportUserData(userId: string): Promise<any> {
  return fetchAPI(`/admin/users/${userId}/export`);
}

// Admin Analytics
export async function getAdminAnalytics(): Promise<{
  subscriptionHealth: {
    totalActive: number;
    mrr: number;
    newThisMonth: number;
    canceledThisMonth: number;
    churnRate: string;
    averageRevenue: number;
  };
  usageMetrics: {
    totalClinicians: number;
    activeLastWeek: number;
    totalContentSent: number;
    totalAssessments: number;
    engagementRate: number;
  };
  growth: {
    signupsLast30Days: number;
    previousPeriod: number;
  };
}> {
  return fetchAPI("/admin/analytics");
}

// Audit Logs
export async function getAuditLogs(filters?: { userId?: string; action?: string; limit?: number }): Promise<AuditLog[]> {
  const params = new URLSearchParams();
  if (filters?.userId) params.set("userId", filters.userId);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.limit) params.set("limit", String(filters.limit));
  return fetchAPI(`/audit-logs?${params.toString()}`);
}
