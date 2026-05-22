import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider } from "@/hooks/use-auth";
import { CartProvider } from "@/hooks/use-cart";
import NotFound from "@/pages/not-found";

// Pages
import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminKitchen from "@/pages/admin/kitchen";
import AdminMenu from "@/pages/admin/menu";
import AdminOrders from "@/pages/admin/orders";
import AdminLeaderboard from "@/pages/admin/leaderboard";

import CustomerMenu from "@/pages/customer/menu";
import Checkout from "@/pages/customer/checkout";
import OrderStatusPage from "@/pages/customer/order-status";

const queryClient = new QueryClient();

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
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/kitchen" component={AdminKitchen} />
      <Route path="/admin/menu" component={AdminMenu} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/leaderboard" component={AdminLeaderboard} />

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
