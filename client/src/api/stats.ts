import { fetchAPI } from "./base";

export interface DashboardStats {
  totalPatients: number;
  totalContentSent: number;
  totalEmailsSent: number;
  totalAssessmentsSent: number;
  completedAssessments: number;
  activePathways: number;
  internalScreenings: number;
  weeklyActivity: {
    emailsSent: number;
    assessmentsSent: number;
    assessmentsCompleted: number;
  };
  recentActivity: {
    lastEmail: string | null;
    lastAssessment: string | null;
  };
  // Legacy packet stats
  sendsThisWeek?: number;
  sendsGrowth?: string;
  contentReadRate?: string;
  completionRate?: string;
  topTags?: string[];
  chartData?: { name: string; sends: number }[];
  packetsThisWeek?: number;
  packetsTotal?: number;
  packetsGrowth?: string;
  recentPackets?: { id: string; patientName: string; assessmentName: string; outcome: string | null; contentCount: number; timeAgo: string }[];
  topScreeningTags?: string[];
}

export async function getStats(): Promise<DashboardStats> {
  return fetchAPI("/stats");
}
