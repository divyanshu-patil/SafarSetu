import type { Lang } from "./types";

/**
 * Message templates for reminders and alerts. Facts (times, names, numbers) are inserted by code, never by a model.
 * Hindi and Marathi were written for this prototype and need review by native speakers before a pilot.
 */
export interface Tpl {
  wrapup: (place: string, t: string) => { title: string; body: string };
  prepare: (n: number, dest: string, leaveT: string, ride: string) => { title: string; body: string };
  ride: (route: string, head: string, stop: string, t: string) => string;
  leave: (dest: string, walkMin: number, stop: string, route: string, head: string, t: string, hasRide: boolean) => { title: string; body: string };
  board: (route: string, head: string, stop: string, t: string) => { title: string; body: string };
  relaxTitle: string;
  relax: (who: string, old: string, route: string, d: number, leave?: string, oldLeave?: string, reach?: string) => string;
  relaxBrief: (route: string, d: number, leave?: string, oldLeave?: string) => { title: string; body: string };
  adjust: (route: string, d: number | undefined, lost: string, leave?: string) => { title: string; body: string };
  urgent: (route?: string, stop?: string, t?: string) => { title: string; body: string };
  closure: (stop: string, next: string, keep: string) => { title: string; body: string };
  cancelled: (route: string, old: string, next: string, keep: string) => { title: string; body: string };
  updated: (route: string, d: number | undefined, next: string, keep: string) => { title: string; body: string };
  next: (route: string, t: string, stop: string, leave?: string) => string;
  alt: (a: { kind: "cab" | "walk"; mins: number; fare?: number; to?: string }, leave?: string) => string;
  newRoute: string;
  keepDrop: (list: string) => string;
  keepOk: string;
  reachTxt: (place: string, t: string, lostMin: number, slack: number) => string;
  shifts: string;
  lostItem: (name: string, mins: number) => string;
  rain: { title: string; body: string };
  darkWalk: (m: number, t: string) => string;
}

const en: Tpl = {
  wrapup: (p, t) => ({ title: `Wrapping up at ${p}`, body: `Time to finish up — you leave in 10 minutes (${t}).` }),
  prepare: (n, d, t, ride) => ({ title: `Leave in ${n} min for ${d}`, body: `Leave at ${t}. ${ride}`.trim() }),
  ride: (r, h, s, t) => `Take ${r} toward ${h} from ${s} at ${t}.`,
  leave: (d, w, s, r, h, t, has) => ({ title: `Time to leave for ${d}`, body: has ? `${w ? `${w} min walk to ${s}. ` : ""}${r} toward ${h} departs ${t}.` : `Head to ${d} now.` }),
  board: (r, h, s, t) => ({ title: `Next: ${r}`, body: `Board ${r} toward ${h} at ${s}, departs ${t}.` }),
  relaxTitle: "No need to rush",
  relax: (who, old, r, d, l, ol, reach) => `${who}no need to rush — your${old} ${r} is running ${d} min late. ${ol !== undefined && l !== undefined && ol !== l ? `Leave at ${l} instead of ${ol}.` : "Your plan simply shifts later."}${reach ?? ""}`.replace(/^./, (c) => c.toUpperCase()),
  relaxBrief: (r, d, l, ol) => ({ title: "Running late — no rush", body: `${r} is ${d} min late. Leave ${l}, not ${ol}.` }),
  adjust: (r, d, lost, l) => ({ title: "Plan adjusted", body: `${r} is ${d ?? "running"} min late.${lost ? ` We shortened ${lost} so the rest of your day still works.` : ""}${l ? ` Leave at ${l}.` : ""}`.trim() }),
  urgent: (r, s, t) => ({ title: "Leave now", body: `Leave now${r ? ` — ${r} departs ${t} from ${s}` : ""}.` }),
  closure: (s, n, k) => ({ title: "Route changed", body: `${s} is closed. ${n}${k}` }),
  cancelled: (r, o, n, k) => ({ title: `${r} cancelled`, body: `${r}${o} is cancelled. ${n}${k}` }),
  updated: (r, d, n, k) => ({ title: "Plan updated", body: `${r} is ${d ?? "running"} min late. ${n}${k}` }),
  next: (r, t, s, l) => `Take ${r} at ${t} from ${s}${l ? ` — leave by ${l}` : ""}.`,
  alt: (a, l) => `${a.kind === "cab" ? `Take a cab (about ₹${a.fare}, ${a.mins} min)` : `Walk ${a.mins} min to ${a.to ?? "your next stop"}`}${l ? ` — leave by ${l}` : ""}.`,
  newRoute: "We found a new route — open the app for details.",
  keepDrop: (l) => ` We had to drop ${l}.`,
  keepOk: " Your day still works.",
  reachTxt: (p, t, lost, slack) => ` You'll still reach ${p} at ${t}${lost ? ` — just ${lost} min less time there` : slack >= 15 ? ` with ${slack} min to spare` : ""}.`,
  shifts: "Your plan simply shifts later.",
  lostItem: (n, m) => `${n} by ${m} min`,
  rain: { title: "Rain expected", body: "Rain is likely today. Carry an umbrella and allow extra time for walking." },
  darkWalk: (m, t) => `Long walk after dark (${m} m around ${t}) — consider a cab or auto for the last stretch, or share your live trip with someone.`,
};

