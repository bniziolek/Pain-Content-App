export type ISODateString = string;
export type JsonValue = unknown;

export type UserRole = "clinician" | "admin" | "super_admin" | string;
export type SubscriptionStatus = "active" | "inactive" | "past_due" | "canceled" | string;
export type SubscriptionTier = "free" | "basic" | "pro" | "enterprise" | string;

export interface PublicUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPeriodEnd: ISODateString | null;
  subscriptionTier: SubscriptionTier | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  lastLogin: ISODateString | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  onboardingCompleted?: boolean;
  onboardingStep?: number;
  emailDeliveryMode?: string;
  activePersona?: string | null;
}

export interface ContentItem {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  imageUrl: string | null;
  readTime: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface AssessmentInvite {
  id: string;
  clinicianUserId: string;
  assessmentId: string;
  patientEmail: string;
  token: string;
  status: string;
  completedAt: ISODateString | null;
  createdAt: ISODateString;
}

export interface InternalScreening {
  id: string;
  clinicianUserId: string;
  assessmentId: string;
  patientName: string;
  notes: string | null;
  answers: JsonValue;
  tagScores: JsonValue;
  primaryOutcome: string | null;
  recommendedContentIds: string[] | null;
  createdAt: ISODateString;
}

export interface EmailLog {
  id: string;
  clinicianUserId: string;
  patientEmail: string;
  subject: string;
  type: string;
  contentIds: string[] | null;
  providerNote: string | null;
  accessCode?: string | null;
  accessCodeHash?: string | null;
  accessCodeSalt?: string | null;
  accessCodeGeneratedAt?: ISODateString | null;
  status: string | null;
  sentAt: ISODateString;
  failedAttempts?: number;
  lockedUntil?: ISODateString | null;
  permanentlyLocked?: boolean;
  isFollowUp?: boolean;
  parentEmailLogId?: string | null;
  followUpRuleId?: string | null;
}

export interface ContentView {
  id: string;
  emailLogId: string;
  contentId: string;
  patientEmail: string;
  token: string;
  viewedAt: ISODateString | null;
  timeSpentSeconds: number | null;
  createdAt: ISODateString;
}

export interface FollowUpRule {
  id: string;
  clinicianUserId: string | null;
  name: string;
  triggerType: string;
  triggerDays: number;
  action: string;
  contentIds: string[] | null;
  message: string | null;
  isActive: boolean;
  isTemplate: boolean;
  templateKey: string | null;
  createdAt: ISODateString;
}

export interface CarePathway {
  id: string;
  clinicianUserId: string | null;
  name: string;
  description: string | null;
  condition: string | null;
  durationWeeks: number | null;
  isTemplate: boolean;
  isActive: boolean;
  createdAt: ISODateString;
}

export interface PathwayMilestone {
  id: string;
  pathwayId: string;
  weekNumber: number;
  title: string;
  description: string | null;
  contentIds: string[] | null;
  assessmentId: string | null;
  createdAt: ISODateString;
}

export interface PatientPathway {
  id: string;
  clinicianUserId: string;
  pathwayId: string;
  patientEmail: string;
  patientName: string | null;
  startDate: ISODateString;
  currentWeek: number | null;
  status: string;
  completedMilestones: string[] | null;
  notes: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ContentRecommendation {
  id: string;
  tag: string;
  minScore: number | null;
  maxScore: number | null;
  priority: number | null;
  contentId: string;
  rationale: string | null;
  createdAt: ISODateString;
}

export interface AuditLog {
  id: string;
  actorType: string;
  actorUserId: string | null;
  actorEmail: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: JsonValue;
  outcome: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: ISODateString;
}

export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  category: string | null;
  isEnabled: boolean;
  value: string | null;
  payload: JsonValue;
  tiersAllowed: string[] | null;
  rolloutPercentage?: number | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface EmailConnection {
  email: string;
  status: 'active' | 'error' | 'expired' | 'revoked';
  lastError?: string | null;
}

export interface EmailSettings {
  emailDeliveryMode: 'central' | 'personal';
  connection?: EmailConnection | null;
}

export interface AdminNote {
  id: string;
  userId: string;
  adminUserId: string;
  note: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface LoginHistory {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  outcome: string;
  failureReason: string | null;
  createdAt: ISODateString;
}
