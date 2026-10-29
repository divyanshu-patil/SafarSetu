import type { Metadata } from "next";
import "./globals.css";
import { Nav } from "./components/Nav";

export const metadata: Metadata = {
  title: "SafarSetu — plan your city day, on time",
  description: "Time-synchronised trip planner for Mumbai and Pune: buses, metro and locals, with calm live alerts.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Nav />
        {children}
        <footer className="footer">
          <div className="wrap">Demo runs on synthetic Mumbai and Pune transport data modelled on real networks — not for real travel decisions. Map © OpenStreetMap contributors.</div>
        </footer>
      </body>
    </html>
  );
}
