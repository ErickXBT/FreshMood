import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useActiveCashier } from "@/hooks/use-cashier";
import { useOrderNotifications } from "@/hooks/use-order-notifications";
import SwitchCashierDialog from "@/components/switch-cashier-dialog";
import { 
  LayoutDashboard, 
  ChefHat, 
  MenuSquare, 
  ListOrdered, 
  LogOut,
  Moon,
  Sun,
  Menu,
  X,
  Trophy,
  CreditCard,
  Settings,
  Users,
  ArrowLeftRight,
  UserX,
  BellRing,
  BellOff,
  ShieldCheck,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

const NOTIFIED_HREFS = new Set(["/admin/kitchen", "/admin/orders"]);

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout, username, name, isOwner, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false);
  const { activeCashier } = useActiveCashier();
  const { soundEnabled, setSoundEnabled, newOrderCount, clearCount } = useOrderNotifications();

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const handleNavClick = (href: string) => {
    if (NOTIFIED_HREFS.has(href)) clearCount();
    setSidebarOpen(false);
  };

  const allNavItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: "dashboard" },
    { href: "/admin/kitchen",   label: "Kitchen",   icon: ChefHat, perm: "kitchen" },
    { href: "/admin/menu",      label: "Menu",       icon: MenuSquare, perm: "menu" },
    { href: "/admin/orders",    label: "Orders",     icon: ListOrdered, perm: "orders" },
    { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy, perm: "leaderboard" },
    { href: "/admin/payments",  label: "Payments",   icon: CreditCard, perm: "payments" },
    { href: "/admin/employees", label: "Karyawan",   icon: Users, perm: "employees" },
    { href: "/admin/settings",  label: "Settings",   icon: Settings, perm: "settings" },
    { href: "/admin/staff",     label: "Akun Staf",  icon: ShieldCheck, perm: "__owner__" },
  ];

  const navItems = allNavItems.filter((item) =>
    item.perm === "__owner__" ? isOwner : hasPermission(item.perm)
  );

  // Cashier switching/management is only for users with the kasir or employees
  // area (owner always). Hide the control otherwise — the server enforces this too.
  const canManageCashier = isOwner || hasPermission("kasir") || hasPermission("employees");

  const showBadge = (href: string) =>
    NOTIFIED_HREFS.has(href) && newOrderCount > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-64 bg-card border-r border-border flex-col shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="FreshMood" className="h-10 w-10 object-contain" />
            <h1 className="text-2xl font-bold text-primary">FreshMood</h1>
          </div>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            const hasBadge = showBadge(item.href);
            return (
              <Link key={item.href} href={item.href} onClick={() => handleNavClick(item.href)}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer relative ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'}`}>
                  <span className="relative">
                    <Icon size={20} />
                    {hasBadge && (
                      <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                        {newOrderCount > 9 ? "9+" : newOrderCount}
                      </span>
                    )}
                  </span>
                  <span className="flex-1">{item.label}</span>
                  {hasBadge && (
                    <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400 animate-pulse">
                      {newOrderCount} baru
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto flex flex-col gap-2">
          {/* Sound Notification Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border transition-all text-left ${
              soundEnabled
                ? "bg-primary/5 border-primary/30 hover:bg-primary/10"
                : "bg-muted/50 border-dashed border-border hover:bg-muted"
            }`}
            title={soundEnabled ? "Notifikasi suara aktif — klik untuk matikan" : "Notifikasi suara mati — klik untuk aktifkan"}
          >
            {soundEnabled ? (
              <BellRing size={16} className="text-primary shrink-0 animate-bounce" />
            ) : (
              <BellOff size={16} className="text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">
                {soundEnabled ? "Notifikasi Aktif" : "Notifikasi Mati"}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {soundEnabled ? "Bunyi dering saat ada pesanan baru" : "Klik untuk aktifkan suara"}
              </p>
            </div>
            {newOrderCount > 0 && (
              <span className="shrink-0 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {newOrderCount > 9 ? "9+" : newOrderCount}
              </span>
            )}
          </button>

          {/* Switch Cashier */}
          {canManageCashier && (
          <button
            onClick={() => setCashierDialogOpen(true)}
            className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-colors text-left ${
              activeCashier
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30"
                : "bg-muted/50 border-dashed border-border hover:bg-muted"
            }`}
          >
            {activeCashier ? (
              <>
                <div className="w-7 h-7 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center shrink-0 text-xs font-bold text-green-800 dark:text-green-200">
                  {activeCashier.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground leading-none mb-0.5">Kasir Aktif</p>
                  <p className="text-xs font-semibold truncate text-green-700 dark:text-green-400">{activeCashier.name}</p>
                </div>
                <ArrowLeftRight size={14} className="text-muted-foreground shrink-0" />
              </>
            ) : (
              <>
                <UserX size={16} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground flex-1">Pilih Kasir Bertugas</span>
                <ArrowLeftRight size={14} className="text-muted-foreground shrink-0" />
              </>
            )}
          </button>
          )}

          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium">Hi, {name || username}</span>
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
          <Button variant="outline" className="w-full justify-start text-destructive" onClick={handleLogout}>
            <LogOut size={18} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* ── Mobile Top Header ── */}
      <header className="md:hidden sticky top-0 z-40 bg-card border-b border-border flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <img src="/images/logo.png" alt="FreshMood" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold text-primary">FreshMood</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Mobile sound toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`relative ${soundEnabled ? "text-primary" : "text-muted-foreground"}`}
            title={soundEnabled ? "Matikan notifikasi suara" : "Aktifkan notifikasi suara"}
          >
            {soundEnabled ? <BellRing size={18} /> : <BellOff size={18} />}
            {newOrderCount > 0 && (
              <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {newOrderCount > 9 ? "9+" : newOrderCount}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive">
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      <SwitchCashierDialog open={cashierDialogOpen} onOpenChange={setCashierDialogOpen} />

      {/* ── Mobile Bottom Nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          const hasBadge = showBadge(item.href);
          return (
            <Link key={item.href} href={item.href} className="flex-1" onClick={() => handleNavClick(item.href)}>
              <span className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors cursor-pointer relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <span className="relative">
                  <Icon size={22} />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                      {newOrderCount > 9 ? "9+" : newOrderCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
