import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

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

export interface AuthPayload {
  username: string;
  role: string;
  permissions: string[];
  name: string | null;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET tidak dikonfigurasi.");
  }
  return secret;
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: "30d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, getSecret()) as Record<string, unknown>;
    if (typeof decoded.username !== "string" || typeof decoded.role !== "string") {
      return null;
    }
    return {
      username: decoded.username,
      role: decoded.role,
      permissions: Array.isArray(decoded.permissions)
        ? (decoded.permissions as string[])
        : [],
      name: typeof decoded.name === "string" ? decoded.name : null,
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
 * Populates req.auth from a Bearer token when present and valid.
 * Never rejects on its own — public endpoints stay accessible.
 */
export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  req.auth = token ? verifyToken(token) : null;
  next();
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