const hi: Tpl = {
  wrapup: (p, t) => ({ title: `${p} पर समय पूरा होने वाला है`, body: `निकलने की तैयारी करें — आप 10 मिनट में (${t}) निकलेंगे।` }),
  prepare: (n, d, t, ride) => ({ title: `${d} के लिए ${n} मिनट में निकलना है`, body: `${t} पर निकलें। ${ride}`.trim() }),
  ride: (r, h, s, t) => `${s} से ${t} पर ${r} (${h} की ओर) लें।`,
  leave: (d, w, s, r, h, t, has) => ({ title: `${d} के लिए निकलने का समय`, body: has ? `${w ? `${s} तक ${w} मिनट पैदल। ` : ""}${r} (${h} की ओर) ${t} पर छूटेगी।` : `अभी ${d} के लिए निकलें।` }),
  board: (r, h, s, t) => ({ title: `अगली: ${r}`, body: `${s} से ${r} (${h} की ओर) पकड़ें, ${t} पर छूटेगी।` }),
  relaxTitle: "जल्दबाज़ी की ज़रूरत नहीं",
  relax: (who, old, r, d, l, ol, reach) => `${who}जल्दबाज़ी की ज़रूरत नहीं — आपकी${old} ${r} ${d} मिनट देरी से चल रही है। ${ol !== undefined && l !== undefined && ol !== l ? `${ol} की जगह ${l} पर निकलें।` : "आपकी योजना बस थोड़ी देर से शुरू होगी।"}${reach ?? ""}`,
  relaxBrief: (r, d, l, ol) => ({ title: "देरी — जल्दी नहीं", body: `${r} ${d} मिनट लेट है। ${ol} नहीं, ${l} पर निकलें।` }),
  adjust: (r, d, lost, l) => ({ title: "योजना बदली गई", body: `${r} ${d ?? ""} मिनट लेट है।${lost ? ` बाकी दिन ठीक रखने के लिए ${lost} कम किया गया।` : ""}${l ? ` ${l} पर निकलें।` : ""}`.trim() }),
  urgent: (r, s, t) => ({ title: "अभी निकलें", body: `अभी निकलें${r ? ` — ${r} ${s} से ${t} पर छूटेगी` : ""}।` }),
  closure: (s, n, k) => ({ title: "रास्ता बदला", body: `${s} बंद है। ${n}${k}` }),
  cancelled: (r, o, n, k) => ({ title: `${r} रद्द`, body: `${r}${o} रद्द है। ${n}${k}` }),
  updated: (r, d, n, k) => ({ title: "योजना अपडेट", body: `${r} ${d ?? ""} मिनट लेट है। ${n}${k}` }),
  next: (r, t, s, l) => `${s} से ${t} पर ${r} लें${l ? ` — ${l} तक निकलें` : ""}।`,
  alt: (a, l) => `${a.kind === "cab" ? `कैब लें (लगभग ₹${a.fare}, ${a.mins} मिनट)` : `${a.to ?? "अगले स्टॉप"} तक ${a.mins} मिनट पैदल चलें`}${l ? ` — ${l} तक निकलें` : ""}।`,
  newRoute: "नया रास्ता मिला है — ऐप खोलें।",
  keepDrop: (l) => ` हमें ${l} छोड़ना पड़ा।`,
  keepOk: " आपका दिन फिर भी ठीक है।",
  reachTxt: (p, t, lost, slack) => ` आप फिर भी ${p} ${t} पर पहुँचेंगे${lost ? ` — वहाँ ${lost} मिनट कम समय मिलेगा` : slack >= 15 ? ` और ${slack} मिनट अतिरिक्त रहेंगे` : ""}।`,
  shifts: "आपकी योजना बस थोड़ी देर से शुरू होगी।",
  lostItem: (n, m) => `${n} ${m} मिनट`,
  rain: { title: "बारिश की संभावना", body: "आज बारिश हो सकती है — छाता रखें और पैदल चलने के लिए अतिरिक्त समय रखें।" },
  darkWalk: (m, t) => `अंधेरे में लंबी पैदल दूरी (${m} मी, लगभग ${t}) — आख़िरी हिस्से के लिए कैब/ऑटो लें या अपनी लाइव यात्रा किसी के साथ साझा करें।`,
};

