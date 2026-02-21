import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { RequireAuth, RequireSubscription, RequireAdmin } from "@/components/protected-route";
import { TourProvider } from "@/components/product-tour";
import { OfflineProvider } from "@/contexts/offline-context";
import { ConnectedOfflineIndicator } from "@/components/connected-offline-indicator";
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
import { ModerationQueue } from "@/pages/admin/moderation-queue";
import AdminUsersPage from "@/pages/admin/users";
import UserDetailPage from "@/pages/admin/user-detail";
import AdminRecommendationsPage from "@/pages/admin/recommendations";
import AdminFeatureFlagsPage from "@/pages/admin/feature-flags";
import AdminHealthDashboard from "@/pages/admin/health";
import AdminSubscriptionsPage from "@/pages/admin/subscriptions";
import SubscriptionDetailPage from "@/pages/admin/subscription-detail";
import SubscriptionPage from "@/pages/subscription";
import SettingsPage from "@/pages/settings";
import FollowUpsPage from "@/pages/follow-ups";
import PathwaysPage from "@/pages/pathways";
import PatientPortal from "@/pages/patient-portal";
import AssessmentBuilderPage from "@/pages/assessment-builder";
import AssessmentResultsPage from "@/pages/assessment-results";
import OnboardingPage from "@/pages/onboarding";
import ContentPacketGuidePage from "@/pages/content-packet-guide";
import RecommendationRulesPage from "@/pages/recommendation-rules";

import BlogPage from "@/pages/public/blog";
import AboutPage from "@/pages/public/about";
import PhilosophyPage from "@/pages/public/philosophy";
import WhyDriverPathPage from "@/pages/public/why-driverpath";
import FeaturesPage from "@/pages/public/features";
import PrivacyPage from "@/pages/public/privacy";
import TermsPage from "@/pages/public/terms";
import ContactPage from "@/pages/public/contact";
import PricingPage from "@/pages/public/pricing";
import CaseStudiesPage from "@/pages/public/case-studies";
import FAQPage from "@/pages/public/faq";
import UseCasesPage from "@/pages/public/use-cases";
import IntegrationsPage from "@/pages/public/integrations";
import LookupPage from "@/pages/public/lookup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      
      {/* Public Marketing Pages */}
      <Route path="/blog" component={BlogPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/philosophy" component={PhilosophyPage} />
      <Route path="/why-driverpath" component={WhyDriverPathPage} />
      <Route path="/features" component={FeaturesPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/case-studies" component={CaseStudiesPage} />
      <Route path="/faq" component={FAQPage} />
      <Route path="/use-cases" component={UseCasesPage} />
      <Route path="/integrations" component={IntegrationsPage} />
      <Route path="/lookup" component={LookupPage} />
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
      <Route path="/admin/moderation">
        {() => (
          <RequireAdmin>
            <ModerationQueue />
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
      <Route path="/admin/feature-flags">
        {() => (
          <RequireAdmin>
            <AdminFeatureFlagsPage />
          </RequireAdmin>
        )}
      </Route>

      <Route path="/admin/health">
        {() => (
          <RequireAdmin>
            <AdminHealthDashboard />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/subscriptions">
        {() => (
          <RequireAdmin>
            <AdminSubscriptionsPage />
          </RequireAdmin>
        )}
      </Route>
      <Route path="/admin/subscriptions/:userId">
        {() => (
          <RequireAdmin>
            <SubscriptionDetailPage />
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
      <Route path="/recommendation-rules">
        {() => (
          <RequireSubscription>
            <RecommendationRulesPage />
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
        <OfflineProvider>
          <TourProvider>
            <TooltipProvider>
              <ConnectedOfflineIndicator />
              <Toaster />
              <Router />
            </TooltipProvider>
          </TourProvider>
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
