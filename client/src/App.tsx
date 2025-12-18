import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      
      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLoginPage} />
      <Route path="/admin/dashboard" component={AdminDashboard} />

      {/* Clinician Routes */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/library" component={LibraryPage} />
      <Route path="/assessments" component={AssessmentsPage} />
      <Route path="/history" component={HistoryPage} />
      <Route path="/settings" component={() => <div>Settings Placeholder</div>} />

      {/* Patient Public Routes */}
      <Route path="/assessment/invite/:token" component={PatientAssessment} />
      {/* For demo, we also map generic route */}
      <Route path="/assessment/demo" component={PatientAssessment} />
      <Route path="/assessment/results" component={PatientResults} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