const mr: Tpl = {
  wrapup: (p, t) => ({ title: `${p} येथील वेळ संपत आला आहे`, body: `निघण्याची तयारी करा — तुम्ही 10 मिनिटांत (${t}) निघणार आहात.` }),
  prepare: (n, d, t, ride) => ({ title: `${d} साठी ${n} मिनिटांत निघा`, body: `${t} वाजता निघा. ${ride}`.trim() }),
  ride: (r, h, s, t) => `${s} येथून ${t} वाजता ${r} (${h} दिशेने) पकडा.`,
  leave: (d, w, s, r, h, t, has) => ({ title: `${d} साठी निघण्याची वेळ`, body: has ? `${w ? `${s} पर्यंत ${w} मिनिटे चालत जा. ` : ""}${r} (${h} दिशेने) ${t} वाजता सुटेल.` : `आत्ताच ${d} कडे निघा.` }),
  board: (r, h, s, t) => ({ title: `पुढील: ${r}`, body: `${s} येथे ${r} (${h} दिशेने) पकडा, ${t} वाजता सुटेल.` }),
  relaxTitle: "घाई करण्याची गरज नाही",
  relax: (who, old, r, d, l, ol, reach) => `${who}घाई करण्याची गरज नाही — तुमची${old} ${r} ${d} मिनिटे उशिरा आहे. ${ol !== undefined && l !== undefined && ol !== l ? `${ol} ऐवजी ${l} वाजता निघा.` : "तुमची योजना थोडी उशिरा सुरू होईल."}${reach ?? ""}`,
  relaxBrief: (r, d, l, ol) => ({ title: "उशीर — घाई नको", body: `${r} ${d} मिनिटे उशिरा आहे. ${ol} नाही, ${l} वाजता निघा.` }),
  adjust: (r, d, lost, l) => ({ title: "योजना बदलली", body: `${r} ${d ?? ""} मिनिटे उशिरा आहे.${lost ? ` उर्वरित दिवस जुळवण्यासाठी ${lost} कमी केले.` : ""}${l ? ` ${l} वाजता निघा.` : ""}`.trim() }),
  urgent: (r, s, t) => ({ title: "आत्ताच निघा", body: `आत्ताच निघा${r ? ` — ${r} ${s} येथून ${t} वाजता सुटेल` : ""}.` }),
  closure: (s, n, k) => ({ title: "मार्ग बदलला", body: `${s} बंद आहे. ${n}${k}` }),
  cancelled: (r, o, n, k) => ({ title: `${r} रद्द`, body: `${r}${o} रद्द झाली आहे. ${n}${k}` }),
  updated: (r, d, n, k) => ({ title: "योजना अद्ययावत", body: `${r} ${d ?? ""} मिनिटे उशिरा आहे. ${n}${k}` }),
  next: (r, t, s, l) => `${s} येथून ${t} वाजता ${r} पकडा${l ? ` — ${l} पर्यंत निघा` : ""}.`,
  alt: (a, l) => `${a.kind === "cab" ? `कॅब घ्या (सुमारे ₹${a.fare}, ${a.mins} मिनिटे)` : `${a.to ?? "पुढील थांब्या"} पर्यंत ${a.mins} मिनिटे चालत जा`}${l ? ` — ${l} पर्यंत निघा` : ""}.`,
  newRoute: "नवीन मार्ग मिळाला आहे — अ‍ॅप उघडा.",
  keepDrop: (l) => ` आम्हाला ${l} वगळावे लागले.`,
  keepOk: " तुमचा दिवस तरीही जमतो.",
  reachTxt: (p, t, lost, slack) => ` तरीही तुम्ही ${p} येथे ${t} वाजता पोहोचाल${lost ? ` — तिथे ${lost} मिनिटे कमी वेळ मिळेल` : slack >= 15 ? ` आणि ${slack} मिनिटे हाताशी राहतील` : ""}.`,
  shifts: "तुमची योजना थोडी उशिरा सुरू होईल.",
  lostItem: (n, m) => `${n} ${m} मिनिटे`,
  rain: { title: "पावसाची शक्यता", body: "आज पाऊस पडण्याची शक्यता आहे — छत्री ठेवा आणि चालण्यासाठी जास्त वेळ राखा." },
  darkWalk: (m, t) => `अंधारात लांब चालणे (${m} मी, सुमारे ${t}) — शेवटच्या टप्प्यासाठी कॅब/रिक्षा घ्या किंवा तुमचा लाइव्ह प्रवास कुणाशी तरी शेअर करा.`,
};

export const TEMPLATES: Record<Lang, Tpl> = { en, hi, mr };
export const tpl = (lang: Lang | undefined): Tpl => TEMPLATES[lang ?? "en"] ?? en;
export const LANG_LABEL: Record<Lang, string> = { en: "English", hi: "हिन्दी", mr: "मराठी" };
