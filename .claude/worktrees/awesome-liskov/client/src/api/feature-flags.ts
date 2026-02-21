import { fetchAPI, jsonHeaders } from "./base";

export interface FeatureFlags {
  [key: string]: {
    isEnabled: boolean;
    value: string | null;
  };
}

export interface FeatureFlag {
  key: string;
  name: string;
  description: string | null;
  isEnabled: boolean;
  value: string | null;
  payload: any;
  category: string | null;
  tiersAllowed: string[] | null;
  createdAt: string;
  updatedAt: string;
}

// Get feature flags for current user
export async function getFeatureFlags(): Promise<FeatureFlags> {
  return fetchAPI("/feature-flags");
}

// Admin: Get all feature flags
export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  return fetchAPI("/feature-flags/admin");
}

// Admin: Update feature flag
export async function updateFeatureFlag(key: string, updates: {
  isEnabled?: boolean;
  value?: string | null;
  payload?: any;
  name?: string;
  description?: string | null;
  category?: string | null;
}): Promise<FeatureFlag> {
  return fetchAPI(`/feature-flags/admin/${key}`, {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify(updates),
  });
}

// Admin: Get feature flag history
export async function getFeatureFlagHistory(): Promise<any[]> {
  return fetchAPI("/feature-flags/admin/history/all");
}

export async function getFeatureFlagHistoryByKey(key: string): Promise<any[]> {
  return fetchAPI(`/feature-flags/admin/${key}/history`);
}

// Super Admin: Persona switching
export async function switchPersona(toPersona: 'clinician' | 'admin'): Promise<{ message: string; activePersona: string }> {
  return fetchAPI("/feature-flags/super-admin/switch-persona", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ toPersona }),
  });
}

export async function clearPersona(): Promise<{ message: string }> {
  return fetchAPI("/feature-flags/super-admin/clear-persona", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

export async function getPersonaHistory(): Promise<any[]> {
  return fetchAPI("/feature-flags/super-admin/persona-history");
}
