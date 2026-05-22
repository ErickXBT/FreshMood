import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
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
  CreditCard
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
          <div className="flex items-center justify-between mb-2 px-2">
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
