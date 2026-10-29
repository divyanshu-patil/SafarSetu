import { createClient } from "@repo/core";

export const api = createClient(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000");
export const LAST_PLAN_KEY = "safarsetu:lastPlan";

export const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(Math.round(min % 60)).padStart(2, "0")}`;
export const fromHHMM = (s: string) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
export const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
