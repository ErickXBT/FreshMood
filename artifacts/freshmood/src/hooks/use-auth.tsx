import { createContext, useContext, useState, ReactNode } from "react";

export interface LoginData {
  token: string;
  username: string;
  role: string;
  permissions: string[];
  name?: string | null;
}

export interface AuthSnapshot {
  username: string;
  role: string;
  permissions: string[];
  name?: string | null;
}

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: string | null;
  name: string | null;
  permissions: string[];
  login: (data: LoginData) => void;
  logout: () => void;
  syncFromServer: (data: AuthSnapshot) => void;
  isAuthenticated: boolean;
  isOwner: boolean;
  hasPermission: (key: string) => boolean;
  getDefaultRoute: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "freshmood-token";
const USERNAME_KEY = "freshmood-username";
const ROLE_KEY = "freshmood-role";
const NAME_KEY = "freshmood-name";
const PERMISSIONS_KEY = "freshmood-permissions";

// Page-backed routes in priority order, each mapped to its permission key.
const PAGE_ROUTES: { href: string; perm: string }[] = [
  { href: "/admin/dashboard", perm: "dashboard" },
  { href: "/admin/kitchen", perm: "kitchen" },
  { href: "/admin/menu", perm: "menu" },
  { href: "/admin/orders", perm: "orders" },
  { href: "/admin/leaderboard", perm: "leaderboard" },
  { href: "/admin/payments", perm: "payments" },
  { href: "/admin/employees", perm: "employees" },
  { href: "/admin/settings", perm: "settings" },
];

function readPermissions(): string[] {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY));
  const [role, setRole] = useState<string | null>(() => localStorage.getItem(ROLE_KEY));
  const [name, setName] = useState<string | null>(() => localStorage.getItem(NAME_KEY));
  const [permissions, setPermissions] = useState<string[]>(() => readPermissions());

  const login = (data: LoginData) => {
    setToken(data.token);
    setUsername(data.username);
    setRole(data.role);
    setName(data.name ?? null);
    setPermissions(data.permissions);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USERNAME_KEY, data.username);
    localStorage.setItem(ROLE_KEY, data.role);
    if (data.name) {
      localStorage.setItem(NAME_KEY, data.name);
    } else {
      localStorage.removeItem(NAME_KEY);
    }
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions));
  };

  const syncFromServer = (data: AuthSnapshot) => {
    setUsername(data.username);
    setRole(data.role);
    setName(data.name ?? null);
    setPermissions(data.permissions);
    localStorage.setItem(USERNAME_KEY, data.username);
    localStorage.setItem(ROLE_KEY, data.role);
    if (data.name) {
      localStorage.setItem(NAME_KEY, data.name);
    } else {
      localStorage.removeItem(NAME_KEY);
    }
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(data.permissions));
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setRole(null);
    setName(null);
    setPermissions([]);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USERNAME_KEY);
    localStorage.removeItem(ROLE_KEY);
    localStorage.removeItem(NAME_KEY);
    localStorage.removeItem(PERMISSIONS_KEY);
  };

  const isOwner = role === "owner";

  const hasPermission = (key: string) => {
    if (isOwner) return true;
    return permissions.includes(key);
  };

  const getDefaultRoute = () => {
    if (isOwner) return "/admin/dashboard";
    const allowed = PAGE_ROUTES.find((r) => permissions.includes(r.perm));
    return allowed ? allowed.href : "/admin/login";
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        username,
        role,
        name,
        permissions,
        login,
        logout,
        syncFromServer,
        isAuthenticated: !!token,
        isOwner,
        hasPermission,
        getDefaultRoute,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
