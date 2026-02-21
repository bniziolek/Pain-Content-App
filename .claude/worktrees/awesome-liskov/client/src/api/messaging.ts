import { fetchAPI, jsonHeaders } from "./base";
import type { EmailLog, ContentView } from "@shared/api-types";

// Email Logs
export async function getEmailLogs(): Promise<EmailLog[]> {
  return fetchAPI("/email-logs");
}

export async function createEmailLog(log: {
  patientEmail: string;
  subject: string;
  type: string;
  contentIds?: string[];
  providerNote?: string;
}): Promise<EmailLog & { accessCode?: string }> {
  return fetchAPI("/email-logs", {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify(log),
  });
}

export async function getContentViewsByEmailLog(emailLogId: string): Promise<ContentView[]> {
  return fetchAPI(`/email-logs/${emailLogId}/content-views`);
}

export async function resendEmailContent(emailLogId: string, providerNote?: string): Promise<EmailLog & { accessCode?: string }> {
  return fetchAPI(`/email-logs/${emailLogId}/resend`, {
    method: "POST",
    headers: jsonHeaders(),
    body: JSON.stringify({ providerNote }),
  });
}

// Email Settings
export interface EmailSettings {
  emailDeliveryMode: 'central' | 'personal';
  connection: {
    email: string;
    status: string;
    lastError: string | null;
  } | null;
}

export async function getEmailSettings(): Promise<EmailSettings> {
  return fetchAPI("/email-settings");
}

export async function updateEmailDeliveryMode(mode: 'central' | 'personal'): Promise<void> {
  await fetchAPI("/email-settings/mode", {
    method: "PATCH",
    headers: jsonHeaders(),
    body: JSON.stringify({ mode }),
  });
}

export async function disconnectEmailConnection(): Promise<void> {
  await fetchAPI("/email-settings/connection", { method: "DELETE" });
}

// Patient Summary
export interface PatientSummary {
  patientEmail: string;
  emailLogs: EmailLog[];
  contentViews: ContentView[];
  assessmentResults: any[];
  summary: {
    totalEmails: number;
    totalViews: number;
    lastContact: string | null;
  };
}

export async function getPatientSummary(patientEmail: string): Promise<PatientSummary> {
  return fetchAPI(`/patient-summary/${encodeURIComponent(patientEmail)}`);
}
