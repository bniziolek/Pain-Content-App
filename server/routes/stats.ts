import { Router } from "express";
import { requireSubscription } from "../auth";
import { storage } from "../storage";

const router = Router();

// Get dashboard stats for clinician
router.get("/", requireSubscription, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Get various counts and stats
    const [
      emailLogs,
      assessmentInvites,
      internalScreenings,
      patientPathways,
    ] = await Promise.all([
      storage.getEmailLogsByClinicianId(userId),
      storage.getAssessmentInvitesByClinicianId(userId),
      storage.getInternalScreeningsByClinicianId(userId),
      storage.getPatientPathwaysByClinicianId(userId),
    ]);
    
    // Calculate stats
    const totalPatients = new Set([
      ...emailLogs.map(e => e.patientEmail),
      ...assessmentInvites.map(a => a.patientEmail),
    ]).size;
    
    const totalContentSent = emailLogs.reduce(
      (sum, log) => sum + (log.contentIds?.length || 0), 
      0
    );
    
    const completedAssessments = assessmentInvites.filter(
      a => a.status === 'completed'
    ).length;
    
    // Get last 7 days activity
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentEmails = emailLogs.filter(
      e => new Date(e.sentAt) > weekAgo
    );
    
    const recentAssessments = assessmentInvites.filter(
      a => new Date(a.createdAt) > weekAgo
    );
    
    res.json({
      totalPatients,
      totalContentSent,
      totalEmailsSent: emailLogs.length,
      totalAssessmentsSent: assessmentInvites.length,
      completedAssessments,
      activePathways: patientPathways.filter(p => p.status === 'active').length,
      internalScreenings: internalScreenings.length,
      weeklyActivity: {
        emailsSent: recentEmails.length,
        assessmentsSent: recentAssessments.length,
        assessmentsCompleted: recentAssessments.filter(a => a.status === 'completed').length,
      },
      recentActivity: {
        lastEmail: emailLogs[0]?.sentAt || null,
        lastAssessment: assessmentInvites[0]?.createdAt || null,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as statsRouter };
