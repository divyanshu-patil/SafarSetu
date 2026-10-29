"use client";
import { AlertTriangle, Accessibility, Archive, ArrowRight, BellRing, Building2, Bus, BusFront, CalendarCheck, CircleCheck, CircleHelp, Clock, Construction, FileWarning, Flag, Footprints, Hourglass, Inbox, Landmark, LogIn, LogOut, type LucideIcon, Map as MapIcon, MapPin, MapPinOff, MessageCircleQuestion, Route, Search, Send, Shield, ShieldCheck, Shuffle, Sparkles, CarTaxiFront, TrainFront, TramFront, TrendingUp, Users, Wallet, CloudRain } from "lucide-react";

// lucide icon names used by @repo/core metadata (CATEGORIES / STATUSES) -> components
const REGISTRY: Record<string, LucideIcon> = {
  AlertTriangle, Accessibility, Archive, ArrowRight, BellRing, Building2, Bus, BusFront, CalendarCheck, CircleCheck, CircleHelp, Clock, Construction, FileWarning, Flag, Footprints, Hourglass, Inbox, Landmark, LogIn, LogOut, Map: MapIcon, MapPin, MapPinOff, MessageCircleQuestion, Route, Search, Send, Shield, ShieldCheck, Shuffle, Sparkles, CarTaxiFront, TrainFront, TramFront, TrendingUp, Users, Wallet, CloudRain,
};

export function Icon({ name, size = 18, className, strokeWidth = 2 }: { name: string; size?: number; className?: string; strokeWidth?: number }) {
  const C = REGISTRY[name] ?? CircleHelp;
  return <C size={size} className={className} strokeWidth={strokeWidth} aria-hidden />;
}

/** tinted round icon chip: neutral Apple surfaces + one accent colour carrying meaning */
export function Chip({ name, color, size = 18, box = 36 }: { name: string; color: string; size?: number; box?: number }) {
  return (
    <span className="ichip" style={{ width: box, height: box, color, background: `${color}1f` }}>
      <Icon name={name} size={size} />
    </span>
  );
}

export const MODE_ICON = { metro: "TramFront", train: "TrainFront", bus: "BusFront" } as const;
export const MODE_COLOR = { metro: "#0e7490", train: "#be123c", bus: "#c2410c", walk: "#475569", cab: "#a16207" } as const;
export const MODE_LABEL = { metro: "Metro", train: "Train", bus: "Bus" } as const;
