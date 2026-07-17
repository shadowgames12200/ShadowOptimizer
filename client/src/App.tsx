import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { useEffect, Suspense, lazy } from "react";
import { trpc } from "./lib/trpc";
import { LoginPage } from "./pages/LoginPage";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import { Spinner } from "@/components/ui/spinner";

// Lazy load de páginas não-críticas
const Support = lazy(() => import("./pages/Support"));
const LicensesPage = lazy(() => import("./pages/LicensesPage"));
const LicenseDetail = lazy(() => import("./pages/LicenseDetail"));
const UsersPage = lazy(() => import("./pages/UsersPage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const LogsPage = lazy(() => import("./pages/LogsPage"));
const SystemPage = lazy(() => import("./pages/SystemPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const CreateKeysPage = lazy(() => import("./pages/CreateKeysPage"));
const ImportPage = lazy(() => import("./pages/ImportPage"));
const PlansPage = lazy(() => import("./pages/PlansPage"));
const ResellerPage = lazy(() => import("./pages/ResellerPage"));
const BansPage = lazy(() => import("./pages/BansPage"));
const Shadow1071Page = lazy(() => import("./pages/Shadow1071Page"));

// Componente de loading otimizado
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
    <Spinner className="text-primary w-8 h-8" />
  </div>
);

function Router() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && location !== "/login") {
      navigate("/login");
    }
  }, [user, isLoading, location, navigate]);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!user && location !== "/login") {
    return <PageLoader />;
  }

  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      {!user ? (
        <Route component={() => {
          useEffect(() => {
            navigate("/login");
          }, [navigate]);
          return <PageLoader />;
        }} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
      {/* Menu Principal */}
      <Route path="/users">
        <Suspense fallback={<PageLoader />}>
          <UsersPage />
        </Suspense>
      </Route>
      {/* Gerenciamento */}
      <Route path="/licenses/create">
        <Suspense fallback={<PageLoader />}>
          <CreateKeysPage />
        </Suspense>
      </Route>
      <Route path="/licenses/:licenseId">
        {(props: any) => (
          <Suspense fallback={<PageLoader />}>
            <LicenseDetail licenseId={props.params.licenseId} />
          </Suspense>
        )}
      </Route>
      <Route path="/licenses">
        <Suspense fallback={<PageLoader />}>
          <LicensesPage />
        </Suspense>
      </Route>
      <Route path="/products">
        <Suspense fallback={<PageLoader />}>
          <ProductsPage />
        </Suspense>
      </Route>
      <Route path="/logs">
        <Suspense fallback={<PageLoader />}>
          <LogsPage />
        </Suspense>
      </Route>
      <Route path="/system">
        <Suspense fallback={<PageLoader />}>
          <SystemPage />
        </Suspense>
      </Route>
      <Route path="/support">
        <Suspense fallback={<PageLoader />}>
          <Support />
        </Suspense>
      </Route>
      <Route path="/settings">
        <Suspense fallback={<PageLoader />}>
          <SettingsPage />
        </Suspense>
      </Route>
      <Route path="/import">
        <Suspense fallback={<PageLoader />}>
          <ImportPage />
        </Suspense>
      </Route>
      <Route path="/plans">
        <Suspense fallback={<PageLoader />}>
          <PlansPage />
        </Suspense>
      </Route>
      <Route path="/reseller">
        <Suspense fallback={<PageLoader />}>
          <ResellerPage />
        </Suspense>
      </Route>
      <Route path="/bans">
        <Suspense fallback={<PageLoader />}>
          <BansPage />
        </Suspense>
      </Route>
      <Route path="/shadow-1071">
        <Suspense fallback={<PageLoader />}>
          <Shadow1071Page />
        </Suspense>
      </Route>
          {/* Fallback */}
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </>
      )}
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
