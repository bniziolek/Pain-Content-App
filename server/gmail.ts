// Re-export from infrastructure for backwards compatibility
// All email functionality is now in server/infrastructure/email/
export {
  sendContentEmail,
  sendAssessmentInviteEmail,
  sendPasswordResetEmail,
  sendPatientPortalEmail,
  isGmailConfigured,
} from './infrastructure/email/gmail.service';

export type {
  ContentEmailData,
  AssessmentInviteEmailData,
  PasswordResetEmailData,
  PatientPortalEmailData,
} from './infrastructure/email/gmail.service';
