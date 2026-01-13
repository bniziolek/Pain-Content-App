import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { RequireAuth, RequireSubscription, RequireAdmin } from "@/components/protected-route";
import { TourProvider } from "@/components/product-tour";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import ForgotPasswordPage from "@/pages/forgot-password";
import Dashboard from "@/pages/dashboard";
import LibraryPage from "@/pages/library";
import AssessmentsPage from "@/pages/assessments";
import HistoryPage from "@/pages/history";
import PatientAssessment from "@/pages/patient-assessment";
import PatientResults from "@/pages/patient-results";
import ContentViewerPage from "@/pages/content-viewer";
import PatientSummaryPage from "@/pages/patient-summary";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminUsersPage from "@/pages/admin/users";
import UserDetailPage from "@/pages/admin/user-detail";
import AdminRecommendationsPage from "@/pages/admin/recommendations";
import SubscriptionPage from "@/pages/subscription";
import SettingsPage from "@/pages/settings";
import FollowUpsPage from "@/pages/follow-ups";
import PathwaysPage from "@/pages/pathways";
import PatientPortal from "@/pages/patient-portal";
import AssessmentBuilderPage from "@/pages/assessment-builder";
import AssessmentResultsPage from "@/pages/assessment-results";
import OnboardingPage from "@/pages/onboarding";
import ContentPacketGuidePage from "@/pages/content-packet-guide";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/subscription">
        {() => (
          <RequireAuth>
            <SubscriptionPage />
          </RequireAuth>
        )}
      </Route>
      <Route path="/onboarding">
        {() => (
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        )}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard">
        {() => (
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/users">
        {() => (
          <RequireAdmin>
            <AdminUsersPage />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/users/:id">
        {() => (
          <RequireAdmin>
            <UserDetailPage />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/recommendations">
        {() => (
          <RequireAdmin>
            <AdminRecommendationsPage />
          </RequireAdmin>
        )}
      </Route>

      {/* Clinician Routes - Require Active Subscription */}
      <Route path="/dashboard">
        {() => (
          <RequireSubscription>
            <Dashboard />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/library">
        {() => (
          <RequireSubscription>
            <LibraryPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/content-packet-guide">
        {() => (
          <RequireSubscription>
            <ContentPacketGuidePage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/assessments">
        {() => (
          <RequireSubscription>
            <AssessmentsPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/assessments/builder">
        {() => (
          <RequireSubscription>
            <AssessmentBuilderPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/assessments/builder/:id">
        {() => (
          <RequireSubscription>
            <AssessmentBuilderPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/assessments/results/:inviteId">
        {() => (
          <RequireSubscription>
            <AssessmentResultsPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/history">
        {() => (
          <RequireSubscription>
            <HistoryPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/patient/:email">
        {() => (
          <RequireSubscription>
            <PatientSummaryPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/settings">
        {() => (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        )}
      </Route>
      <Route path="/follow-ups">
        {() => (
          <RequireSubscription>
            <FollowUpsPage />
          </RequireSubscription>
        )}
      </Route>
      <Route path="/pathways">
        {() => (
          <RequireSubscription>
            <PathwaysPage />
          </RequireSubscription>
        )}
      </Route>

      {/* Patient Public Routes */}
      <Route path="/patient-portal" component={PatientPortal} />
      <Route path="/assessment/invite/:token" component={PatientAssessment} />
      <Route path="/assessment/demo" component={PatientAssessment} />
      <Route path="/assessment/results" component={PatientResults} />
      <Route path="/view/:token" component={ContentViewerPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TourProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TourProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
