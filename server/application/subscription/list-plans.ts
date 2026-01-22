/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

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

export async function listPlans(): Promise<ListPlansResult> {
  return {
    plans: [
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
    ],
  };
}
