import type { Network } from "../types";
import { mumbaiNetwork } from "./mumbai";
import { puneNetwork } from "./pune";
import { maharashtraNetwork } from "./maharashtra";

export const networks: Record<string, Network> = { pune: puneNetwork, mumbai: mumbaiNetwork, maharashtra: maharashtraNetwork };
export const getNetwork = (id = "pune"): Network | undefined => networks[id];
export { puneNetwork, mumbaiNetwork, maharashtraNetwork };
