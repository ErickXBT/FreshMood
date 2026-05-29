import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { useEffect, ReactNode } from "react";
import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from "@tanstack/react-query";
import { ApiError } from "@workspace/api-client-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import NotFound from "@/pages/not-found";

// Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminKitchen from "@/pages/admin/kitchen";
import AdminMenu from "@/pages/admin/menu";
import AdminOrders from "@/pages/admin/orders";
import AdminLeaderboard from "@/pages/admin/leaderboard";
import AdminPayments from "@/pages/admin/payments";
import AdminSettings from "@/pages/admin/settings";
import AdminEmployees from "@/pages/admin/employees";
import AdminStaff from "@/pages/admin/staff";

import CustomerMenu from "@/pages/customer/menu";
import Checkout from "@/pages/customer/checkout";
import OrderStatusPage from "@/pages/customer/order-status";

let handleAuthExpired: (() => void) | null = null;

function onApiError(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    handleAuthExpired?.();
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: onApiError }),
  mutationCache: new MutationCache({ onError: onApiError }),
});

function Home() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background text-foreground">
      <div className="text-center p-8 max-w-md">
        <div className="flex items-center justify-center gap-3 mb-4">
          <img src="/images/logo.png" alt="FreshMood" className="h-16 w-16 object-contain" />
          <h1 className="text-4xl font-bold text-primary tracking-tight">FreshMood</h1>
        </div>
        <p className="mt-2 text-lg text-muted-foreground mb-8">Premium QR-based cafe ordering experience.</p>
        <div className="flex gap-4 justify-center">
          <a href="/menu?table=1" className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-medium shadow-sm hover:opacity-90 transition-opacity">Open Menu</a>
          <a href="/admin/login" className="bg-secondary text-secondary-foreground px-6 py-2 rounded-full font-medium shadow-sm hover:opacity-90 transition-opacity">Admin Login</a>
        </div>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  permission?: string;
  ownerOnly?: boolean;
  children: ReactNode;
}

function ProtectedRoute({ permission, ownerOnly, children }: ProtectedRouteProps) {
  const { isAuthenticated, isOwner, hasPermission, getDefaultRoute } = useAuth();
  const [, setLocation] = useLocation();

  const allowed =
    isAuthenticated &&
    (ownerOnly ? isOwner : permission ? hasPermission(permission) : true);

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation("/admin/login");
    } else if (!allowed) {
      setLocation(getDefaultRoute());
    }
  }, [isAuthenticated, allowed, setLocation, getDefaultRoute]);

  if (!allowed) return null;
  return <>{children}</>;
}

function AuthExpiredBridge() {
  const { logout, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    handleAuthExpired = () => {
      if (!isAuthenticated) return;
      logout();
      setLocation("/admin/login");
    };
    return () => {
      handleAuthExpired = null;
    };
  }, [logout, setLocation, isAuthenticated]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />

      {/* Customer Routes */}
      <Route path="/menu" component={CustomerMenu} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/order-status/:orderId" component={OrderStatusPage} />

      {/* Admin Routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard">
        <ProtectedRoute permission="dashboard"><AdminDashboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/kitchen">
        <ProtectedRoute permission="kitchen"><AdminKitchen /></ProtectedRoute>
      </Route>
      <Route path="/admin/menu">
        <ProtectedRoute permission="menu"><AdminMenu /></ProtectedRoute>
      </Route>
      <Route path="/admin/orders">
        <ProtectedRoute permission="orders"><AdminOrders /></ProtectedRoute>
      </Route>
      <Route path="/admin/leaderboard">
        <ProtectedRoute permission="leaderboard"><AdminLeaderboard /></ProtectedRoute>
      </Route>
      <Route path="/admin/payments">
        <ProtectedRoute permission="payments"><AdminPayments /></ProtectedRoute>
      </Route>
      <Route path="/admin/employees">
        <ProtectedRoute permission="employees"><AdminEmployees /></ProtectedRoute>
      </Route>
      <Route path="/admin/settings">
        <ProtectedRoute permission="settings"><AdminSettings /></ProtectedRoute>
      </Route>
      <Route path="/admin/staff">
        <ProtectedRoute ownerOnly><AdminStaff /></ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <AuthExpiredBridge />
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
