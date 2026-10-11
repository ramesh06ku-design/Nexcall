import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../types/domain.js";
const COOKIE_NAME = "nexcall_session";
export interface TokenPayload { sub: string; role: UserRole; }
export function createSessionToken(payload: TokenPayload) { return jwt.sign(payload, env.AUTH_SECRET, { expiresIn: "7d", issuer: "nexcall-api", audience: "nexcall-web" }); }
export function verifySessionToken(token: string) { return jwt.verify(token, env.AUTH_SECRET, { issuer: "nexcall-api", audience: "nexcall-web" }) as jwt.JwtPayload & TokenPayload; }
export const sessionCookie = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  },
};
export const clearSessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
};
