"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Lang } from "@repo/core";

// UI strings. Hindi and Marathi were written for this prototype and need review by native speakers before a pilot.
const en = {
  navPlan: "Plan", navTrip: "My trip", navReport: "Report a gap", navInsights: "Insights", navAuthority: "Authority sign in", live: "Live", offline: "Offline",
  planTitle: "Plan your route", planCrumb: "Work, errands and appointments — across Maharashtra", planBtn: "Plan my route", planning: "Planning…",
  heroH1: "Get your work done on the move.", heroP: "Add the places you need to be and when. We line up buses, metro and trains so you reach each one on time — and keep it right when things change.",
  yourRoute: "Your route", clearAll: "Clear all", tryExample: "Try an example", whereStart: "Where are you starting from?", leaveAt: "Leave at", useLocation: "use my location", change: "change", cancel: "cancel",
  addStop: "Add a stop — search a place or address", addFirst: "Add your first stop — search a place, or use the pin and click the map. Add as many as you need.",
  doing: "What are you doing here?", timeNeeded: "Time needed", beThereBy: "Be there by (optional)", mustHappen: "Must happen — never skip this stop", date: "Date", finishBy: "Finish by (optional)",
  orderOfStops: "Order of stops", myOrder: "My order", bestOrder: "Best order", returnStart: "Return to start", pace: "Pace", gentle: "Gentle", relaxed: "Relaxed", normal: "Normal", fast: "Fast", alertsLbl: "Alerts", calm: "Calm", brief: "Brief",
  transportLbl: "Transport I’m happy to use", localTrain: "Local train", expressTrain: "Express train", metro: "Metro", bus: "Bus", cab: "Cab if needed", yourName: "Your name (optional, for friendlier alerts)", language: "Language for alerts",
  gentleHint: "Gentle: shorter walks, extra time — for seniors or limited mobility.", popular: "popular places",
  yourPlan: "Your plan", stops: "stops", walking: "walking", fares: "fares", onTime: "on-time confidence", startLive: "Start live trip", shareTrip: "Share live trip", copied: "Link copied",
  impactTitle: "Compared with cabs for every hop", saves: "saves about", co2: "less CO₂ (est.)", howEstimate: "How we estimate",
  warnTitle: "Worth knowing", cantWork: "This can’t work as asked", leftOut: "Left out (optional stops that didn’t fit)",
  leave: "Leave", arrive: "arrive", likelyOnTime: "likely on time", beThere: "Be there by", lateFor: "Late for", planned: "planned", spareBefore: "spare before you leave", walk: "Walk", min: "min",
  reportTitle: "Report a connectivity gap", reportSub: "Help authorities see where public transport falls short", sendReport: "Send report", sending: "Sending…",
  nextUp: "Next", dayDone: "Day complete — enjoy your evening.", startDemo: "Start demo day", pause: "Pause", play: "Play", alertsTitle: "Alerts", simulator: "Disruption simulator", todaysPlan: "Today’s plan",
};
type K = keyof typeof en;
const hi: Record<K, string> = {
  navPlan: "योजना", navTrip: "मेरी यात्रा", navReport: "कमी बताएँ", navInsights: "विश्लेषण", navAuthority: "प्राधिकरण लॉगिन", live: "लाइव", offline: "ऑफ़लाइन",
  planTitle: "अपना रास्ता बनाएँ", planCrumb: "काम, ज़रूरी कार्य और अपॉइंटमेंट — पूरे महाराष्ट्र में", planBtn: "रास्ता बनाएँ", planning: "बन रहा है…",
  heroH1: "सफ़र में अपना काम निपटाएँ।", heroP: "जहाँ जाना है और कब — बताइए। हम बस, मेट्रो और ट्रेन को जोड़कर हर जगह समय पर पहुँचाते हैं, और हालात बदलने पर योजना सही रखते हैं।",
  yourRoute: "आपका रास्ता", clearAll: "सब हटाएँ", tryExample: "उदाहरण आज़माएँ", whereStart: "आप कहाँ से शुरू कर रहे हैं?", leaveAt: "निकलने का समय", useLocation: "मेरा स्थान लें", change: "बदलें", cancel: "रद्द करें",
  addStop: "पड़ाव जोड़ें — जगह या पता खोजें", addFirst: "पहला पड़ाव जोड़ें — जगह खोजें, या पिन दबाकर नक्शे पर क्लिक करें। जितने चाहें जोड़ें।",
  doing: "यहाँ क्या करना है?", timeNeeded: "कितना समय चाहिए", beThereBy: "इस समय तक पहुँचना है (वैकल्पिक)", mustHappen: "ज़रूरी है — यह पड़ाव न छोड़ें", date: "तारीख़", finishBy: "कब तक खत्म करना है (वैकल्पिक)",
  orderOfStops: "पड़ावों का क्रम", myOrder: "मेरा क्रम", bestOrder: "सबसे अच्छा क्रम", returnStart: "शुरुआती जगह लौटें", pace: "गति", gentle: "आराम से", relaxed: "धीमी", normal: "सामान्य", fast: "तेज़", alertsLbl: "अलर्ट", calm: "शांत", brief: "संक्षिप्त",
  transportLbl: "मैं इन साधनों का उपयोग करूँगा/करूँगी", localTrain: "लोकल ट्रेन", expressTrain: "एक्सप्रेस ट्रेन", metro: "मेट्रो", bus: "बस", cab: "ज़रूरत पर कैब", yourName: "आपका नाम (वैकल्पिक, अलर्ट के लिए)", language: "अलर्ट की भाषा",
  gentleHint: "आराम से: कम पैदल चलना, अतिरिक्त समय — बुज़ुर्गों या सीमित गतिशीलता के लिए।", popular: "लोकप्रिय स्थान",
  yourPlan: "आपकी योजना", stops: "पड़ाव", walking: "पैदल", fares: "किराया", onTime: "समय पर पहुँचने का भरोसा", startLive: "लाइव यात्रा शुरू करें", shareTrip: "लाइव यात्रा साझा करें", copied: "लिंक कॉपी हुआ",
  impactTitle: "हर यात्रा कैब से करने की तुलना में", saves: "लगभग बचत", co2: "कम CO₂ (अनुमान)", howEstimate: "अनुमान कैसे लगाते हैं",
  warnTitle: "ध्यान दें", cantWork: "यह इस तरह संभव नहीं है", leftOut: "छूटे हुए (वैकल्पिक पड़ाव जो समा नहीं पाए)",
  leave: "निकलें", arrive: "पहुँचें", likelyOnTime: "समय पर पहुँचने की संभावना", beThere: "इस समय तक पहुँचना", lateFor: "देर होगी", planned: "तय", spareBefore: "निकलने से पहले अतिरिक्त", walk: "पैदल", min: "मिनट",
  reportTitle: "कनेक्टिविटी की कमी बताएँ", reportSub: "अधिकारियों को दिखाएँ कि सार्वजनिक परिवहन कहाँ कम पड़ता है", sendReport: "रिपोर्ट भेजें", sending: "भेज रहे हैं…",
  nextUp: "अगला", dayDone: "दिन पूरा — शाम का आनंद लें।", startDemo: "डेमो दिन शुरू करें", pause: "रोकें", play: "चलाएँ", alertsTitle: "अलर्ट", simulator: "बाधा सिम्युलेटर", todaysPlan: "आज की योजना",
};
const mr: Record<K, string> = {
  navPlan: "योजना", navTrip: "माझा प्रवास", navReport: "उणीव कळवा", navInsights: "विश्लेषण", navAuthority: "प्राधिकरण लॉगिन", live: "लाइव्ह", offline: "ऑफलाइन",
  planTitle: "तुमचा मार्ग आखा", planCrumb: "काम, कामे आणि भेटी — संपूर्ण महाराष्ट्रात", planBtn: "मार्ग आखा", planning: "आखत आहे…",
  heroH1: "प्रवासातच तुमची कामे उरका.", heroP: "कुठे जायचे आणि कधी — सांगा. आम्ही बस, मेट्रो आणि रेल्वे जोडून प्रत्येक ठिकाणी वेळेवर पोहोचवतो, आणि परिस्थिती बदलली की योजना जुळवतो.",
  yourRoute: "तुमचा मार्ग", clearAll: "सर्व काढा", tryExample: "उदाहरण पहा", whereStart: "तुम्ही कुठून निघत आहात?", leaveAt: "निघण्याची वेळ", useLocation: "माझे स्थान वापरा", change: "बदला", cancel: "रद्द",
  addStop: "थांबा जोडा — ठिकाण किंवा पत्ता शोधा", addFirst: "पहिला थांबा जोडा — ठिकाण शोधा, किंवा पिन दाबून नकाशावर क्लिक करा. हवे तितके जोडा.",
  doing: "तिथे काय करायचे आहे?", timeNeeded: "किती वेळ लागेल", beThereBy: "इतक्या वेळेपर्यंत पोहोचायचे (ऐच्छिक)", mustHappen: "आवश्यक — हा थांबा वगळू नका", date: "तारीख", finishBy: "किती वाजेपर्यंत संपवायचे (ऐच्छिक)",
  orderOfStops: "थांब्यांचा क्रम", myOrder: "माझा क्रम", bestOrder: "सर्वोत्तम क्रम", returnStart: "सुरुवातीच्या ठिकाणी परत", pace: "गती", gentle: "सावकाश", relaxed: "संथ", normal: "सामान्य", fast: "जलद", alertsLbl: "सूचना", calm: "शांत", brief: "संक्षिप्त",
  transportLbl: "मी ही साधने वापरेन", localTrain: "लोकल ट्रेन", expressTrain: "एक्सप्रेस ट्रेन", metro: "मेट्रो", bus: "बस", cab: "गरज पडल्यास कॅब", yourName: "तुमचे नाव (ऐच्छिक, सूचनांसाठी)", language: "सूचनांची भाषा",
  gentleHint: "सावकाश: कमी चालणे, जास्त वेळ — ज्येष्ठ किंवा मर्यादित हालचाल असलेल्यांसाठी.", popular: "लोकप्रिय ठिकाणे",
  yourPlan: "तुमची योजना", stops: "थांबे", walking: "चालणे", fares: "भाडे", onTime: "वेळेवर पोहोचण्याची खात्री", startLive: "लाइव्ह प्रवास सुरू करा", shareTrip: "लाइव्ह प्रवास शेअर करा", copied: "लिंक कॉपी झाली",
  impactTitle: "प्रत्येक टप्प्यासाठी कॅब घेतली तर त्याच्याशी तुलना", saves: "सुमारे बचत", co2: "कमी CO₂ (अंदाज)", howEstimate: "अंदाज कसा काढतो",
  warnTitle: "लक्षात ठेवा", cantWork: "हे असे जमणार नाही", leftOut: "वगळलेले (ऐच्छिक थांबे जे बसले नाहीत)",
  leave: "निघा", arrive: "पोहोचा", likelyOnTime: "वेळेवर पोहोचण्याची शक्यता", beThere: "इतक्या वेळेपर्यंत पोहोचा", lateFor: "उशीर होईल", planned: "ठरलेले", spareBefore: "निघण्यापूर्वी जास्तीचे", walk: "चालत", min: "मिनिटे",
  reportTitle: "कनेक्टिव्हिटीतील उणीव कळवा", reportSub: "सार्वजनिक वाहतूक कुठे कमी पडते ते अधिकाऱ्यांना दाखवा", sendReport: "अहवाल पाठवा", sending: "पाठवत आहे…",
  nextUp: "पुढे", dayDone: "दिवस पूर्ण — संध्याकाळचा आनंद घ्या.", startDemo: "डेमो दिवस सुरू करा", pause: "थांबवा", play: "सुरू करा", alertsTitle: "सूचना", simulator: "अडथळा सिम्युलेटर", todaysPlan: "आजची योजना",
};
const DICT: Record<Lang, Record<K, string>> = { en, hi, mr };

interface Ctx { lang: Lang; setLang: (l: Lang) => void; t: (k: K) => string }
const C = createContext<Ctx>({ lang: "en", setLang: () => {}, t: (k) => en[k] });
const KEY = "safarsetu:lang";

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => { try { const s = localStorage.getItem(KEY) as Lang | null; if (s && DICT[s]) setLangState(s); } catch { /* ignore */ } }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = (l: Lang) => { setLangState(l); try { localStorage.setItem(KEY, l); } catch { /* ignore */ } };
  return <C.Provider value={{ lang, setLang, t: (k) => DICT[lang][k] ?? en[k] }}>{children}</C.Provider>;
}
export const useLang = () => useContext(C);
