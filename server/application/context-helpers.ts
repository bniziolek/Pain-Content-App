import { storage } from "../storage";
import { logClinicianAction, logPatientAction, logSystemAction } from "../audit";
import type { AppContext, CmsService, EmailService } from "./context";

const stubEmailService: EmailService = {
  async sendContentEmail() {
    throw new Error("Email service not configured in this context");
  },
  async sendAssessmentInviteEmail() {
    throw new Error("Email service not configured in this context");
  },
};

const stubCmsService: CmsService = {
  isConfigured() {
    return false;
  },
  async getAllContent() {
    return [];
  },
  async getContentById() {
    return null;
  },
};

export function createAppContext(overrides?: Partial<AppContext>): AppContext {
  return {
    storage: overrides?.storage ?? storage,
    audit: overrides?.audit ?? {
      logClinicianAction,
      logPatientAction,
      logSystemAction,
    },
    email: overrides?.email ?? stubEmailService,
    cms: overrides?.cms ?? stubCmsService,
    now: overrides?.now ?? (() => new Date()),
  };
}

export function createMinimalContext(): AppContext {
  return createAppContext();
}
