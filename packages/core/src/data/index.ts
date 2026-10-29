import type { Network } from "../types";
import { mumbaiNetwork } from "./mumbai";
import { puneNetwork } from "./pune";

export const networks: Record<string, Network> = { pune: puneNetwork, mumbai: mumbaiNetwork };
export const getNetwork = (id = "pune"): Network | undefined => networks[id];
export { puneNetwork, mumbaiNetwork };
