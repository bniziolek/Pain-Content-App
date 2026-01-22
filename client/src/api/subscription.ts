import { fetchAPI, jsonHeaders } from "./base";

export interface SubscriptionStatus {
  status: string;
  tier: string;
  periodEnd: string | null;
  stripeCustomerId: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

export interface Invoice {
  id: string;
  amount: number;
  status: string;
  date: number;
  pdfUrl: string | null;
}

// Subscription Status
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return fetchAPI("/subscription");
}

// Stripe Config
export async function getStripeConfig(): Promise<{ publishableKey: string }> {
  return fetchAPI("/subscription/stripe/config");
}

// Plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return fetchAPI("/subscription/plans");
}

// Checkout
export async function createCheckoutSession(priceId: string, successUrl?: string, cancelUrl?: string): Promise<{ sessionId: string; url: string }> {
  return fetchAPI("/subscription/checkout", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ priceId, successUrl, cancelUrl }),
  });
}

// Portal
export async function createPortalSession(): Promise<{ url: string }> {
  return fetchAPI("/subscription/portal", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

// Change Tier
export async function changeSubscriptionTier(newTier: string): Promise<{ success: boolean; tier: string }> {
  return fetchAPI("/subscription/change", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ newTier }),
  });
}

// Cancel
export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  return fetchAPI("/subscription/cancel", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

// Resume
export async function resumeSubscription(): Promise<{ success: boolean }> {
  return fetchAPI("/subscription/resume", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({}),
  });
}

// Invoices
export async function getInvoices(): Promise<Invoice[]> {
  return fetchAPI("/subscription/invoices");
}

// Feature Flags for subscription
export async function getSubscriptionFeatureFlags(): Promise<any[]> {
  return fetchAPI("/subscription/feature-flags");
}
