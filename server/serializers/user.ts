import type { PublicUser } from "@shared/api-types";
import type { User } from "@shared/schema";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name ?? null,
    role: user.role,
    subscriptionStatus: user.subscriptionStatus ?? null,
    subscriptionPeriodEnd: user.subscriptionPeriodEnd ? user.subscriptionPeriodEnd.toISOString() : null,
    subscriptionTier: user.subscriptionTier ?? null,
    stripeCustomerId: user.stripeCustomerId ?? null,
    stripeSubscriptionId: user.stripeSubscriptionId ?? null,
    lastLogin: user.lastLogin ? user.lastLogin.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    onboardingCompleted: user.onboardingCompleted ?? undefined,
    onboardingStep: user.onboardingStep ?? undefined,
    emailDeliveryMode: user.emailDeliveryMode ?? undefined,
    activePersona: user.activePersona ?? null,
    phone: user.phone ?? null,
    clinicName: user.clinicName ?? null,
    credentials: user.credentials ?? null,
    address: user.address ?? null,
    city: user.city ?? null,
    state: user.state ?? null,
    zipCode: user.zipCode ?? null,
    lockedUntil: user.lockedUntil ? user.lockedUntil.toISOString() : null,
    permanentlyLocked: user.permanentlyLocked ?? false,
  };
}

export function toPublicUsers(users: User[]): PublicUser[] {
  return users.map(toPublicUser);
}
