import { inlineCompute } from "./compute";

// Child process: runs one job at a time and replies by id. Errors are returned as messages, never thrown across the boundary.
process.on("message", async (m: { id: number; op: "plan" | "assess" | "route"; args: unknown[] }) => {
  try {
    const result = await (inlineCompute[m.op] as (...a: unknown[]) => Promise<unknown>)(...m.args);
    process.send!({ id: m.id, result });
  } catch (e) {
    process.send!({ id: m.id, error: (e as Error).message });
  }
});
