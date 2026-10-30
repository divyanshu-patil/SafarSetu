import { planDay, networks, type Plan, type PlanRequest } from '@repo/core';

export const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(Math.round(min % 60)).padStart(2, '0')}`;
export const fromHHMM = (s: string) => (/^\d{1,2}:\d{2}$/.test(s.trim()) ? Number(s.split(':')[0]) * 60 + Number(s.split(':')[1]) : undefined);
export const todayISO = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
export const nextQuarter = () => { const d = new Date(); const m = Math.ceil((d.getHours() * 60 + d.getMinutes() + 1) / 15) * 15; return toHHMM(m >= 22 * 60 ? 9 * 60 : m); };

/** Same engine the server runs, so planning still works with no connection. */
export const planLocally = (req: PlanRequest): Plan => planDay(networks[req.city ?? 'pune']!, req as never);

export const letter = (i: number) => String.fromCharCode(66 + i); // A is the start

export interface Example { id: string; label: string; city: string; leave: string; returnHome: boolean; origin: { name: string; lat: number; lon: number }; stops: { name: string; lat: number; lon: number; task: string; dwell: number; by?: string; required: boolean }[] }
export const EXAMPLES: Example[] = [
  { id: 'pune', label: 'Pune errands', city: 'pune', leave: '09:00', returnHome: true, origin: { name: 'Pune Junction', lat: 18.5285, lon: 73.8742 }, stops: [
    { name: 'Hinjewadi Phase 1', lat: 18.5912, lon: 73.7389, task: 'Client meeting', dwell: 60, by: '11:30', required: true },
    { name: 'Shivajinagar', lat: 18.5308, lon: 73.8475, task: 'Bank', dwell: 30, required: true },
    { name: 'Swargate', lat: 18.5016, lon: 73.858, task: 'Pick up parcel', dwell: 15, required: false }] },
  { id: 'mumbai', label: 'Mumbai meetings', city: 'mumbai', leave: '08:30', returnHome: false, origin: { name: 'CSMT Station', lat: 18.9398, lon: 72.8355 }, stops: [
    { name: 'BKC', lat: 19.066, lon: 72.8688, task: 'Investor meeting', dwell: 60, by: '10:30', required: true },
    { name: 'Andheri', lat: 19.1197, lon: 72.8464, task: 'Office visit', dwell: 45, required: true },
    { name: 'Dadar', lat: 19.0186, lon: 72.8429, task: 'Collect samples', dwell: 20, required: false }] },
  { id: 'mh', label: 'Mumbai → Pune', city: 'maharashtra', leave: '06:45', returnHome: true, origin: { name: 'CSMT Station', lat: 18.9398, lon: 72.8355 }, stops: [
    { name: 'Shivajinagar, Pune', lat: 18.5308, lon: 73.8475, task: 'Client meeting', dwell: 90, by: '11:30', required: true },
    { name: 'Pune Junction', lat: 18.5285, lon: 73.8742, task: 'Collect documents', dwell: 20, required: false }] },
];
