import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import NotFound from "@/pages/not-found";
import ExamSelection from "@/pages/ExamSelection";
import TesterNamePage from "@/pages/TesterNamePage";
import ExamInterface from "@/pages/ExamInterface";
import ResultsPage from "@/pages/ResultsPage";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUpload from "@/pages/AdminUpload";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ExamSelection} />
      <Route path="/tester-name/:id" component={TesterNamePage} />
      <Route path="/exam/:id" component={ExamInterface} />
      <Route path="/results" component={ResultsPage} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/upload" component={AdminUpload} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
