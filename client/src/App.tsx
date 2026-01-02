import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./lib/auth";
import { RequireAuth, RequireSubscription } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import LandingPage from "@/pages/landing";
import AuthPage from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import LibraryPage from "@/pages/library";
import AssessmentsPage from "@/pages/assessments";
import HistoryPage from "@/pages/history";
import PatientAssessment from "@/pages/patient-assessment";
import PatientResults from "@/pages/patient-results";
import AdminLoginPage from "@/pages/admin-login";
import AdminDashboard from "@/pages/admin/dashboard";
import SubscriptionPage from "@/pages/subscription";
import SettingsPage from "@/pages/settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/subscription">
        {() => (
          <RequireAuth>
            <SubscriptionPage />
          </RequireAuth>
        )}
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard">
        {() => (
          <RequireAuth>
            <AdminDashboard />
          </RequireAuth>
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
      <Route path="/assessments">
        {() => (
          <RequireSubscription>
            <AssessmentsPage />
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
      <Route path="/settings">
        {() => (
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        )}
      </Route>

      {/* Patient Public Routes */}
      <Route path="/assessment/invite/:token" component={PatientAssessment} />
      <Route path="/assessment/demo" component={PatientAssessment} />
      <Route path="/assessment/results" component={PatientResults} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
