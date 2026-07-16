import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect } from "react";
import { trpc } from "./lib/trpc";
import { LoginPage } from "./pages/LoginPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import Support from "./pages/Support";
import LicensesPage from "./pages/LicensesPage";
import LicenseDetail from "./pages/LicenseDetail";
import UsersPage from "./pages/UsersPage";
import ProductsPage from "./pages/ProductsPage";
import LogsPage from "./pages/LogsPage";
import SystemPage from "./pages/SystemPage";
import SettingsPage from "./pages/SettingsPage";
import CreateKeysPage from "./pages/CreateKeysPage";
import ImportPage from "./pages/ImportPage";
import PlansPage from "./pages/PlansPage";
import ResellerPage from "./pages/ResellerPage";
import BansPage from "./pages/BansPage";

function Router() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && window.location.pathname !== "/login") {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return <div>Carregando...</div>;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      {/* Menu Principal */}
      <Route path="/users" component={UsersPage} />
      <Route path="/licenses" component={LicensesPage} />
      <Route path="/licenses/:licenseId" component={(props: any) => <LicenseDetail licenseId={props.params.licenseId} />} />
      <Route path="/products" component={ProductsPage} />
      <Route path="/logs" component={LogsPage} />
      <Route path="/system" component={SystemPage} />
      <Route path="/support" component={Support} />
      <Route path="/settings" component={SettingsPage} />
      {/* Gerenciamento */}
      <Route path="/licenses/create" component={CreateKeysPage} />
      <Route path="/import" component={ImportPage} />
      <Route path="/plans" component={PlansPage} />
      <Route path="/reseller" component={ResellerPage} />
      <Route path="/bans" component={BansPage} />
      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster position="top-right" richColors />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
