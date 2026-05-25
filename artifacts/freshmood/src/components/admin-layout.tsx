import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useActiveCashier } from "@/hooks/use-cashier";
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
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout, username } = useAuth();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cashierDialogOpen, setCashierDialogOpen] = useState(false);
  const { activeCashier } = useActiveCashier();

  const handleLogout = () => {
    logout();
    setLocation("/admin/login");
  };

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/kitchen", label: "Kitchen", icon: ChefHat },
    { href: "/admin/menu", label: "Menu", icon: MenuSquare },
    { href: "/admin/orders", label: "Orders", icon: ListOrdered },
    { href: "/admin/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/admin/payments", label: "Payments", icon: CreditCard },
    { href: "/admin/employees", label: "Karyawan", icon: Users },
    { href: "/admin/settings", label: "Settings", icon: Settings },
  ];

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
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${isActive ? 'bg-primary text-primary-foreground font-medium' : 'text-foreground hover:bg-muted'}`}>
                  <Icon size={20} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border mt-auto flex flex-col gap-2">
          {/* Switch Cashier */}
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

          <div className="flex items-center justify-between px-2">
            <span className="text-sm font-medium">Hi, {username}</span>
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
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <span className={`flex flex-col items-center justify-center py-2 gap-0.5 transition-colors cursor-pointer ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
