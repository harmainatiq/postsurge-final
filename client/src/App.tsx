import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import BrandGuidelines from "./pages/BrandGuidelines";
import Generate from "./pages/Generate";
import Posts from "./pages/Posts";
import Settings from "./pages/Settings";
import History from "./pages/History";
import { OnboardingGuard } from "./components/OnboardingGuard";
import { ProtectedRoute } from "./components/ProtectedRoute";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/onboarding">
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/brand-guidelines">
        <ProtectedRoute>
          <BrandGuidelines />
        </ProtectedRoute>
      </Route>
      <Route path="/generate">
        <ProtectedRoute>
          <Generate />
        </ProtectedRoute>
      </Route>
      <Route path="/posts">
        <ProtectedRoute>
          <Posts />
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>
      <Route path="/history">
        <ProtectedRoute>
          <History />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <OnboardingGuard>
            <Router />
          </OnboardingGuard>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}