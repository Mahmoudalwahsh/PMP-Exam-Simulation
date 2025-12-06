import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AccessProvider, useAccess } from "@/contexts/AccessContext";
import NotFound from "@/pages/not-found";
import AccessCodePage from "@/pages/AccessCodePage";
import ExamSelection from "@/pages/ExamSelection";
import TesterNamePage from "@/pages/TesterNamePage";
import ExamInterface from "@/pages/ExamInterface";
import ResultsPage from "@/pages/ResultsPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUpload from "@/pages/AdminUpload";
import ExamEditor from "@/pages/ExamEditor";
import { type ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { hasAccess, checkAccess } = useAccess();
  
  const isAuthenticated = hasAccess || checkAccess();
  
  if (!isAuthenticated) {
    return <Redirect to="/access" />;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/access" component={AccessCodePage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/upload" component={AdminUpload} />
      <Route path="/admin/exam/:id" component={ExamEditor} />
      <Route path="/">
        <ProtectedRoute>
          <ExamSelection />
        </ProtectedRoute>
      </Route>
      <Route path="/tester-name/:id">
        {(params) => (
          <ProtectedRoute>
            <TesterNamePage />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/exam/:id">
        {(params) => (
          <ProtectedRoute>
            <ExamInterface />
          </ProtectedRoute>
        )}
      </Route>
      <Route path="/results">
        <ProtectedRoute>
          <ResultsPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AccessProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AccessProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
