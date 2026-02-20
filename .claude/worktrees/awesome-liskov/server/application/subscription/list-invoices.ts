/**
 * Architecture: Application service layer. Orchestrates a use-case using domain, storage, and infrastructure.
 */

import type { AppContext } from "../context";
import type { User } from "@shared/schema";

export interface SubscriptionInvoice {
  id: string;
  amount: number;
  status: string | null;
  date: number;
  pdfUrl: string | null;
}

export async function listInvoices(
  ctx: AppContext,
  user: User
): Promise<SubscriptionInvoice[]> {
  if (!ctx.payment || !user.stripeCustomerId) {
    return [];
  }

  return ctx.payment.listInvoices({ customerId: user.stripeCustomerId, limit: 10 });
}
