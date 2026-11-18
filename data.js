export const EVENT_TO_PUZZLE = {
  "333": "3x3x3", "222": "2x2x2", "444": "4x4x4", "555": "5x5x5",
  "666": "6x6x6", "777": "7x7x7", "333oh": "3x3x3", "333bf": "3x3x3",
  "pyram": "pyraminx", "skewb": "skewb", "sq1": "square1", "clock": "clock", "minx": "megaminx",
};

export const CSTIMER_EVENT_MAP = {
  "333": "333", "333o": "333", "333ni": "333bf", "333oh": "333oh",
  "222so": "222", "222o": "222", "222": "222", "444wca": "444", "444": "444", "444m": "444",
  "555wca": "555", "555": "555", "666wca": "666", "666": "666", "777wca": "777", "777": "777",
  "pyrso": "pyram", "pyram": "pyram", "pyr": "pyram",
  "skbso": "skewb", "skewb": "skewb", "skb": "skewb",
  "sqrs": "sq1", "sq1": "sq1", "clkwca": "clock", "clock": "clock", "clk": "clock",
  "mgmp": "minx", "minx": "minx",
};

const svgUri = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`;

export const PREMADE_SCENES = [
  {
    id: "mountains", name: "Midnight Peaks",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#0b132b'/><stop offset='55%' stop-color='#1c2541'/><stop offset='100%' stop-color='#0b0f19'/></linearGradient><radialGradient id='m' cx='72%' cy='24%' r='35%'><stop offset='0%' stop-color='#6fffe9' stop-opacity='0.35'/><stop offset='100%' stop-color='#1c2541' stop-opacity='0'/></radialGradient></defs><rect width='1200' height='800' fill='url(#g)'/><rect width='1200' height='800' fill='url(#m)'/><path d='M0 560 L180 410 L350 510 L570 320 L780 480 L980 350 L1200 490 L1200 800 L0 800 Z' fill='#141c33'/><path d='M0 640 L240 500 L440 600 L690 430 L920 580 L1110 470 L1200 540 L1200 800 L0 800 Z' fill='#0e1424'/><path d='M0 710 L320 620 L620 690 L930 610 L1200 680 L1200 800 L0 800 Z' fill='#080b14'/></svg>`),
  },
  {
    id: "tokyo-rain", name: "Tokyo Drizzle",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='sky' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#0f172a'/><stop offset='60%' stop-color='#1e293b'/><stop offset='100%' stop-color='#090d16'/></linearGradient><radialGradient id='glow1' cx='28%' cy='42%' r='35%'><stop offset='0%' stop-color='#10b981' stop-opacity='0.35'/><stop offset='100%' stop-color='#0f172a' stop-opacity='0'/></radialGradient><radialGradient id='glow2' cx='75%' cy='55%' r='35%'><stop offset='0%' stop-color='#38bdf8' stop-opacity='0.3'/><stop offset='100%' stop-color='#0f172a' stop-opacity='0'/></radialGradient></defs><rect width='1200' height='800' fill='url(#sky)'/><rect width='1200' height='800' fill='url(#glow1)'/><rect width='1200' height='800' fill='url(#glow2)'/><g fill='#090e1a' opacity='0.85'><rect x='60' y='340' width='90' height='460'/><rect x='170' y='260' width='110' height='540'/><rect x='300' y='390' width='80' height='410'/><rect x='420' y='210' width='130' height='590'/><rect x='580' y='310' width='95' height='490'/><rect x='700' y='190' width='120' height='610'/><rect x='850' y='290' width='110' height='510'/><rect x='990' y='240' width='140' height='560'/></g></svg>`),
  },
  {
    id: "hearth", name: "Hearth Ember",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><radialGradient id='fire' cx='50%' cy='72%' r='65%'><stop offset='0%' stop-color='#f59e0b' stop-opacity='0.55'/><stop offset='40%' stop-color='#9a3412' stop-opacity='0.45'/><stop offset='100%' stop-color='#0c0908'/></radialGradient></defs><rect width='1200' height='800' fill='#0c0908'/><rect width='1200' height='800' fill='url(#fire)'/><circle cx='340' cy='520' r='4' fill='#fbbf24' opacity='0.6'/><circle cx='580' cy='430' r='5' fill='#f59e0b' opacity='0.5'/></svg>`),
  },
  {
    id: "solar-dusk", name: "Solar Dusk",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='dusk' x1='0' y1='0' x2='0.8' y2='1'><stop offset='0%' stop-color='#1e1b4b'/><stop offset='50%' stop-color='#4c1d95'/><stop offset='100%' stop-color='#0f0a19'/></linearGradient><radialGradient id='sun' cx='50%' cy='46%' r='38%'><stop offset='0%' stop-color='#fb7185' stop-opacity='0.6'/><stop offset='60%' stop-color='#f59e0b' stop-opacity='0.2'/><stop offset='100%' stop-color='#1e1b4b' stop-opacity='0'/></radialGradient></defs><rect width='1200' height='800' fill='url(#dusk)'/><rect width='1200' height='800' fill='url(#sun)'/></svg>`),
  },
  {
    id: "aurora", name: "Aurora Night",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'><defs><linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#040814'/><stop offset='100%' stop-color='#0a192f'/></linearGradient><linearGradient id='au' x1='0' y1='0' x2='1' y2='0.6'><stop offset='0%' stop-color='#06b6d4' stop-opacity='0'/><stop offset='35%' stop-color='#2dd4bf' stop-opacity='0.45'/><stop offset='65%' stop-color='#818cf8' stop-opacity='0.4'/><stop offset='100%' stop-color='#06b6d4' stop-opacity='0'/></linearGradient></defs><rect width='1200' height='800' fill='url(#n)'/><path d='M-50 320 C240 160, 480 420, 780 220 C980 100, 1100 260, 1260 180 L1260 520 C960 420, 620 600, 320 460 C120 380, 20 460, -50 490 Z' fill='url(#au)'/></svg>`),
  },
];

export const QUICK_MOODS = [
  { id: "mono", name: "Mono", dot: "#f5f5f5", accent: "#f5f5f5", bg: "#0a0a0a", sidebar: "#121212", card: "#1b1b1b", text: "#f5f5f5", muted: "#9a9a9a" },
  { id: "emerald", name: "Emerald", dot: "#10b981", accent: "#10b981", bg: "#090c10", sidebar: "#10141b", card: "#171c26", text: "#f3f4f6", muted: "#9ca3af" },
  { id: "neon", name: "Neon", dot: "#ec4899", accent: "#ec4899", bg: "#09090e", sidebar: "#11101a", card: "#191726", text: "#faf5ff", muted: "#a78bfa" },
  { id: "aqua", name: "Aqua", dot: "#06b6d4", accent: "#06b6d4", bg: "#071018", sidebar: "#0d1824", card: "#132233", text: "#ecfeff", muted: "#7dd3fc" },
  { id: "amber", name: "Amber", dot: "#f59e0b", accent: "#f59e0b", bg: "#110d0a", sidebar: "#1a1410", card: "#241b15", text: "#fef3c7", muted: "#d97706" },
  { id: "oled", name: "OLED", dot: "#e5e5e5", accent: "#ffffff", bg: "#000000", sidebar: "#050505", card: "#0d0d0d", text: "#ffffff", muted: "#737373" },
  { id: "light", name: "Light", dot: "#111111", accent: "#111111", bg: "#f4f3ef", sidebar: "#ffffff", card: "#eae8e1", text: "#111111", muted: "#6b7280" },
];

export const COLOR_PRESETS = [
  { id: "c-mono", name: "Noir Monochrome", desc: "Matte black & crisp white", theme: { mood: "mono", bgMode: "color", bgColor: "#0a0a0a", sidebarColor: "#121212", cardColor: "#1b1b1b", scrambleColor: "#141414", textColor: "#f5f5f5", mutedColor: "#9a9a9a", accentColor: "#f5f5f5", holdingColor: "#ef4444", readyColor: "#22c55e", sidebarAlpha: 92, sidebarBlur: 12, timerBackdrop: false, scrambleBox: false, radius: 10 } },
  { id: "c-emerald", name: "Emerald Slate", desc: "Dark slate & emerald accent", theme: { mood: "emerald", bgMode: "color", bgColor: "#090c10", sidebarColor: "#10141b", cardColor: "#171c26", scrambleColor: "#141922", textColor: "#f3f4f6", mutedColor: "#9ca3af", accentColor: "#10b981", holdingColor: "#ef4444", readyColor: "#10b981", sidebarAlpha: 90, sidebarBlur: 14, timerBackdrop: false, scrambleBox: true, radius: 12 } },
  { id: "c-oled", name: "OLED Pitch", desc: "True #000000 pure dark", theme: { mood: "oled", bgMode: "color", bgColor: "#000000", sidebarColor: "#050505", cardColor: "#0d0d0d", scrambleColor: "#0a0a0a", textColor: "#ffffff", mutedColor: "#737373", accentColor: "#ffffff", holdingColor: "#ef4444", readyColor: "#22c55e", sidebarAlpha: 96, sidebarBlur: 8, timerBackdrop: false, scrambleBox: false, radius: 6 } },
  { id: "c-aqua", name: "Arctic Aqua", desc: "Deep ocean & cyan glow", theme: { mood: "aqua", bgMode: "color", bgColor: "#071018", sidebarColor: "#0d1824", cardColor: "#132233", scrambleColor: "#101e2e", textColor: "#ecfeff", mutedColor: "#7dd3fc", accentColor: "#06b6d4", holdingColor: "#f43f5e", readyColor: "#22d3ee", sidebarAlpha: 88, sidebarBlur: 14, timerBackdrop: false, scrambleBox: true, radius: 12 } },
  { id: "c-neon", name: "Cyber Neon", desc: "Obsidian & electric pink", theme: { mood: "neon", bgMode: "color", bgColor: "#09090e", sidebarColor: "#11101a", cardColor: "#191726", scrambleColor: "#171424", textColor: "#faf5ff", mutedColor: "#a78bfa", accentColor: "#ec4899", holdingColor: "#f43f5e", readyColor: "#22c55e", sidebarAlpha: 88, sidebarBlur: 14, timerBackdrop: false, scrambleBox: true, radius: 12 } },
  { id: "c-amber", name: "Warm Espresso", desc: "Cozy dark amber tones", theme: { mood: "amber", bgMode: "color", bgColor: "#110d0a", sidebarColor: "#1a1410", cardColor: "#241b15", scrambleColor: "#211913", textColor: "#fef3c7", mutedColor: "#d97706", accentColor: "#f59e0b", holdingColor: "#ef4444", readyColor: "#84cc16", sidebarAlpha: 90, sidebarBlur: 12, timerBackdrop: false, scrambleBox: true, radius: 10 } },
  { id: "c-light", name: "Paper Daylight", desc: "Warm off-white studio", theme: { mood: "light", bgMode: "color", bgColor: "#f4f3ef", sidebarColor: "#ffffff", cardColor: "#eae8e1", scrambleColor: "#ffffff", textColor: "#111111", mutedColor: "#6b7280", accentColor: "#111111", holdingColor: "#dc2626", readyColor: "#16a34a", sidebarAlpha: 92, sidebarBlur: 12, timerBackdrop: false, scrambleBox: true, radius: 10 } },
];

export const SCENE_PRESETS = [
  { id: "s-mountains", name: "Midnight Peaks", desc: "Frosted twilight + cyan", theme: { mood: "aqua", bgMode: "scene", sceneId: "mountains", bgBlur: 7, bgDim: 38, bgPosY: 50, bgScale: 106, bgColor: "#0b132b", sidebarColor: "#0d1426", cardColor: "#151f38", scrambleColor: "#111a30", textColor: "#f0f9ff", mutedColor: "#93c5fd", accentColor: "#38bdf8", holdingColor: "#fb7185", readyColor: "#34d399", sidebarAlpha: 72, sidebarBlur: 18, timerBackdrop: true, scrambleBox: true, radius: 14 } },
  { id: "s-tokyo", name: "Tokyo Drizzle", desc: "Rainy skyline + emerald", theme: { mood: "emerald", bgMode: "scene", sceneId: "tokyo-rain", bgBlur: 8, bgDim: 42, bgPosY: 50, bgScale: 106, bgColor: "#0f172a", sidebarColor: "#0f141d", cardColor: "#18202c", scrambleColor: "#121a24", textColor: "#f8fafc", mutedColor: "#94a3b8", accentColor: "#10b981", holdingColor: "#ef4444", readyColor: "#10b981", sidebarAlpha: 76, sidebarBlur: 16, timerBackdrop: false, scrambleBox: true, radius: 12 } },
  { id: "s-hearth", name: "Hearth Ember", desc: "Warm glow + gold accent", theme: { mood: "amber", bgMode: "scene", sceneId: "hearth", bgBlur: 10, bgDim: 35, bgPosY: 50, bgScale: 108, bgColor: "#0c0908", sidebarColor: "#17110e", cardColor: "#241a14", scrambleColor: "#1f1611", textColor: "#fffbeb", mutedColor: "#d6a87c", accentColor: "#f59e0b", holdingColor: "#ef4444", readyColor: "#4ade80", sidebarAlpha: 74, sidebarBlur: 16, timerBackdrop: true, scrambleBox: true, radius: 14 } },
  { id: "s-dusk", name: "Solar Dusk", desc: "Violet ridges + coral", theme: { mood: "neon", bgMode: "scene", sceneId: "solar-dusk", bgBlur: 8, bgDim: 36, bgPosY: 50, bgScale: 106, bgColor: "#140d26", sidebarColor: "#150e26", cardColor: "#22163b", scrambleColor: "#1b1130", textColor: "#fdf4ff", mutedColor: "#c4b5fd", accentColor: "#fb7185", holdingColor: "#f43f5e", readyColor: "#34d399", sidebarAlpha: 74, sidebarBlur: 18, timerBackdrop: true, scrambleBox: true, radius: 14 } },
  { id: "s-aurora", name: "Aurora Night", desc: "Northern lights + mint", theme: { mood: "aqua", bgMode: "scene", sceneId: "aurora", bgBlur: 9, bgDim: 34, bgPosY: 50, bgScale: 106, bgColor: "#040814", sidebarColor: "#091121", cardColor: "#101d33", scrambleColor: "#0d1729", textColor: "#ecfeff", mutedColor: "#7dd3fc", accentColor: "#2dd4bf", holdingColor: "#fb7185", readyColor: "#2dd4bf", sidebarAlpha: 74, sidebarBlur: 18, timerBackdrop: false, scrambleBox: true, radius: 12 } },
];

// Complete WCA OLLs (1-57) & PLLs (21) for CFOP
import { PLL_CASES } from "./trainer.js";

const FULL_OLL_ALGS = [
  { id: "oll-1", name: "OLL 1 (Dot)", cat: "OLL", stickering: "OLL", alg: "R U2 R2 F R F' U2 R' F R F'", tip: "No edges oriented." },
  { id: "oll-2", name: "OLL 2 (Dot)", cat: "OLL", stickering: "OLL", alg: "F R U R' U' F' U2 F R U R' U' F'", tip: "No edges oriented." },
  { id: "oll-3", name: "OLL 3 (Dot)", cat: "OLL", stickering: "OLL", alg: "f R U R' U' f' U f R U R' U' f'", tip: "No edges oriented." },
  { id: "oll-4", name: "OLL 4 (Dot)", cat: "OLL", stickering: "OLL", alg: "f R U R' U' f' U2 f R U R' U' f'", tip: "No edges oriented." },
  { id: "oll-5", name: "OLL 5 (Square)", cat: "OLL", stickering: "OLL", alg: "r' U2 R U R' U r", tip: "Square in back-left." },
  { id: "oll-6", name: "OLL 6 (Square)", cat: "OLL", stickering: "OLL", alg: "r U2 R' U' R U' r'", tip: "Square in front-left." },
  { id: "oll-7", name: "OLL 7 (Lightning)", cat: "OLL", stickering: "OLL", alg: "r U R' U R U2 r'", tip: "Small lightning bolt front-left." },
  { id: "oll-8", name: "OLL 8 (Lightning)", cat: "OLL", stickering: "OLL", alg: "r' U' R U' R' U2 r", tip: "Small lightning bolt front-right." },
  { id: "oll-9", name: "OLL 9 (Fish)", cat: "OLL", stickering: "OLL", alg: "R U R' U' R' F R F'", tip: "Fish shape." },
  { id: "oll-10", name: "OLL 10 (Fish)", cat: "OLL", stickering: "OLL", alg: "R U R' U R' F R F' R U2 R'", tip: "Fish shape." },
  { id: "oll-11", name: "OLL 11 (T-Shape)", cat: "OLL", stickering: "OLL", alg: "r' R2 U R' U r U2 r' U M'", tip: "T-Shape." },
  { id: "oll-12", name: "OLL 12 (T-Shape)", cat: "OLL", stickering: "OLL", alg: "M U R U R' U' M' R' F R F'", tip: "T-Shape." },
  { id: "oll-13", name: "OLL 13 (C-Shape)", cat: "OLL", stickering: "OLL", alg: "F U R U' R' F' U2 F R U R' U' F'", tip: "C-Shape." },
  { id: "oll-14", name: "OLL 14 (Awkward)", cat: "OLL", stickering: "OLL", alg: "R' F R U R' F' R F U' F'", tip: "Awkward shape." },
  { id: "oll-15", name: "OLL 15 (Awkward)", cat: "OLL", stickering: "OLL", alg: "r' U' r R' U' R U r' U r", tip: "Awkward shape." },
  { id: "oll-16", name: "OLL 16 (Awkward)", cat: "OLL", stickering: "OLL", alg: "r U r' R U R' U' r U' r'", tip: "Awkward shape." },
  { id: "oll-17", name: "OLL 17 (Line)", cat: "OLL", stickering: "OLL", alg: "R U R' U R' F R F' U2 R' F R F'", tip: "Line." },
  { id: "oll-18", name: "OLL 18 (Line)", cat: "OLL", stickering: "OLL", alg: "F R U R' U' F' U2 F R U R' U' F'", tip: "Line." },
  { id: "oll-19", name: "OLL 19 (Line)", cat: "OLL", stickering: "OLL", alg: "r' R U R U R' U' M' R' F R F'", tip: "Line." },
  { id: "oll-20", name: "OLL 20 (Line)", cat: "OLL", stickering: "OLL", alg: "R U R' U' M' U R U' r'", tip: "Line." },
  { id: "oll-21", name: "OLL 21 (H)", cat: "OLL", stickering: "OLL", alg: "R U R' U R U' R' U R U2 R'", tip: "Cross + headlights front/back." },
  { id: "oll-22", name: "OLL 22 (Pi)", cat: "OLL", stickering: "OLL", alg: "R U2 R2 U' R2 U' R2 U2 R", tip: "Cross + headlights left/right." },
  { id: "oll-23", name: "OLL 23 (Headlights)", cat: "OLL", stickering: "OLL", alg: "R2 D R' U2 R D' R' U2 R'", tip: "Cross + headlights front." },
  { id: "oll-24", name: "OLL 24 (Chameleon)", cat: "OLL", stickering: "OLL", alg: "r U R' U' r' F R F'", tip: "Cross + corners facing opposite." },
  { id: "oll-25", name: "OLL 25 (Bowtie)", cat: "OLL", stickering: "OLL", alg: "F R' F' r U R U' r'", tip: "Cross + diagonal corners." },
  { id: "oll-26", name: "OLL 26 (Anti-Sune)", cat: "OLL", stickering: "OLL", alg: "R U2 R' U' R U' R'", tip: "Cross + 1 corner." },
  { id: "oll-27", name: "OLL 27 (Sune)", cat: "OLL", stickering: "OLL", alg: "R U R' U R U2 R'", tip: "Cross + 1 corner." },
  { id: "oll-28", name: "OLL 28 (Corners)", cat: "OLL", stickering: "OLL", alg: "r U R' U' r' R U R U' R'", tip: "Corners oriented." },
  { id: "oll-29", name: "OLL 29 (Spaghetti)", cat: "OLL", stickering: "OLL", alg: "R U R' U' R' F R F' R U R' U' R' F R F'", tip: "Extended cross." },
  { id: "oll-30", name: "OLL 30 (Spaghetti)", cat: "OLL", stickering: "OLL", alg: "F R' F' R U R U' R' F R F' R U R' U' R' F R F'", tip: "Extended cross." },
  { id: "oll-31", name: "OLL 31 (P-Shape)", cat: "OLL", stickering: "OLL", alg: "R' U' F U R U' R' F' R", tip: "P-Shape." },
  { id: "oll-32", name: "OLL 32 (U-Shape)", cat: "OLL", stickering: "OLL", alg: "S' L' U' L U L F' L' f", tip: "U-Shape." },
  { id: "oll-33", name: "OLL 33 (T-Shape)", cat: "OLL", stickering: "OLL", alg: "R U R' U' R' F R F'", tip: "T-Shape." },
  { id: "oll-34", name: "OLL 34 (C-Shape)", cat: "OLL", stickering: "OLL", alg: "R U R2 U' R' F R U R U' F'", tip: "C-Shape." },
  { id: "oll-35", name: "OLL 35 (Fish)", cat: "OLL", stickering: "OLL", alg: "R U2 R' F R' F' R U2 R'", tip: "Fish shape." },
  { id: "oll-36", name: "OLL 36 (W-Shape)", cat: "OLL", stickering: "OLL", alg: "L' U' L U' L' U L U L F' L' F", tip: "W-Shape." },
  { id: "oll-37", name: "OLL 37 (Fish)", cat: "OLL", stickering: "OLL", alg: "F R' F' R U R U' R'", tip: "Fish shape." },
  { id: "oll-38", name: "OLL 38 (W-Shape)", cat: "OLL", stickering: "OLL", alg: "R U R' U R U' R' U' R' F R F'", tip: "W-Shape." },
  { id: "oll-39", name: "OLL 39 (Big Lightning)", cat: "OLL", stickering: "OLL", alg: "L F' L' U' L U F U' L'", tip: "Big Lightning." },
  { id: "oll-40", name: "OLL 40 (Big Lightning)", cat: "OLL", stickering: "OLL", alg: "R' F R U R' U' F' U R", tip: "Big Lightning." },
  { id: "oll-41", name: "OLL 41 (Awkward)", cat: "OLL", stickering: "OLL", alg: "R U R' U R U2 R' F R U R' U' F'", tip: "Awkward shape." },
  { id: "oll-42", name: "OLL 42 (Awkward)", cat: "OLL", stickering: "OLL", alg: "R' U' R U' R' U2 R F R U R' U' F'", tip: "Awkward shape." },
  { id: "oll-43", name: "OLL 43 (P-Shape)", cat: "OLL", stickering: "OLL", alg: "f' L' U' L U f", tip: "P-Shape." },
  { id: "oll-44", name: "OLL 44 (P-Shape)", cat: "OLL", stickering: "OLL", alg: "f R U R' U' f'", tip: "P-Shape." },
  { id: "oll-45", name: "OLL 45 (T-Line)", cat: "OLL", stickering: "OLL", alg: "F R U R' U' F'", tip: "T-Line." },
  { id: "oll-46", name: "OLL 46 (C-Shape)", cat: "OLL", stickering: "OLL", alg: "R' U' R' F R F' U R", tip: "C-Shape." },
  { id: "oll-47", name: "OLL 47 (Small Lightning)", cat: "OLL", stickering: "OLL", alg: "R' U' F' U F R", tip: "Small Lightning." },
  { id: "oll-48", name: "OLL 48 (Small Lightning)", cat: "OLL", stickering: "OLL", alg: "F R U R' U' R U R' U' F'", tip: "Small Lightning." },
  { id: "oll-49", name: "OLL 49 (Small Lightning)", cat: "OLL", stickering: "OLL", alg: "r' U' R U' R' U2 r", tip: "Small Lightning." },
  { id: "oll-50", name: "OLL 50 (Small Lightning)", cat: "OLL", stickering: "OLL", alg: "r U R' U R U2 r'", tip: "Small Lightning." },
  { id: "oll-51", name: "OLL 51 (I-Shape)", cat: "OLL", stickering: "OLL", alg: "f R U R' U' f' F R U R' U' F'", tip: "I-Shape." },
  { id: "oll-52", name: "OLL 52 (I-Shape)", cat: "OLL", stickering: "OLL", alg: "R U R' U R U' B' U' B R'", tip: "I-Shape." },
  { id: "oll-53", name: "OLL 53 (I-Shape)", cat: "OLL", stickering: "OLL", alg: "l' U2 L U L' U l", tip: "I-Shape." },
  { id: "oll-54", name: "OLL 54 (I-Shape)", cat: "OLL", stickering: "OLL", alg: "l U2 l' U' l U' l'", tip: "I-Shape." },
  { id: "oll-55", name: "OLL 55 (I-Shape)", cat: "OLL", stickering: "OLL", alg: "R' F R U R U' R2 F' R2 U R' U' R", tip: "I-Shape." },
  { id: "oll-56", name: "OLL 56 (I-Shape)", cat: "OLL", stickering: "OLL", alg: "r' U' r U' r' U2 r F R U R' U' F'", tip: "I-Shape." },
  { id: "oll-57", name: "OLL 57 (H)", cat: "OLL", stickering: "OLL", alg: "R U R' U' M' U R U' r'", tip: "H-Shape." },
];

export const METHOD_GUIDES = {
  CFOP: {
    title: "CFOP Solve Guide",
    subtitle: "Cross, F2L, OLL, and PLL—optimize every split of your solve.",
    stages: [
      { id: "cfop-cross", title: "1. Cross", split: "~12% of solve • <= 8 moves", stickering: "Cross", alg: "F R' D' R F2", points: ["<strong>Solve on Bottom (D):</strong> Keep white/yellow on D so you transition directly into F2L with zero cube flips.", "<strong>Plan all 4 edges in inspection:</strong> Learn relative color order (Blue-Orange-Green-Red) so you don't align centers early.", "<strong>8-move rule:</strong> Every 3x3 cross can be solved in 8 moves or fewer."] },
      { id: "cfop-f2l", title: "2. F2L (First Two Layers)", split: "~50% of solve • Core speed", stickering: "F2L", alg: "U R U' R' U' F' U F", points: ["<strong>Fill back slots first:</strong> Solving BL/BR early keeps open pieces visible in front.", "<strong>Limit cube rotations:</strong> Use wide inserts or sledgehammers (R' F R F') instead of rotating twice.", "<strong>Lookahead drill:</strong> Turn at 60% speed with zero pauses between pairs."] },
      { id: "cfop-oll", title: "3. OLL (Orient Last Layer)", split: "~18% of solve • All 57 OLLs", stickering: "OLL", alg: "F R U R' U' F' R U R' U R U2 R'", points: ["<strong>Full OLL:</strong> Learn all 57 cases to orient the last layer in one look.", "<strong>Use triggers:</strong> Group moves into Sexy (R U R' U') and Sledge (R' F R F')."] },
      { id: "cfop-pll", title: "4. PLL (Permute Last Layer)", split: "~20% of solve • All 21 PLLs", stickering: "PLL", alg: "R U R' U' R' F R2 U' R' U' R U R' F'", points: ["<strong>Full PLL:</strong> Master all 21 permutation cases.", "<strong>2-sided recognition:</strong> Check Front + Right faces for headlights and blocks without spinning."] },
    ],
  },
  Roux: {
    title: "Roux Solve Guide",
    subtitle: "Blockbuilding + M-slice mastery—intuitive, low-movecount speed.",
    stages: [
      { id: "roux-fb", title: "1. First Block (FB)", split: "~20% of solve • <= 9 moves", stickering: "FirstBlock", alg: "L' U' L M' U2 r U' r'", points: ["<strong>Build a 1x2x3 on Left:</strong> Solve DL edge + two left-side pairs freely."] },
      { id: "roux-sb", title: "2. Second Block (SB)", split: "~32% of solve", stickering: "SecondBlock", alg: "R U' R' U2 r U r'", points: ["<strong>Build a 1x2x3 on Right:</strong> Pair DR edge + two right slots using R, r, U, M."] },
      { id: "roux-cmll", title: "3. CMLL", split: "~22% of solve • 42 algs", stickering: "CMLL", alg: "R U R' U R U2 R'", points: ["<strong>Orient/Permute Corners:</strong> Solve 4 U-layer corners while preserving M-slice."] },
      { id: "roux-lse", title: "4. LSE", split: "~26% of solve • Pure M & U", stickering: "full", alg: "M' U M' U2 M U M' U2 M' U2", points: ["<strong>Last 6 Edges:</strong> Orient edges (EO), insert UL/UR, and finish M-slice."] },
    ],
  },
  ZZ: {
    title: "ZZ Solve Guide",
    subtitle: "Edge Orientation first—pure R, U, L ergonomics.",
    stages: [
      { id: "zz-eo", title: "1. EOLine", split: "~18% of solve", stickering: "EO", alg: "F R' F' D R' D'", points: ["<strong>Orient 12 Edges:</strong> Flip bad edges so all future F2L needs only R, U, L."] },
      { id: "zz-f2l", title: "2. ZZF2L", split: "~48% of solve • Rotationless", stickering: "F2L", alg: "R U' R' U2 L' U L", points: ["<strong>Zero Rotations:</strong> Build blocks smoothly without y/y' cube rotations."] },
      { id: "zz-ocll", title: "3. OCLL / COLL", split: "~16% of solve", stickering: "COLL", alg: "R U R' U R U2 R'", points: ["<strong>Top Cross Done:</strong> EO guarantees top cross is already oriented."] },
      { id: "zz-pll", title: "4. EPLL", split: "~18% of solve", stickering: "PLL", alg: "M2 U M2 U2 M2 U M2", points: ["<strong>Easy Finish:</strong> Finish with simple 4-edge permutations."] },
    ],
  },
  Beginner: {
    title: "Beginner Layer-by-Layer Guide",
    subtitle: "Master the cube with 4 core algorithms.",
    stages: [
      { id: "beg-cross", title: "1. White Cross", split: "Step 1", stickering: "Cross", alg: "F2 U R' F R", points: ["<strong>Daisy & Drop:</strong> Build white daisy on yellow center, match and drop down."] },
      { id: "beg-corners", title: "2. First Layer Corners", split: "Step 2", stickering: "F2L", alg: "R U R' U'", points: ["<strong>Right Trigger:</strong> Repeat R U R' U' until white corners drop in."] },
      { id: "beg-mid", title: "3. Middle Layer Edges", split: "Step 3", stickering: "F2L", alg: "U R U' R' U' F' U F", points: ["<strong>Push Away:</strong> Insert top non-yellow edge into middle slots."] },
      { id: "beg-ll", title: "4. Last Layer", split: "Step 4", stickering: "LL", alg: "F R U R' U' F'", points: ["<strong>Cross, Edges & Corners:</strong> Complete yellow face and solve final layer."] },
    ],
  },
};

export const METHOD_ALGS = {
  CFOP: [...PLL_CASES, ...FULL_OLL_ALGS],
  Roux: [
    { id: "rx-sune", name: "CMLL Sune", cat: "CMLL", stickering: "CMLL", alg: "R U R' U R U2 R'", tip: "1 oriented corner front-left." },
    { id: "rx-anti", name: "CMLL Anti-Sune", cat: "CMLL", stickering: "CMLL", alg: "R U2 R' U' R U' R'", tip: "1 oriented corner back-left." },
    { id: "rx-h", name: "CMLL H", cat: "CMLL", stickering: "CMLL", alg: "R U R' U R U' R' U R U2 R'", tip: "Headlights front and back." },
    { id: "rx-eo", name: "LSE EO Arrow", cat: "LSE", stickering: "full", alg: "M' U M'", tip: "Orients all 6 edges." },
  ],
  ZZ: [
    { id: "zz-sune", name: "OCLL Sune", cat: "OCLL / COLL", stickering: "COLL", alg: "R U R' U R U2 R'", tip: "Top cross oriented." },
    { id: "zz-ua", name: "EPLL Ua-Perm", cat: "EPLL", stickering: "PLL", alg: "R U' R U R U R U' R' U' R2", tip: "Pure R-U edge cycle." },
  ],
  Beginner: [
    { id: "beg-rtrig", name: "Right Trigger", cat: "Basics", stickering: "F2L", alg: "R U R' U'", tip: "Core 4-move trigger." },
    { id: "beg-cross", name: "Yellow Cross", cat: "Last Layer", stickering: "OLL", alg: "F R U R' U' F'", tip: "Builds yellow cross." },
  ],
};