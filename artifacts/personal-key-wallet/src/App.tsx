import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Passwords from "@/pages/Passwords";
import Documents from "@/pages/Documents";
import Finance from "@/pages/Finance";
import FinanceAnalytics from "@/pages/FinanceAnalytics";
import Insights from "@/pages/Insights";
import Extension from "@/pages/Extension";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import SetupTwoFactor from "@/pages/auth/SetupTwoFactor";
import VerifyTwoFactor from "@/pages/auth/VerifyTwoFactor";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Redirect to="/auth/login" />;
  }
  return <Component />;
}

function PublicOnlyRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect to="/" />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/auth/login" component={() => <PublicOnlyRoute component={Login} />} />
      <Route path="/auth/signup" component={() => <PublicOnlyRoute component={Signup} />} />
      <Route path="/auth/setup-2fa" component={SetupTwoFactor} />
      <Route path="/auth/verify" component={VerifyTwoFactor} />

      <Route>
        {() => (
          <Layout>
            <Switch>
              <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
              <Route path="/vault/passwords" component={() => <ProtectedRoute component={Passwords} />} />
              <Route path="/vault/documents" component={() => <ProtectedRoute component={Documents} />} />
              <Route path="/finance" component={() => <ProtectedRoute component={Finance} />} />
              <Route path="/finance/analytics" component={() => <ProtectedRoute component={FinanceAnalytics} />} />
              <Route path="/insights" component={() => <ProtectedRoute component={Insights} />} />
              <Route path="/extension" component={() => <ProtectedRoute component={Extension} />} />
              <Route component={NotFound} />
            </Switch>
          </Layout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
