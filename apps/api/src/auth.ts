import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { DEMO_USERS, type DemoUser } from "./demo-users";
import { HttpError } from "./engine";

export interface AuthUser {
  email: string;
  name: string;
  role: DemoUser["role"];
  org: string;
  cities: string[];
}

const SECRET = process.env.AUTH_SECRET ?? "dev-only-secret-change-me";
if (!process.env.AUTH_SECRET && process.env.NODE_ENV === "production") throw new Error("AUTH_SECRET is required in production");

const hash = (pw: string, salt: string) => scryptSync(pw, salt, 32);
const accounts = (process.env.AUTHORITY_USERS_JSON ? (JSON.parse(process.env.AUTHORITY_USERS_JSON) as DemoUser[]) : DEMO_USERS).map((u) => {
  const salt = randomBytes(8).toString("hex");
  return { user: { email: u.email.toLowerCase(), name: u.name, role: u.role, org: u.org, cities: u.cities } satisfies AuthUser, salt, h: hash(u.password, salt) };
});

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (body: string) => createHmac("sha256", SECRET).update(body).digest("base64url");

export function login(email: string, password: string): { token: string; user: AuthUser } | null {
  const a = accounts.find((x) => x.user.email === email.trim().toLowerCase());
  // always hash, so timing doesn't reveal whether the account exists
  const h = hash(password, a?.salt ?? "00");
  if (!a || !timingSafeEqual(h, a.h)) return null;
  const body = b64({ ...a.user, exp: Date.now() + 12 * 3600_000 });
  return { token: `${body}.${sign(body)}`, user: a.user };
}

export function verify(token: string | undefined): AuthUser | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig || sign(body) !== sig) return null;
  const p = JSON.parse(Buffer.from(body, "base64url").toString()) as AuthUser & { exp: number };
  return p.exp > Date.now() ? { email: p.email, name: p.name, role: p.role, org: p.org, cities: p.cities } : null;
}

export const canSee = (u: AuthUser, region: string) => u.cities.includes("*") || u.cities.includes(region);
export const canDecide = (u: AuthUser) => u.role === "supervisor" || u.role === "officer";

export function requireAuthority(req: Request, res: Response, next: NextFunction) {
  const u = verify(req.header("authorization")?.replace(/^Bearer /, ""));
  if (!u) return next(new HttpError(401, "unauthorized", "Sign in as an authority user"));
  res.locals.authority = u;
  next();
}

/** demo convenience: credentials hint for the login page (disabled with AUTH_DEMO_HINT=false or in production) */
export const demoHint = () =>
  process.env.AUTH_DEMO_HINT !== "false" && process.env.NODE_ENV !== "production" && !process.env.AUTHORITY_USERS_JSON
    ? DEMO_USERS.map((u) => ({ email: u.email, password: u.password, name: u.name, role: u.role, org: u.org }))
    : [];
