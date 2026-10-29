// DEMO ONLY: example authority accounts so the portal can be explored without an identity provider.
// Production uses Supabase Auth / the agency's SSO with real role + jurisdiction claims (see docs/12-reports-and-authority.md).
// Override by setting AUTHORITY_USERS_JSON (array of {email,name,role,org,cities,password}).
export interface DemoUser {
  email: string;
  name: string;
  role: "supervisor" | "officer" | "analyst";
  org: string;
  /** region ids this user may see; "*" = all */
  cities: string[];
  password: string;
}

const DEMO_PASSWORD = "ozjwLqfcrqHs";

export const DEMO_USERS: DemoUser[] = [
  { email: "supervisor@transport.demo", name: "State Supervisor", role: "supervisor", org: "Maharashtra Transport Dept (demo)", cities: ["*"], password: DEMO_PASSWORD },
  { email: "pune.officer@transport.demo", name: "Pune Operations Officer", role: "officer", org: "Pune Mobility Cell (demo)", cities: ["pune"], password: DEMO_PASSWORD },
  { email: "mumbai.analyst@transport.demo", name: "Mumbai Analyst", role: "analyst", org: "MMR Planning Cell (demo)", cities: ["mumbai"], password: DEMO_PASSWORD },
];
