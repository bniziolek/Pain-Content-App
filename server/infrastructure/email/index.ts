export {
  sendContentEmail as sendGmailContentEmail,
  sendAssessmentInviteEmail as sendGmailAssessmentInviteEmail,
  sendPasswordResetEmail as sendGmailPasswordResetEmail,
  sendPatientPortalEmail as sendGmailPatientPortalEmail,
  isGmailConfigured,
  type ContentEmailData as GmailContentEmailData,
  type AssessmentInviteEmailData as GmailAssessmentInviteEmailData,
  type PasswordResetEmailData as GmailPasswordResetEmailData,
  type PatientPortalEmailData as GmailPatientPortalEmailData,
} from './gmail.service';

export {
  sendContentEmail as sendResendContentEmail,
  sendAssessmentInviteEmail as sendResendAssessmentInviteEmail,
  isResendConfigured,
  type ContentEmailData as ResendContentEmailData,
  type AssessmentInviteEmailData as ResendAssessmentInviteEmailData,
} from './resend.service';

export {
  sendContentEmail,
  sendAssessmentInviteEmail,
  sendPasswordResetEmail,
  configureEmailAdapter,
  getEmailAdapterConfig,
  getConfiguredProvider,
  type EmailProvider,
  type EmailAdapterConfig,
} from './email-adapter';
