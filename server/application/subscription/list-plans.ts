/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

export async function listPlans(): Promise<SubscriptionPlan[]> {
  return [
    {
      id: "basic",
      name: "Basic",
      price: 29,
      interval: "month",
      features: ["Content library access", "Patient messaging", "Basic assessments"],
    },
    {
      id: "pro",
      name: "Pro",
      price: 79,
      interval: "month",
      features: ["Everything in Basic", "Care pathways", "Follow-up automation", "Advanced analytics"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199,
      interval: "month",
      features: ["Everything in Pro", "Custom branding", "API access", "Priority support"],
    },
  ];
}
