import Link from "next/link";
import type { ReactNode } from "react";

/** Product local navigation: name left, compact pills right. */
export function LocalBar({ title, crumb, heading, children }: { title: string; crumb?: string; /** render the title as the page's <h1> (for pages without a hero heading) */ heading?: boolean; children?: ReactNode }) {
  return (
    <div className="local">
      <div className="local-in">
        {heading ? <h1 className="title">{title}</h1> : <p className="title">{title}</p>}
        {crumb && <span className="crumb">{crumb}</span>}
        <span className="spacer" />
        {children}
      </div>
    </div>
  );
}
export const OutlinePill = ({ href, children }: { href: string; children: ReactNode }) => <Link href={href} className="pill-outline" style={{ textDecoration: "none" }}>{children}</Link>;
export const BluePill = ({ href, children }: { href: string; children: ReactNode }) => <Link href={href} className="pill-primary" style={{ textDecoration: "none", display: "inline-block", padding: "8px 16px", fontSize: 12 }}>{children}</Link>;
