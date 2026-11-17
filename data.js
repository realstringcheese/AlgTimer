// === SECTION D1: WCA & CSTIMER EVENT MAPPINGS ===
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

// === SECTION D2: PREMADE SCENES & COLOR THEMES ===
const svgUri = (svg) => `url("data:image/svg+xml;utf8,${encodeURIComponent(svg.trim())}")`;

export const PREMADE_SCENES = [
  {
    id: "mountains",
    name: "Midnight Peaks",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#0b132b'/><stop offset='55%' stop-color='#1c2541'/><stop offset='100%' stop-color='#0b0f19'/></linearGradient>
        <radialGradient id='m' cx='72%' cy='24%' r='35%'><stop offset='0%' stop-color='#6fffe9' stop-opacity='0.35'/><stop offset='100%' stop-color='#1c2541' stop-opacity='0'/></radialGradient>
      </defs>
      <rect width='1200' height='800' fill='url(#g)'/><rect width='1200' height='800' fill='url(#m)'/>
      <path d='M0 560 L180 410 L350 510 L570 320 L780 480 L980 350 L1200 490 L1200 800 L0 800 Z' fill='#141c33'/>
      <path d='M0 640 L240 500 L440 600 L690 430 L920 580 L1110 470 L1200 540 L1200 800 L0 800 Z' fill='#0e1424'/>
      <path d='M0 710 L320 620 L620 690 L930 610 L1200 680 L1200 800 L0 800 Z' fill='#080b14'/>
    </svg>`),
  },
  {
    id: "tokyo-rain",
    name: "Tokyo Drizzle",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
      <defs>
        <linearGradient id='sky' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#0f172a'/><stop offset='60%' stop-color='#1e293b'/><stop offset='100%' stop-color='#090d16'/></linearGradient>
        <radialGradient id='glow1' cx='28%' cy='42%' r='35%'><stop offset='0%' stop-color='#10b981' stop-opacity='0.35'/><stop offset='100%' stop-color='#0f172a' stop-opacity='0'/></radialGradient>
        <radialGradient id='glow2' cx='75%' cy='55%' r='35%'><stop offset='0%' stop-color='#38bdf8' stop-opacity='0.3'/><stop offset='100%' stop-color='#0f172a' stop-opacity='0'/></radialGradient>
      </defs>
      <rect width='1200' height='800' fill='url(#sky)'/><rect width='1200' height='800' fill='url(#glow1)'/><rect width='1200' height='800' fill='url(#glow2)'/>
      <g fill='#090e1a' opacity='0.85'><rect x='60' y='340' width='90' height='460'/><rect x='170' y='260' width='110' height='540'/><rect x='300' y='390' width='80' height='410'/><rect x='420' y='210' width='130' height='590'/><rect x='580' y='310' width='95' height='490'/><rect x='700' y='190' width='120' height='610'/><rect x='850' y='290' width='110' height='510'/><rect x='990' y='240' width='140' height='560'/></g>
      <g stroke='#94a3b8' stroke-opacity='0.22' stroke-width='2'><line x1='150' y1='40' x2='120' y2='140'/><line x1='380' y1='90' x2='350' y2='210'/><line x1='620' y1='30' x2='590' y2='150'/><line x1='890' y1='80' x2='860' y2='190'/><line x1='1050' y1='50' x2='1020' y2='170'/></g>
    </svg>`),
  },
  {
    id: "hearth",
    name: "Hearth Ember",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
      <defs><radialGradient id='fire' cx='50%' cy='72%' r='65%'><stop offset='0%' stop-color='#f59e0b' stop-opacity='0.55'/><stop offset='40%' stop-color='#9a3412' stop-opacity='0.45'/><stop offset='100%' stop-color='#0c0908'/></radialGradient></defs>
      <rect width='1200' height='800' fill='#0c0908'/><rect width='1200' height='800' fill='url(#fire)'/>
      <circle cx='340' cy='520' r='4' fill='#fbbf24' opacity='0.6'/><circle cx='580' cy='430' r='5' fill='#f59e0b' opacity='0.5'/><circle cx='780' cy='500' r='3' fill='#fde68a' opacity='0.7'/>
    </svg>`),
  },
  {
    id: "solar-dusk",
    name: "Solar Dusk",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
      <defs>
        <linearGradient id='dusk' x1='0' y1='0' x2='0.8' y2='1'><stop offset='0%' stop-color='#1e1b4b'/><stop offset='50%' stop-color='#4c1d95'/><stop offset='100%' stop-color='#0f0a19'/></linearGradient>
        <radialGradient id='sun' cx='50%' cy='46%' r='38%'><stop offset='0%' stop-color='#fb7185' stop-opacity='0.6'/><stop offset='60%' stop-color='#f59e0b' stop-opacity='0.2'/><stop offset='100%' stop-color='#1e1b4b' stop-opacity='0'/></radialGradient>
      </defs>
      <rect width='1200' height='800' fill='url(#dusk)'/><rect width='1200' height='800' fill='url(#sun)'/>
      <path d='M0 570 Q300 490 600 560 T1200 540 L1200 800 L0 800 Z' fill='#140d26'/><path d='M0 660 Q360 610 720 670 T1200 640 L1200 800 L0 800 Z' fill='#0b0716'/>
    </svg>`),
  },
  {
    id: "aurora",
    name: "Aurora Night",
    uri: svgUri(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'>
      <defs>
        <linearGradient id='n' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#040814'/><stop offset='100%' stop-color='#0a192f'/></linearGradient>
        <linearGradient id='au' x1='0' y1='0' x2='1' y2='0.6'><stop offset='0%' stop-color='#06b6d4' stop-opacity='0'/><stop offset='35%' stop-color='#2dd4bf' stop-opacity='0.45'/><stop offset='65%' stop-color='#818cf8' stop-opacity='0.4'/><stop offset='100%' stop-color='#06b6d4' stop-opacity='0'/></linearGradient>
      </defs>
      <rect width='1200' height='800' fill='url(#n)'/>
      <path d='M-50 320 C240 160, 480 420, 780 220 C980 100, 1100 260, 1260 180 L1260 520 C960 420, 620 600, 320 460 C120 380, 20 460, -50 490 Z' fill='url(#au)'/>
      <path d='M0 680 L280 580 L520 650 L840 560 L1200 670 L1200 800 L0 800 Z' fill='#050914'/>
    </svg>`),
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
  {
    id: "c-mono", name: "Noir Monochrome", desc: "Matte black & crisp white",
    theme: { mood: "mono", bgMode: "color", bgColor: "#0a0a0a", sidebarColor: "#121212", cardColor: "#1b1b1b", scrambleColor: "#141414", textColor: "#f5f5f5", mutedColor: "#9a9a9a", accentColor: "#f5f5f5", holdingColor: "#ef4444", readyColor: "#22c55e", sidebarAlpha: 92, sidebarBlur: 12, timerBackdrop: false, scrambleBox: false, radius: 10 },
  },
  {
    id: "c-emerald", name: "Emerald Slate", desc: "Dark slate & emerald accent",
    theme: { mood: "emerald", bgMode: "color", bgColor: "#090c10", sidebarColor: "#10141b", cardColor: "#171c26", scrambleColor: "#141922", textColor: "#f3f4f6", mutedColor: "#9ca3af", accentColor: "#10b981", holdingColor: "#ef4444", readyColor: "#10b981", sidebarAlpha: 90, sidebarBlur: 14, timerBackdrop: false, scrambleBox: true, radius: 12 },
  },
  {
    id: "c-oled", name: "OLED Pitch", desc: "True #000000 pure dark",
    theme: { mood: "oled", bgMode: "color", bgColor: "#000000", sidebarColor: "#050505", cardColor: "#0d0d0d", scrambleColor: "#0a0a0a", textColor: "#ffffff", mutedColor: "#737373", accentColor: "#ffffff", holdingColor: "#ef4444", readyColor: "#22c55e", sidebarAlpha: 96, sidebarBlur: 8, timerBackdrop: false, scrambleBox: false, radius: 6 },
  },
  {
    id: "c-aqua", name: "Arctic Aqua", desc: "Deep ocean & cyan glow",
    theme: { mood: "aqua", bgMode: "color", bgColor: "#071018", sidebarColor: "#0d1824", cardColor: "#132233", scrambleColor: "#101e2e", textColor: "#ecfeff", mutedColor: "#7dd3fc", accentColor: "#06b6d4", holdingColor: "#f43f5e", readyColor: "#22d3ee", sidebarAlpha: 88, sidebarBlur: 14, timerBackdrop: false, scrambleBox: true, radius: 12 },
  },
  {
    id: "c-neon", name: "Cyber Neon", desc: "Obsidian & electric pink",
    theme: { mood: "neon", bgMode: "color", bgColor: "#09090e", sidebarColor: "#11101a", cardColor: "#191726", scrambleColor: "#171424", textColor: "#faf5ff", mutedColor: "#a78bfa", accentColor: "#ec4899", holdingColor: "#f43f5e", readyColor: "#22c55e", sidebarAlpha: 88, sidebarBlur: 14, timerBackdrop: false, scrambleBox: true, radius: 12 },
  },
  {
    id: "c-amber", name: "Warm Espresso", desc: "Cozy dark amber tones",
    theme: { mood: "amber", bgMode: "color", bgColor: "#110d0a", sidebarColor: "#1a1410", cardColor: "#241b15", scrambleColor: "#211913", textColor: "#fef3c7", mutedColor: "#d97706", accentColor: "#f59e0b", holdingColor: "#ef4444", readyColor: "#84cc16", sidebarAlpha: 90, sidebarBlur: 12, timerBackdrop: false, scrambleBox: true, radius: 10 },
  },
  {
    id: "c-light", name: "Paper Daylight", desc: "Warm off-white studio",
    theme: { mood: "light", bgMode: "color", bgColor: "#f4f3ef", sidebarColor: "#ffffff", cardColor: "#eae8e1", scrambleColor: "#ffffff", textColor: "#111111", mutedColor: "#6b7280", accentColor: "#111111", holdingColor: "#dc2626", readyColor: "#16a34a", sidebarAlpha: 92, sidebarBlur: 12, timerBackdrop: false, scrambleBox: true, radius: 10 },
  },
];

export const SCENE_PRESETS = [
  {
    id: "s-mountains", name: "Midnight Peaks", desc: "Frosted twilight + cyan",
    theme: { mood: "aqua", bgMode: "scene", sceneId: "mountains", bgBlur: 7, bgDim: 38, bgPosY: 50, bgScale: 106, bgColor: "#0b132b", sidebarColor: "#0d1426", cardColor: "#151f38", scrambleColor: "#111a30", textColor: "#f0f9ff", mutedColor: "#93c5fd", accentColor: "#38bdf8", holdingColor: "#fb7185", readyColor: "#34d399", sidebarAlpha: 72, sidebarBlur: 18, timerBackdrop: true, scrambleBox: true, radius: 14 },
  },
  {
    id: "s-tokyo", name: "Tokyo Drizzle", desc: "Rainy skyline + emerald",
    theme: { mood: "emerald", bgMode: "scene", sceneId: "tokyo-rain", bgBlur: 8, bgDim: 42, bgPosY: 50, bgScale: 106, bgColor: "#0f172a", sidebarColor: "#0f141d", cardColor: "#18202c", scrambleColor: "#121a24", textColor: "#f8fafc", mutedColor: "#94a3b8", accentColor: "#10b981", holdingColor: "#ef4444", readyColor: "#10b981", sidebarAlpha: 76, sidebarBlur: 16, timerBackdrop: false, scrambleBox: true, radius: 12 },
  },
  {
    id: "s-hearth", name: "Hearth Ember", desc: "Warm glow + gold accent",
    theme: { mood: "amber", bgMode: "scene", sceneId: "hearth", bgBlur: 10, bgDim: 35, bgPosY: 50, bgScale: 108, bgColor: "#0c0908", sidebarColor: "#17110e", cardColor: "#241a14", scrambleColor: "#1f1611", textColor: "#fffbeb", mutedColor: "#d6a87c", accentColor: "#f59e0b", holdingColor: "#ef4444", readyColor: "#4ade80", sidebarAlpha: 74, sidebarBlur: 16, timerBackdrop: true, scrambleBox: true, radius: 14 },
  },
  {
    id: "s-dusk", name: "Solar Dusk", desc: "Violet ridges + coral",
    theme: { mood: "neon", bgMode: "scene", sceneId: "solar-dusk", bgBlur: 8, bgDim: 36, bgPosY: 50, bgScale: 106, bgColor: "#140d26", sidebarColor: "#150e26", cardColor: "#22163b", scrambleColor: "#1b1130", textColor: "#fdf4ff", mutedColor: "#c4b5fd", accentColor: "#fb7185", holdingColor: "#f43f5e", readyColor: "#34d399", sidebarAlpha: 74, sidebarBlur: 18, timerBackdrop: true, scrambleBox: true, radius: 14 },
  },
  {
    id: "s-aurora", name: "Aurora Night", desc: "Northern lights + mint",
    theme: { mood: "aqua", bgMode: "scene", sceneId: "aurora", bgBlur: 9, bgDim: 34, bgPosY: 50, bgScale: 106, bgColor: "#040814", sidebarColor: "#091121", cardColor: "#101d33", scrambleColor: "#0d1729", textColor: "#ecfeff", mutedColor: "#7dd3fc", accentColor: "#2dd4bf", holdingColor: "#fb7185", readyColor: "#2dd4bf", sidebarAlpha: 74, sidebarBlur: 18, timerBackdrop: false, scrambleBox: true, radius: 12 },
  },
];

// === SECTION D3: METHOD-SPECIFIC SOLVE GUIDES ===
export const METHOD_GUIDES = {
  CFOP: {
    title: "CFOP Solve Guide",
    subtitle: "Cross, F2L, OLL, and PLL—optimize every split of your solve.",
    stages: [
      {
        id: "cfop-cross", title: "1. Cross", split: "~12% of solve • <= 8 moves", stickering: "Cross", alg: "F R' D' R F2",
        points: [
          "<strong>Solve on Bottom (D):</strong> Keep white/yellow on D so you transition directly into F2L with zero cube flips.",
          "<strong>Plan all 4 edges in inspection:</strong> Learn relative color order (Blue-Orange-Green-Red) so you don't align centers early.",
          "<strong>8-move rule:</strong> Every 3x3 cross can be solved in 8 moves or fewer.",
        ],
      },
      {
        id: "cfop-f2l", title: "2. F2L (First Two Layers)", split: "~50% of solve • Core speed", stickering: "F2L", alg: "U R U' R' U' F' U F",
        points: [
          "<strong>Fill back slots first:</strong> Solving BL/BR early keeps open pieces visible in front.",
          "<strong>Limit cube rotations:</strong> Use wide inserts or sledgehammers (R' F R F') instead of rotating twice.",
          "<strong>Lookahead drill:</strong> Turn at 60% speed with zero pauses between pairs.",
        ],
      },
      {
        id: "cfop-oll", title: "3. OLL (Orient Last Layer)", split: "~18% of solve • 2-Look -> 57", stickering: "OLL", alg: "F R U R' U' F' R U R' U R U2 R'",
        points: [
          "<strong>Start with 2-Look OLL:</strong> 3 edge-orientation shapes (Dot, L, Line) + 7 corner cases (Sune, Anti-Sune, H, Pi, U, T, L).",
          "<strong>Use triggers:</strong> Group moves into Sexy (R U R' U') and Sledge (R' F R F').",
          "<strong>Predict corner state:</strong> Watch U-layer blocks to enter PLL smoothly.",
        ],
      },
      {
        id: "cfop-pll", title: "4. PLL (Permute Last Layer)", split: "~20% of solve • 21 algs", stickering: "PLL", alg: "R U R' U' R' F R2 U' R' U' R U R' F'",
        points: [
          "<strong>2-Look PLL first:</strong> Learn Aa/Y-Perm for corners and Ua/Ub/H/Z for edges.",
          "<strong>2-sided recognition:</strong> Check Front + Right faces for headlights and blocks without spinning the cube.",
          "<strong>AUF at the end:</strong> Execute immediately and adjust U on the final move.",
        ],
      },
    ],
  },
  Roux: {
    title: "Roux Solve Guide",
    subtitle: "Blockbuilding + M-slice mastery—intuitive, low-movecount, rotationless speed.",
    stages: [
      {
        id: "roux-fb", title: "1. First Block (FB)", split: "~20% of solve • <= 9 moves", stickering: "FirstBlock", alg: "L' U' L M' U2 r U' r'",
        points: [
          "<strong>Build a 1x2x3 on Left:</strong> Solve the DL edge + two F2L pairs on the left face freely without a cross.",
          "<strong>Plan during inspection:</strong> Always plan the 1x2x2 square (DL + front or back pair) before starting the timer.",
          "<strong>Use wide & slice moves:</strong> Rw, M, and U moves are your best friends since the right/middle layers are completely free.",
        ],
      },
      {
        id: "roux-sb", title: "2. Second Block (SB)", split: "~32% of solve • R, r, U, M only", stickering: "SecondBlock", alg: "R U' R' U2 r U r'",
        points: [
          "<strong>Build a 1x2x3 on Right:</strong> Pair DR edge + two right-side pairs using only R, Rw, U, and M moves—zero cube rotations.",
          "<strong>DR edge first or square first:</strong> Insert the DR edge onto D, then pair front/back slots seamlessly.",
          "<strong>Lookahead:</strong> Keep eyes on U and R faces; never break your completed First Block on the left.",
        ],
      },
      {
        id: "roux-cmll", title: "3. CMLL (Corners of Last Layer)", split: "~22% of solve • 42 algs", stickering: "CMLL", alg: "R U R' U R U2 R'",
        points: [
          "<strong>Ignore the M-slice:</strong> CMLL solves the 4 U-layer corners while preserving FB/SB—edges in the middle slice don't matter yet.",
          "<strong>Start with 2-Look CMLL:</strong> Use 7 OCLL corner-orientation algs + J-Perm/Y-Perm for corner permutation.",
          "<strong>Recognition:</strong> Spot the top orientation pattern, then check 2 corner stickers on U.",
        ],
      },
      {
        id: "roux-lse", title: "4. LSE (Last Six Edges)", split: "~26% of solve • Pure M & U", stickering: "full", alg: "M' U M' U2 M U M' U2 M' U2",
        points: [
          "<strong>Step 4a (EO):</strong> Orient all 6 remaining edges using M' and U until top & bottom only show U/D colors.",
          "<strong>Step 4b (UL/UR):</strong> Solve the Left and Right top edges onto the bottom, then bring them up to finish L/R layers.",
          "<strong>Step 4c (EP):</strong> Finish the remaining 4 M-slice edges with crisp M2 / U2 fingertricks.",
        ],
      },
    ],
  },
  ZZ: {
    title: "ZZ Solve Guide",
    subtitle: "Edge Orientation first—unlocking pure R, U, L ergonomics for the entire solve.",
    stages: [
      {
        id: "zz-eo", title: "1. EOLine / EOCross", split: "~18% of solve • Inspection", stickering: "EO", alg: "F R' F' D R' D'",
        points: [
          "<strong>Orient all 12 edges first:</strong> Identify 'bad' edges during inspection and flip them in groups of 2 or 4 using F/B quarter turns.",
          "<strong>EOLine vs EOCross:</strong> Classic ZZ solves DF + DB edges in line; modern ZZ builds a full oriented EOCross on bottom.",
          "<strong>Never touch F or B again:</strong> Once EO is done, every remaining F2L piece can be solved with just R, U, and L moves.",
        ],
      },
      {
        id: "zz-f2l", title: "2. ZZF2L (R, U, L Blockbuilding)", split: "~48% of solve • Rotationless", stickering: "F2L", alg: "R U' R' U2 L' U L",
        points: [
          "<strong>Zero cube rotations:</strong> Because all edges are already oriented, you never need y/y' rotations or F/B moves during F2L.",
          "<strong>Blockbuild freely:</strong> Solve a 1x2x2 square + last pair on Left and Right in whichever order is shortest.",
          "<strong>Fast alternate hands:</strong> Alternate smoothly between R/U and L/U triggers.",
        ],
      },
      {
        id: "zz-ocll", title: "3. OCLL / COLL", split: "~16% of solve • Top Cross is always done", stickering: "COLL", alg: "R U R' U R U2 R'",
        points: [
          "<strong>Automatic Top Cross:</strong> Because EO is already solved, you NEVER get dot or L-shape OLLs—only the 7 corner cases!",
          "<strong>Learn COLL next:</strong> One look solves both orientation AND corner permutation, leaving only an easy 4-alg EPLL (Ua, Ub, H, Z).",
        ],
      },
      {
        id: "zz-pll", title: "4. EPLL / ZBLL", split: "~18% of solve • Ultra-fast finish", stickering: "PLL", alg: "M2 U M2 U2 M2 U M2",
        points: [
          "<strong>With standard OCLL:</strong> Finish with normal PLL (21 algs).",
          "<strong>With COLL:</strong> You only ever get Ua, Ub, H, Z, or a PLL skip—some of the fastest algs in cubing.",
          "<strong>Long-term ceiling:</strong> ZZ is the premier gateway to ZBLL (1-look last layer!).",
        ],
      },
    ],
  },
  Beginner: {
    title: "Beginner Layer-by-Layer Guide",
    subtitle: "Master the cube step-by-step with just a few intuitive moves and 4 core algorithms.",
    stages: [
      {
        id: "beg-cross", title: "1. White Cross", split: "Step 1 • Intuitive", stickering: "Cross", alg: "F2 U R' F R",
        points: [
          "<strong>Make the Daisy:</strong> Put the 4 white edge pieces around the yellow center on top first if you're learning.",
          "<strong>Match & Drop:</strong> Line each white edge's side color up with its matching center, then turn that face 180° (F2) down to white.",
        ],
      },
      {
        id: "beg-corners", title: "2. First Layer Corners", split: "Step 2 • Right Trigger", stickering: "F2L", alg: "R U R' U'",
        points: [
          "<strong>Find a white corner on top:</strong> Hold it above the slot where its other two colors belong.",
          "<strong>Repeat (R U R' U'):</strong> Repeat the 4-move 'Right Trigger' 1, 3, or 5 times until the corner drops neatly into place.",
        ],
      },
      {
        id: "beg-mid", title: "3. Middle Layer Edges", split: "Step 3 • Push Away + Trigger", stickering: "F2L", alg: "U R U' R' U' F' U F",
        points: [
          "<strong>Match the front sticker:</strong> Find a top-layer edge without yellow and line its front color with its center.",
          "<strong>Push away from target:</strong> Turn U away from the slot it needs to go into, do the trigger on that side, then insert the corner back.",
        ],
      },
      {
        id: "beg-ll", title: "4. Last Layer (Cross -> Edges -> Corners)", split: "Step 4 • 4 Simple Algs", stickering: "LL", alg: "F R U R' U' F'",
        points: [
          "<strong>Yellow Cross:</strong> Repeat F (R U R' U') F' from Dot -> L-shape (9 o'clock) -> Line -> Cross.",
          "<strong>Match Edges (Sune):</strong> Use R U R' U R U2 R' to align all 4 side edges.",
          "<strong>Position & Twist Corners:</strong> Cycle corners with U R U' L' U R' U' L, then flip yellow on bottom and repeat R U R' U' to finish!",
        ],
      },
    ],
  },
};

// === SECTION D4: METHOD-SPECIFIC ALGORITHMS ===
export const METHOD_ALGS = {
  CFOP: [
    { id: "pll-t", name: "T-Perm", cat: "PLL", stickering: "PLL", alg: "R U R' U' R' F R2 U' R' U' R U R' F'", tip: "Headlights on left + matching bars on top/bottom." },
    { id: "pll-jb", name: "Jb-Perm", cat: "PLL", stickering: "PLL", alg: "R U R' F' R U R' U' R' F R2 U' R' U'", tip: "Full 3-sticker bar on left + matching 2-block on front-right." },
    { id: "pll-ua", name: "Ua-Perm", cat: "PLL", stickering: "PLL", alg: "R U' R U R U R U' R' U' R2", tip: "Solved bar in back; front edge cycles counter-clockwise." },
    { id: "pll-ub", name: "Ub-Perm", cat: "PLL", stickering: "PLL", alg: "R2 U R U R' U' R' U' R' U R'", tip: "Solved bar in back; front edge cycles clockwise." },
    { id: "pll-h", name: "H-Perm", cat: "PLL", stickering: "PLL", alg: "M2 U M2 U2 M2 U M2", tip: "Opposite edge swap across all 4 faces." },
    { id: "pll-y", name: "Y-Perm", cat: "PLL", stickering: "PLL", alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", tip: "Diagonal corner swap with two adjacent blocks." },
    { id: "oll-sune", name: "Sune (OLL 27)", cat: "OLL", stickering: "OLL", alg: "R U R' U R U2 R'", tip: "1 corner oriented front-left; sticker faces you front-right." },
    { id: "oll-anti", name: "Anti-Sune (OLL 26)", cat: "OLL", stickering: "OLL", alg: "R U2 R' U' R U' R'", tip: "Mirror of Sune with oriented corner in back-left." },
    { id: "oll-u", name: "Headlights (OLL 23)", cat: "OLL", stickering: "OLL", alg: "R2 D R' U2 R D' R' U2 R'", tip: "Two solved corners in back, headlights facing front." },
    { id: "oll-line", name: "EO Line (OLL 45)", cat: "OLL", stickering: "OLL", alg: "F R U R' U' F'", tip: "Horizontal yellow bar across the top." },
    { id: "f2l-basic", name: "Basic Insert", cat: "F2L", stickering: "F2L", alg: "U R U' R'", tip: "Opposite top colors, corner facing right." },
    { id: "f2l-split", name: "Split & Pair", cat: "F2L", stickering: "F2L", alg: "R U' R' U R U' R' U2 R U' R'", tip: "Touching mismatched pair; split then insert." },
  ],
  Roux: [
    { id: "rx-sune", name: "CMLL Sune", cat: "CMLL", stickering: "CMLL", alg: "R U R' U R U2 R'", tip: "1 oriented corner front-left; ignore M-slice." },
    { id: "rx-anti", name: "CMLL Anti-Sune", cat: "CMLL", stickering: "CMLL", alg: "R U2 R' U' R U' R'", tip: "1 oriented corner front-right; fast right-hand grip." },
    { id: "rx-h", name: "CMLL H (Double Sune)", cat: "CMLL", stickering: "CMLL", alg: "R U R' U R U' R' U R U2 R'", tip: "Headlights on front and back; pure R-U." },
    { id: "rx-pi", name: "CMLL Pi (Columns)", cat: "CMLL", stickering: "CMLL", alg: "F R U R' U' R U R' U' F'", tip: "Headlights on left, opposite stickers on right." },
    { id: "rx-jb", name: "2-Look CMLL Adjacent", cat: "CMLL", stickering: "CMLL", alg: "R U R' F' R U R' U' R' F R2 U' R' U'", tip: "Swaps right-side corners after OCLL." },
    { id: "rx-y", name: "2-Look CMLL Diagonal", cat: "CMLL", stickering: "CMLL", alg: "F R U' R' U' R U R' F' R U R' U' R' F R F'", tip: "Diagonal corner swap when no headlights exist." },
    { id: "rx-eo-arrow", name: "LSE EO Arrow", cat: "LSE", stickering: "full", alg: "M' U M'", tip: "3 bad edges on U + 1 in DF; orients all 6 edges in 3 moves." },
    { id: "rx-eo-4", name: "LSE 4-Flip (U + D)", cat: "LSE", stickering: "full", alg: "M' U2 M' U2 M' U M'", tip: "All 4 U-edges flipped; setup into Arrow." },
    { id: "rx-ep-dots", name: "LSE Dots Swap", cat: "LSE", stickering: "full", alg: "M2 U2 M2 U2", tip: "Opposite edge swap in the M-slice." },
    { id: "rx-sb-insert", name: "SB Wide Pair Insert", cat: "Blockbuilding", stickering: "SecondBlock", alg: "r U' r' U2 r U r'", tip: "Pairs and inserts FR slot without breaking First Block." },
  ],
  ZZ: [
    { id: "zz-sune", name: "OCLL Sune", cat: "OCLL / COLL", stickering: "COLL", alg: "R U R' U R U2 R'", tip: "Top cross already oriented; 1 corner solved front-left." },
    { id: "zz-pi", name: "OCLL Pi", cat: "OCLL / COLL", stickering: "COLL", alg: "R U2 R2 U' R2 U' R2 U2 R", tip: "Pure 2-gen R-U execution." },
    { id: "zz-t", name: "COLL T (Chameleon)", cat: "OCLL / COLL", stickering: "COLL", alg: "r U R' U' r' F R F'", tip: "Solves T orientation + preserves corner permutation." },
    { id: "zz-u", name: "COLL U (Headlights)", cat: "OCLL / COLL", stickering: "COLL", alg: "R2 D R' U2 R D' R' U2 R'", tip: "Headlights in front, matching bar in back." },
    { id: "zz-l", name: "COLL L (Bowtie)", cat: "OCLL / COLL", stickering: "COLL", alg: "F R' F' r U R U' r'", tip: "Two opposite corners oriented diagonally." },
    { id: "zz-ua", name: "EPLL Ua-Perm", cat: "EPLL", stickering: "PLL", alg: "R U' R U R U R U' R' U' R2", tip: "Only edges left after COLL—pure R-U." },
    { id: "zz-ub", name: "EPLL Ub-Perm", cat: "EPLL", stickering: "PLL", alg: "R2 U R U R' U' R' U' R' U R'", tip: "Clockwise 3-edge cycle." },
    { id: "zz-h", name: "EPLL H-Perm", cat: "EPLL", stickering: "PLL", alg: "M2 U M2 U2 M2 U M2", tip: "Opposite edge swap." },
    { id: "zz-z", name: "EPLL Z-Perm", cat: "EPLL", stickering: "PLL", alg: "M' U M2 U M2 U M' U2 M2", tip: "Adjacent 2-edge pair swaps." },
    { id: "zz-eo", name: "EO 4-Edge Flip", cat: "EO Tricks", stickering: "EO", alg: "F R' F'", tip: "Place 4 bad edges on F face and quarter-turn F." },
  ],
  Beginner: [
    { id: "beg-rtrig", name: "Right Trigger (Sexy)", cat: "First 2 Layers", stickering: "F2L", alg: "R U R' U'", tip: "Used to drop white corners into the bottom-right slot." },
    { id: "beg-ltrig", name: "Left Trigger", cat: "First 2 Layers", stickering: "F2L", alg: "L' U' L U", tip: "Mirror trigger for inserting into the bottom-left slot." },
    { id: "beg-midr", name: "Middle Edge Right", cat: "First 2 Layers", stickering: "F2L", alg: "U R U' R' U' F' U F", tip: "Edge on top-front needs to go into the front-right slot." },
    { id: "beg-midl", name: "Middle Edge Left", cat: "First 2 Layers", stickering: "F2L", alg: "U' L' U L U F U' F'", tip: "Edge on top-front needs to go into the front-left slot." },
    { id: "beg-ycross", name: "Yellow Cross", cat: "Last Layer", stickering: "OLL", alg: "F R U R' U' F'", tip: "Hold L-shape at 9 o'clock or horizontal line across top." },
    { id: "beg-sune", name: "Align Cross Edges", cat: "Last Layer", stickering: "PLL", alg: "R U R' U R U2 R'", tip: "Hold 1 solved edge in front and 1 on left, or opposite." },
    { id: "beg-niklas", name: "Cycle Last Corners", cat: "Last Layer", stickering: "PLL", alg: "U R U' L' U R' U' L", tip: "Hold 1 correctly positioned corner in front-right." },
  ],
};