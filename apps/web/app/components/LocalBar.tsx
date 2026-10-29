import Link from "next/link";
import type { ReactNode } from "react";

/** Product local navigation: name left, compact pills right. */
export function LocalBar({ title, crumb, children }: { title: string; crumb?: string; children?: ReactNode }) {
  return (
    <div className="local">
      <div className="local-in">
        <h1>{title}</h1>
        {crumb && <span className="crumb">{crumb}</span>}
        <span className="spacer" />
        {children}
      </div>
    </div>
  );
}
export const OutlinePill = ({ href, children }: { href: string; children: ReactNode }) => <Link href={href} className="pill-outline" style={{ textDecoration: "none" }}>{children}</Link>;
export const BluePill = ({ href, children }: { href: string; children: ReactNode }) => <Link href={href} className="pill-primary" style={{ textDecoration: "none", display: "inline-block", padding: "8px 16px", fontSize: 12 }}>{children}</Link>;
