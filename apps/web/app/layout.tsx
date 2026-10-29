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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Inter (docs/DESIGN.md); Black 900 stands in for Wise Sans */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" />
      </head>
      <body>
        <Nav />
        {children}
        <footer className="footer">
          <div className="wrap"><b>SafarSetu</b> · Demo uses synthetic city transport data modelled on real networks, plus real railway timetables where marked — not for real travel decisions. Map © OpenStreetMap contributors. See DATA_SOURCES.md.</div>
        </footer>
      </body>
    </html>
  );
}
