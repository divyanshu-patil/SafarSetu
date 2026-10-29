// Work-day examples so the demo starts from something real. Coordinates are approximate.
export interface ExampleStop { name: string; lat: number; lon: number; task: string; dwell: number; arriveBy?: string; required: boolean }
export interface Example { city: string; name: string; start: string; leave: string; origin: { name: string; lat: number; lon: number }; stops: ExampleStop[]; returnHome: boolean }

export const EXAMPLES: Example[] = [
  {
    city: "pune", name: "Work errands in Pune", leave: "09:00", start: "Home", returnHome: true,
    origin: { name: "Pune Junction", lat: 18.5285, lon: 73.8742 },
    stops: [
      { name: "Hinjewadi Phase 1", lat: 18.5912, lon: 73.7389, task: "Client meeting", dwell: 60, arriveBy: "11:30", required: true },
      { name: "Shivajinagar", lat: 18.5308, lon: 73.8475, task: "Bank – submit documents", dwell: 30, required: true },
      { name: "Swargate", lat: 18.5016, lon: 73.858, task: "Pick up parcel", dwell: 15, required: false },
    ],
  },
  {
    city: "mumbai", name: "Meetings across Mumbai", leave: "08:30", start: "Home", returnHome: false,
    origin: { name: "CSMT Station", lat: 18.9398, lon: 72.8355 },
    stops: [
      { name: "BKC", lat: 19.066, lon: 72.8688, task: "Investor meeting", dwell: 60, arriveBy: "10:30", required: true },
      { name: "Andheri", lat: 19.1197, lon: 72.8464, task: "Office visit", dwell: 45, required: true },
      { name: "Dadar", lat: 19.0186, lon: 72.8429, task: "Collect samples", dwell: 20, required: false },
    ],
  },
];
