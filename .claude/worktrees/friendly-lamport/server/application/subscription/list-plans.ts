/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import { getUncachableStripeClient } from "../../infrastructure/payment/stripe-client";

export interface Price {
  id: string;
  unitAmount: number;
  currency: string;
  recurring: { interval: string; interval_count: number } | null;
  metadata: Record<string, string>;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  metadata: Record<string, string>;
  prices: Price[];
}

export interface ListPlansResult {
  plans: Plan[];
}

const FALLBACK_PLANS: Plan[] = [
  {
    id: "basic",
    name: "Basic",
    description: "Essential tools for solo practitioners getting started with evidence-based education.",
    metadata: { tier: "basic" },
    prices: [
      {
        id: "basic_monthly",
        unitAmount: 1900,
        currency: "usd",
        recurring: { interval: "month", interval_count: 1 },
        metadata: {},
      },
      {
        id: "basic_yearly",
        unitAmount: 20000,
        currency: "usd",
        recurring: { interval: "year", interval_count: 1 },
        metadata: {},
      },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Complete toolkit for practices ready to scale with full patient engagement features.",
    metadata: { tier: "pro" },
    prices: [
      {
        id: "pro_monthly",
        unitAmount: 2900,
        currency: "usd",
        recurring: { interval: "month", interval_count: 1 },
        metadata: {},
      },
      {
        id: "pro_yearly",
        unitAmount: 30000,
        currency: "usd",
        recurring: { interval: "year", interval_count: 1 },
        metadata: {},
      },
    ],
  },
];

export async function listPlans(): Promise<ListPlansResult> {
  try {
    const stripe = await getUncachableStripeClient();
    
    const products = await stripe.products.list({ active: true, limit: 10 });
    const prices = await stripe.prices.list({ active: true, limit: 50 });
    
    const plans: Plan[] = products.data
      .filter((product) => {
        const tier = (product.metadata?.tier || "").toLowerCase();
        return tier === "basic" || tier === "pro";
      })
      .map((product) => {
        const productPrices = prices.data
          .filter((price) => price.product === product.id)
          .map((price) => ({
            id: price.id,
            unitAmount: price.unit_amount || 0,
            currency: price.currency,
            recurring: price.recurring
              ? { interval: price.recurring.interval, interval_count: price.recurring.interval_count }
              : null,
            metadata: (price.metadata || {}) as Record<string, string>,
          }));

        return {
          id: product.id,
          name: product.name,
          description: product.description || "",
          metadata: (product.metadata || {}) as Record<string, string>,
          prices: productPrices,
        };
      });

    if (plans.length > 0 && plans.some((p) => p.prices.length > 0)) {
      return { plans };
    }
    
    return { plans: FALLBACK_PLANS };
  } catch (error) {
    console.error("Failed to fetch Stripe plans, using fallback:", error);
    return { plans: FALLBACK_PLANS };
  }
}
