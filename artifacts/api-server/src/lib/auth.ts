import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, adminAccountsTable } from "@workspace/db";

export const PERMISSION_KEYS = [
  "dashboard",
  "kasir",
  "orders",
  "cancel_transactions",
  "kitchen",
  "menu",
  "payments",
  "leaderboard",
  "employees",
  "settings",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/**
 * Live authorization context attached to each request. Always derived from the
 * database (or the legacy owner fallback) on every request — never trusted
 * blindly from the token — so permission changes and account deletions take
 * effect immediately.
 */
export interface AuthPayload {
  username: string;
  role: string;
  permissions: string[];
  name: string | null;
}

/**
 * Minimal identity claims embedded in the signed token. Authorization data
 * (role/permissions) is intentionally NOT trusted from here.
 */
export interface TokenClaims {
  sub: number | null; // admin_accounts.id; null for the legacy owner
  username: string;
  legacy?: boolean;
}

const LEGACY_USERNAME = "freshmood";

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tidak dikonfigurasi.");
  }
  return secret;
}

export function signToken(claims: TokenClaims): string {
  return jwt.sign(claims, getSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): TokenClaims | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as Record<string, unknown>;
    if (typeof decoded.username !== "string") {
      return null;
    }
    return {
      sub: typeof decoded.sub === "number" ? decoded.sub : null,
      username: decoded.username,
      legacy: decoded.legacy === true,
    };
  } catch {
    return null;
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthPayload | null;
    }
  }
}

export function hasPermission(auth: AuthPayload, key: string): boolean {
  if (auth.role === "owner") return true;
  return auth.permissions.includes(key);
}

/**
 * Populates req.auth from a Bearer token when present and valid. Reloads the
 * account from the database on every request so revoked/edited accounts lose
 * access instantly. Never rejects on its own — public endpoints stay accessible.
 */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    if (!token) {
      req.auth = null;
      return next();
    }
    const claims = verifyToken(token);
    if (!claims) {
      req.auth = null;
      return next();
    }
    // Legacy hardcoded owner has no database row.
    if (claims.legacy && claims.username === LEGACY_USERNAME) {
      req.auth = {
        username: LEGACY_USERNAME,
        role: "owner",
        permissions: [...PERMISSION_KEYS],
        name: null,
      };
      return next();
    }
    if (claims.sub == null) {
      req.auth = null;
      return next();
    }
    const [account] = await db
      .select()
      .from(adminAccountsTable)
      .where(eq(adminAccountsTable.id, claims.sub))
      .limit(1);
    if (!account) {
      // Account was deleted — token is no longer valid.
      req.auth = null;
      return next();
    }
    const isOwner = account.role === "owner";
    req.auth = {
      username: account.username,
      role: account.role,
      permissions: isOwner ? [...PERMISSION_KEYS] : account.permissions ?? [],
      name: account.name,
    };
    return next();
  } catch {
    // Fail closed: any error means no authenticated context.
    req.auth = null;
    return next();
  }
}

/**
 * Requires a valid authenticated session (any role/permission).
 * Use for endpoints that must not be public but are shared across staff areas.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Sesi tidak valid. Silakan login ulang." });
    return;
  }
  next();
}

export function requirePermission(key: PermissionKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Sesi tidak valid. Silakan login ulang." });
      return;
    }
    if (!hasPermission(req.auth, key)) {
      res.status(403).json({ error: "Kamu tidak memiliki akses ke area ini." });
      return;
    }
    next();
  };
}

/**
 * Allows the request through when the caller holds ANY of the listed
 * permissions (owner always passes). Use for endpoints shared by multiple
 * permission areas (e.g. order list used by both orders and kitchen).
 */
export function requireAnyPermission(keys: PermissionKey[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: "Sesi tidak valid. Silakan login ulang." });
      return;
    }
    if (!keys.some((key) => hasPermission(req.auth!, key))) {
      res.status(403).json({ error: "Kamu tidak memiliki akses ke area ini." });
      return;
    }
    next();
  };
}

export function requireOwner(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: "Sesi tidak valid. Silakan login ulang." });
    return;
  }
  if (req.auth.role !== "owner") {
    res.status(403).json({ error: "Hanya pemilik yang dapat melakukan tindakan ini." });
    return;
  }
  next();
}
