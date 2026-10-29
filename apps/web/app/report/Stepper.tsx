import { STATUSES, type ReportStatus } from "@repo/core";
import { Chip } from "../lib/icons";

const FLOW: ReportStatus[] = ["received", "under_review", "referred", "action_planned", "resolved"];

/** Received → Under review → Referred → Action planned → Resolved, with the current state in its own colour. */
export function Stepper({ status }: { status: ReportStatus }) {
  const cur = status === "more_info" ? 1 : status === "closed" ? 4 : FLOW.indexOf(status);
  return (
    <div className="stepper" role="list" aria-label="Report progress">
      {FLOW.map((s, i) => (
        <div key={s} role="listitem" className={`step ${i < cur ? "done" : i === cur ? "cur" : ""}`}>
          <Chip name={STATUSES[i === cur ? status : s].icon} color={i <= cur ? STATUSES[i === cur ? status : s].color : "#86868b"} />
          {STATUSES[i === cur ? status : s].label}
        </div>
      ))}
    </div>
  );
}
