// Re-export from infrastructure for backwards compatibility
// All email functionality is now in server/infrastructure/email/
export {
  sendContentEmail,
  sendAssessmentInviteEmail,
  isResendConfigured,
} from './infrastructure/email/resend.service';

export type {
  ContentEmailData,
  AssessmentInviteEmailData,
} from './infrastructure/email/resend.service';
