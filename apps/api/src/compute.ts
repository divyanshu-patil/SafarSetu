import { fork, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assessPlan, buildLive, getNetwork, planDay, planRoute, type Assessment, type Disruption, type Plan, type PlanRequest, type Prefs, type Pt } from "@repo/core";

/** CPU-heavy planning calls, runnable inline or on a worker-thread pool (planning is pure and CPU-bound). */
export interface Compute {
  plan(city: string, req: PlanRequest, ds: Disruption[]): Promise<Plan>;
  assess(city: string, plan: Plan, ds: Disruption[], nowMin: number): Promise<Assessment>;
  route(city: string, a: Pt, b: Pt, o: { departMin?: number; arriveByMin?: number; prefs?: Prefs }, ds: Disruption[]): Promise<ReturnType<typeof planRoute>>;
  close(): Promise<void>;
}

const net = (city: string) => {
  const n = getNetwork(city);
  if (!n) throw new Error(`unknown city ${city}`);
  return n;
};

/** same-thread implementation: used in tests and when WORKERS=0 */
export const inlineCompute: Compute = {
  plan: async (city, req, ds) => planDay(net(city), req, buildLive(ds)),
  assess: async (city, plan, ds, now) => assessPlan(net(city), plan, buildLive(ds), now),
  route: async (city, a, b, o, ds) => planRoute(net(city), a, b, o, buildLive(ds)),
  close: async () => {},
};

type Job = { op: "plan" | "assess" | "route"; args: unknown[] };
interface Pending { resolve: (v: any) => void; reject: (e: Error) => void }

export class PoolCompute implements Compute {
  private workers: { w: ChildProcess; busy: number }[] = [];
  private pending = new Map<number, Pending>();
  private seq = 0;

  /** worker *processes* (not threads): they inherit the same TypeScript loader as the main process and isolate crashes */
  constructor(size: number) {
    for (let i = 0; i < size; i++) {
      const w = fork(fileURLToPath(new URL("./compute-worker.ts", import.meta.url)), [], { execArgv: process.execArgv, serialization: "advanced" });
      const slot = { w, busy: 0 };
      w.on("message", (m: { id: number; result?: unknown; error?: string }) => {
        const p = this.pending.get(m.id);
        if (!p) return;
        this.pending.delete(m.id);
        slot.busy--;
        m.error ? p.reject(new Error(m.error)) : p.resolve(m.result);
      });
      w.on("error", (e) => console.error("compute worker error", e));
      w.on("exit", (code) => { if (code) console.error("compute worker exited with", code); });
      this.workers.push(slot);
    }
  }

  private run<T>(job: Job): Promise<T> {
    const slot = this.workers.reduce((a, b) => (b.busy < a.busy ? b : a)); // least-loaded
    const id = ++this.seq;
    slot.busy++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      slot.w.send({ id, ...job });
    });
  }

  plan = (city: string, req: PlanRequest, ds: Disruption[]) => this.run<Plan>({ op: "plan", args: [city, req, ds] });
  assess = (city: string, plan: Plan, ds: Disruption[], now: number) => this.run<Assessment>({ op: "assess", args: [city, plan, ds, now] });
  route = (city: string, a: Pt, b: Pt, o: object, ds: Disruption[]) => this.run<ReturnType<typeof planRoute>>({ op: "route", args: [city, a, b, o, ds] });
  async close() {
    for (const s of this.workers) s.w.kill();
  }
}
