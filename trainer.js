import { METHOD_GUIDES, METHOD_ALGS, PLL_CASES, FULL_OLL_ALGS } from "./data.js";

const STORAGE_LEARNED_KEY = "algtimer_learned_v1";
const STORAGE_ALG_REPS_KEY = "algtimer_alg_reps_v1";

const CUBE_FACES = ["U", "R", "F", "D", "L", "B"];
const CUBE_OFF = { U: 0, R: 9, F: 18, D: 27, L: 36, B: 45 };
const STICKER_HEX = { U: "#facc15", R: "#ef4444", F: "#22c55e", D: "#f8fafc", L: "#f97316", B: "#3b82f6" };

let ctx = null;
let learnedAlgs = [];
let algReps = {};

let activeAlgFilter = "ALL";
let selectedAlgId = null;
let selectedStageId = null;
let algSearchQuery = "";
let algStepIndex = 0;
let algIsPlaying = false;
let algPlayTimer = null;
let algViewMode = "webgl";
let activeAlgTwisty = null;
let currentAlgItem = null;

let drillMode = "alg"; // "alg" | "oll" | "pll" | "ll"
let practiceAlgItem = null;
let llSetupScramble = "";
let llRevealed = false;
let drillTimerState = "idle";
let drillActiveTrigger = null;
let drillHoldTimeoutId = null;
let drillStartTime = 0;
let drillRafId = null;

const $ = (id) => document.getElementById(id);

// === CUBE STATE ENGINE ===
function createSolvedCube() { return CUBE_FACES.flatMap((f) => Array(9).fill(f)); }
function rotFaceCW(c, f) {
  const o = CUBE_OFF[f], s = c.slice(o, o + 9);
  const cw = [s[6], s[3], s[0], s[7], s[4], s[1], s[8], s[5], s[2]];
  for (let i = 0; i < 9; i++) c[o + i] = cw[i];
}
function cycle4(c, a, b, d, e) {
  for (let i = 0; i < 3; i++) { const tmp = c[e[i]]; c[e[i]] = c[d[i]]; c[d[i]] = c[b[i]]; c[b[i]] = c[a[i]]; c[a[i]] = tmp; }
}
function moveCubeCW(c, m) {
  const O = CUBE_OFF;
  if (m === "U") { rotFaceCW(c, "U"); cycle4(c, [O.F, O.F+1, O.F+2], [O.L, O.L+1, O.L+2], [O.B, O.B+1, O.B+2], [O.R, O.R+1, O.R+2]); }
  else if (m === "D") { rotFaceCW(c, "D"); cycle4(c, [O.F+6, O.F+7, O.F+8], [O.R+6, O.R+7, O.R+8], [O.B+6, O.B+7, O.B+8], [O.L+6, O.L+7, O.L+8]); }
  else if (m === "R") { rotFaceCW(c, "R"); cycle4(c, [O.F+2, O.F+5, O.F+8], [O.U+2, O.U+5, O.U+8], [O.B+6, O.B+3, O.B], [O.D+2, O.D+5, O.D+8]); }
  else if (m === "L") { rotFaceCW(c, "L"); cycle4(c, [O.U, O.U+3, O.U+6], [O.F, O.F+3, O.F+6], [O.D, O.D+3, O.D+6], [O.B+8, O.B+5, O.B+2]); }
  else if (m === "F") { rotFaceCW(c, "F"); cycle4(c, [O.U+6, O.U+7, O.U+8], [O.R, O.R+3, O.R+6], [O.D+2, O.D+1, O.D], [O.L+8, O.L+5, O.L+2]); }
  else if (m === "B") { rotFaceCW(c, "B"); cycle4(c, [O.U+2, O.U+1, O.U], [O.L, O.L+3, O.L+6], [O.D+6, O.D+7, O.D+8], [O.R+8, O.R+5, O.R+2]); }
  else if (m === "M") { cycle4(c, [O.U+1, O.U+4, O.U+7], [O.F+1, O.F+4, O.F+7], [O.D+1, O.D+4, O.D+7], [O.B+7, O.B+4, O.B+1]); }
  else if (m === "E") { cycle4(c, [O.F+3, O.F+4, O.F+5], [O.R+3, O.R+4, O.R+5], [O.B+3, O.B+4, O.B+5], [O.L+3, O.L+4, O.L+5]); }
  else if (m === "S") { cycle4(c, [O.U+3, O.U+4, O.U+5], [O.R+1, O.R+4, O.R+7], [O.D+5, O.D+4, O.D+3], [O.L+7, O.L+4, O.L+1]); }
}
function applyCubeToken(c, tok) {
  if (!tok) return;
  let base = tok[0], mod = tok.slice(1);
  if (mod.startsWith("w")) { base = base.toLowerCase(); mod = mod.slice(1); }
  const turns = mod.includes("2") ? 2 : mod.includes("'") ? 3 : 1;
  const wide = { r: ["R", "M", 3], l: ["L", "M", 1], u: ["U", "E", 3], d: ["D", "E", 1], f: ["F", "S", 1], b: ["B", "S", 3] };
  for (let t = 0; t < turns; t++) {
    if ("UDRLFBMES".includes(base)) moveCubeCW(c, base);
    else if (wide[base]) { const [f, sl, st] = wide[base]; moveCubeCW(c, f); for (let k = 0; k < st; k++) moveCubeCW(c, sl); }
  }
}
function invertAlgTokens(alg) {
  return alg.trim().split(/\s+/).filter(Boolean).reverse().map((t) => t.endsWith("2") ? t : t.endsWith("'") ? t.slice(0, -1) : `${t}'`);
}
function simplifyMoves(toks) {
  const out = [];
  for (const t of toks) {
    if (!t) continue;
    const base = (t.endsWith("'") || t.endsWith("2")) ? t.slice(0, -1) : t;
    const pwr = t.endsWith("2") ? 2 : t.endsWith("'") ? 3 : 1;
    if (out.length) {
      const prev = out[out.length - 1], pbase = (prev.endsWith("'") || prev.endsWith("2")) ? prev.slice(0, -1) : prev;
      const ppwr = prev.endsWith("2") ? 2 : prev.endsWith("'") ? 3 : 1;
      if (base === pbase) {
        const comb = (ppwr + pwr) % 4; out.pop();
        if (comb === 1) out.push(base); else if (comb === 2) out.push(base + "2"); else if (comb === 3) out.push(base + "'");
        continue;
      }
    }
    out.push(t);
  }
  return out;
}
function getCubeAtStep(alg, stepIdx) {
  const toks = alg.trim().split(/\s+/).filter(Boolean), c = createSolvedCube();
  invertAlgTokens(alg).forEach((t) => applyCubeToken(c, t));
  for (let i = 0; i < Math.min(stepIdx, toks.length); i++) applyCubeToken(c, toks[i]);
  return c;
}
function getCubeFromScramble(scramble) {
  const c = createSolvedCube(); scramble.trim().split(/\s+/).filter(Boolean).forEach((t) => applyCubeToken(c, t)); return c;
}

function renderTopDownLLSVG(cube, stickering) {
  const isOLL = stickering === "OLL" || stickering === "CMLL" || stickering === "COLL";
  const uCol = (f) => (isOLL ? (f === "U" ? STICKER_HEX.U : "#333740") : STICKER_HEX[f]);
  const sCol = (f) => (isOLL ? (f === "U" ? STICKER_HEX.U : "#2a2d35") : STICKER_HEX[f]);
  let out = `<svg viewBox="0 0 112 112" width="100%" height="100%">`;
  for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++) out += `<rect x="${20 + col * 24}" y="${20 + r * 24}" width="22" height="22" rx="3" fill="${uCol(cube[r * 3 + col])}" stroke="#111" stroke-width="1.5"/>`;
  const O = CUBE_OFF;
  [O.B + 2, O.B + 1, O.B].forEach((idx, col) => { out += `<rect x="${20 + col * 24}" y="9" width="22" height="8" rx="2" fill="${sCol(cube[idx])}" stroke="#111" stroke-width="1.2"/>`; });
  [O.F, O.F + 1, O.F + 2].forEach((idx, col) => { out += `<rect x="${20 + col * 24}" y="95" width="22" height="8" rx="2" fill="${sCol(cube[idx])}" stroke="#111" stroke-width="1.2"/>`; });
  [O.L, O.L + 1, O.L + 2].forEach((idx, r) => { out += `<rect x="9" y="${20 + r * 24}" width="8" height="22" rx="2" fill="${sCol(cube[idx])}" stroke="#111" stroke-width="1.2"/>`; });
  [O.R + 2, O.R + 1, O.R].forEach((idx, r) => { out += `<rect x="95" y="${20 + r * 24}" width="8" height="22" rx="2" fill="${sCol(cube[idx])}" stroke="#111" stroke-width="1.2"/>`; });
  return `${out}</svg>`;
}

function renderIsoCubeSVG(cube, size = 24, cx = 100, cy = 88, vb = "0 0 200 176") {
  const ux = [-0.866 * size, -0.5 * size], vx = [0.866 * size, -0.5 * size], dn = [0, size];
  const pt = (a, b, d) => `${(cx + a * ux[0] + b * vx[0] + d * dn[0]).toFixed(1)},${(cy + a * ux[1] + b * vx[1] + d * dn[1]).toFixed(1)}`;
  const poly = (pts, fill) => `<polygon points="${pts.join(" ")}" fill="${fill}" stroke="#111" stroke-width="2" stroke-linejoin="round"/>`;
  const O = CUBE_OFF; let out = `<svg viewBox="${vb}" width="100%" height="100%">`;
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out += poly([pt(2 - c, 2 - r, 0), pt(3 - c, 2 - r, 0), pt(3 - c, 3 - r, 0), pt(2 - c, 3 - r, 0)], STICKER_HEX[cube[O.U + r * 3 + c]]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out += poly([pt(2 - c, 0, r), pt(3 - c, 0, r), pt(3 - c, 0, r + 1), pt(2 - c, 0, r + 1)], STICKER_HEX[cube[O.F + r * 3 + c]]);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) out += poly([pt(0, c, r), pt(0, c + 1, r), pt(0, c + 1, r + 1), pt(0, c, r + 1)], STICKER_HEX[cube[O.R + r * 3 + c]]);
  return `${out}</svg>`;
}

function renderAlgCaseVisual(item) {
  const cube = getCubeAtStep(item.alg, 0);
  const td = ["PLL", "OLL", "CMLL", "OCLL / COLL", "EPLL", "Last Layer"];
  if (td.includes(item.cat)) return renderTopDownLLSVG(cube, item.stickering);
  return renderIsoCubeSVG(cube, 23, 100, 86, "0 0 200 172");
}

// === OLL & PLL F2L-SOLVED SCRAMBLE GENERATOR ===
const randItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const AUFS = ["", "U", "U'", "U2"];

function generateLLCase(mode) {
  const preU = randItem(AUFS), postU = randItem(AUFS);
  if (mode === "pll") {
    const pll = randItem(PLL_CASES);
    return { caseItem: pll, scramble: simplifyMoves([postU, ...invertAlgTokens(pll.alg), preU]).join(" "), stickering: "PLL" };
  }
  const oll = randItem(FULL_OLL_ALGS), pll = randItem(PLL_CASES), midU = randItem(AUFS);
  const toks = simplifyMoves([postU, ...invertAlgTokens(pll.alg), midU, ...invertAlgTokens(oll.alg), preU]);
  if (mode === "oll") return { caseItem: oll, scramble: toks.join(" "), stickering: "OLL" };
  return { caseItem: { id: `${oll.id}+${pll.id}`, name: `${oll.name} + ${pll.name}`, cat: "LL", stickering: "OLL", alg: `${oll.alg} | ${pll.alg}` }, scramble: toks.join(" "), stickering: "OLL" };
}

// === ALG LEARNER & METHOD GUIDES ===
export function syncMethodViews() {
  const s = ctx.getSettings(), m = METHOD_GUIDES[s.profileMethod] ? s.profileMethod : "CFOP";
  $("guide-nav-tab").textContent = `${m} Guide`;
  $("alg-page-title").textContent = `Alg Learner (${m})`;
  const algs = METHOD_ALGS[m] || METHOD_ALGS.CFOP, cats = ["ALL", ...new Set(algs.map((a) => a.cat))];
  activeAlgFilter = "ALL"; algSearchQuery = ""; if ($("alg-search-input")) $("alg-search-input").value = "";
  selectedAlgId = algs[0]?.id;
  $("alg-filter-pills").innerHTML = cats.map((c, i) => `<button class="btn-pill ${i === 0 ? "active" : ""}" data-cat="${c}" type="button">${c === "ALL" ? "All" : c}</button>`).join("");
  selectedStageId = METHOD_GUIDES[m].stages[0].id;
  renderAlgs(); renderGuide();
  if (!practiceAlgItem) loadPracticeAlg(algs[0]);
}

function renderAlgs() {
  const m = METHOD_ALGS[ctx.getSettings().profileMethod] ? ctx.getSettings().profileMethod : "CFOP";
  const list = METHOD_ALGS[m], q = algSearchQuery.trim().toLowerCase();
  const filtered = list.filter((a) => (activeAlgFilter === "ALL" || a.cat === activeAlgFilter) && (!q || a.name.toLowerCase().includes(q) || a.cat.toLowerCase().includes(q) || a.alg.toLowerCase().includes(q) || (a.tip || "").toLowerCase().includes(q)));
  const grid = $("alg-grid"); grid.innerHTML = "";
  if (!filtered.length) { grid.innerHTML = `<p class="muted-text">No algorithms match "${algSearchQuery}".</p>`; return; }

  filtered.forEach((item) => {
    const isL = learnedAlgs.includes(item.id), card = document.createElement("div");
    card.className = `alg-card ${item.id === selectedAlgId ? "selected" : ""}`;
    card.innerHTML = `<div class="alg-card-top"><span class="alg-name">${item.name}</span><span class="alg-tag">${item.cat}</span></div><div class="alg-moves">${item.alg}</div><div class="alg-card-visual">${renderAlgCaseVisual(item)}</div><p class="alg-tip">${item.tip}</p><div class="alg-card-footer"><button class="btn-outline" data-act="play" type="button">Load</button><button class="btn-outline" data-act="drill" type="button" style="color:var(--accent-color); font-weight:700;">⚡ Practice</button><button class="btn-pill ${isL ? "active" : ""}" data-act="learn" type="button">${isL ? "✓ Learned" : "Mark"}</button></div>`;
    card.addEventListener("click", (e) => {
      if (e.target.closest('button[data-act="drill"]')) { e.stopPropagation(); drillMode = "alg"; updateDrillModePills(); loadPracticeAlg(item); ctx.switchTab("improvement"); return; }
      if (e.target.closest('button[data-act="learn"]')) { e.stopPropagation(); learnedAlgs = learnedAlgs.includes(item.id) ? learnedAlgs.filter((x) => x !== item.id) : [...learnedAlgs, item.id]; localStorage.setItem(STORAGE_LEARNED_KEY, JSON.stringify(learnedAlgs)); renderAlgs(); return; }
      selectedAlgId = item.id; loadAlgSimulator(item); renderAlgs();
    });
    grid.appendChild(card);
  });
  const cur = list.find((a) => a.id === selectedAlgId) || filtered[0];
  if (cur) loadAlgSimulator(cur);
}

function stopAlgPlayback() {
  clearInterval(algPlayTimer); algPlayTimer = null; algIsPlaying = false;
  if ($("alg-play-btn")) $("alg-play-btn").textContent = "▶ Play";
  if (activeAlgTwisty) { try { activeAlgTwisty.pause?.(); } catch {} }
}

function renderAlgSimulatorStage() {
  if (!currentAlgItem) return;
  const host = $("alg-sim-player"), modeBtn = $("alg-view-mode-btn"), speed = Number($("alg-speed-select")?.value || 1);
  const useWebGL = algViewMode === "webgl" && Boolean(customElements.get("twisty-player")) && ctx.getActiveTab() === "algs";
  if (modeBtn) modeBtn.textContent = useWebGL ? "3D Video" : "Step Cube";

  if (useWebGL) {
    host.innerHTML = "";
    const tp = document.createElement("twisty-player");
    tp.setAttribute("puzzle", "3x3x3"); tp.setAttribute("visualization", "3D"); tp.setAttribute("background", "none");
    tp.setAttribute("control-panel", "bottom-row"); tp.setAttribute("experimental-setup-anchor", "end");
    tp.setAttribute("experimental-stickering", currentAlgItem.stickering); tp.setAttribute("alg", currentAlgItem.alg);
    tp.setAttribute("camera-latitude-limit", "none"); tp.setAttribute("experimental-drag-input", "auto");
    try { tp.tempoScale = speed; } catch {}
    host.appendChild(tp); activeAlgTwisty = tp;
  } else {
    activeAlgTwisty = null;
    const cube = getCubeAtStep(currentAlgItem.alg, algStepIndex);
    host.innerHTML = `<div style="width:100%;height:100%;display:grid;place-items:center;padding:8px;">${renderIsoCubeSVG(cube, 30, 110, 98, "0 0 220 200")}</div>`;
  }
  const toks = currentAlgItem.alg.trim().split(/\s+/).filter(Boolean), bar = $("alg-sim-moves");
  bar.innerHTML = toks.map((t, i) => `<button class="move-chip ${i === algStepIndex ? "current" : i < algStepIndex ? "done" : ""}" data-step="${i + 1}" type="button">${t}</button>`).join("");
  bar.querySelectorAll(".move-chip").forEach((chip) => { chip.addEventListener("click", () => { stopAlgPlayback(); algViewMode = "step"; algStepIndex = Number(chip.dataset.step); renderAlgSimulatorStage(); }); });
}

function loadAlgSimulator(item) { stopAlgPlayback(); currentAlgItem = item; algStepIndex = 0; $("alg-sim-title").textContent = item.name; $("alg-sim-cat").textContent = item.cat; $("alg-sim-tip").textContent = item.tip; renderAlgSimulatorStage(); }

function renderGuide() {
  const g = METHOD_GUIDES[ctx.getSettings().profileMethod] || METHOD_GUIDES.CFOP;
  $("guide-page-title").textContent = g.title; $("guide-page-subtitle").textContent = g.subtitle;
  const sl = $("stage-list"); sl.innerHTML = "";
  g.stages.forEach((st) => {
    const c = document.createElement("div"); c.className = `stage-card ${st.id === selectedStageId ? "active" : ""}`;
    c.innerHTML = `<div class="stage-header"><span class="stage-title">${st.title}</span><span class="stage-split">${st.split}</span></div><ul class="stage-points">${st.points.map((p) => `<li>${p}</li>`).join("")}</ul>`;
    c.addEventListener("click", () => { selectedStageId = st.id; loadStageSimulator(st); renderGuide(); });
    sl.appendChild(c);
  });
  loadStageSimulator(g.stages.find((s) => s.id === selectedStageId) || g.stages[0]);
}

function loadStageSimulator(st) {
  $("stage-sim-title").textContent = st.title; $("stage-sim-badge").textContent = st.split;
  const wrap = $("stage-player")?.parentElement; if (!wrap) return;
  if (customElements.get("twisty-player") && ctx.getActiveTab() === "guide") {
    wrap.innerHTML = ""; const tp = document.createElement("twisty-player");
    tp.id = "stage-player"; tp.setAttribute("puzzle", "3x3x3"); tp.setAttribute("visualization", "3D"); tp.setAttribute("background", "none");
    tp.setAttribute("experimental-setup-anchor", "end"); tp.setAttribute("experimental-stickering", st.stickering); tp.setAttribute("alg", st.alg);
    tp.setAttribute("camera-latitude-limit", "none"); tp.setAttribute("experimental-drag-input", "auto");
    wrap.appendChild(tp);
  } else { wrap.innerHTML = `<div style="width:100%;height:100%;display:grid;place-items:center;">${renderIsoCubeSVG(getCubeAtStep(st.alg, 0), 30, 110, 98, "0 0 220 200")}</div>`; }
}

// === IMPROVEMENT & DRILL ENGINE ===
function updateDrillModePills() {
  $("drill-mode-pills").querySelectorAll("button[data-dmode]").forEach((b) => b.classList.toggle("active", b.dataset.dmode === drillMode));
}

function loadNewLLCase() {
  const gen = generateLLCase(drillMode);
  practiceAlgItem = gen.caseItem; llSetupScramble = gen.scramble; llRevealed = false;
  $("drill-scramble-box").classList.remove("hidden");
  $("drill-new-case-btn").classList.remove("hidden");
  $("drill-reveal-btn").classList.remove("hidden");
  $("drill-scramble-text").textContent = llSetupScramble;
  $("drill-mode-note").textContent = "Scramble a solved cube (F2L stays solved). Solve to reveal & log time!";
  updateLLCaseRevealUI(); renderPracticeAlgStats();
}

function updateLLCaseRevealUI() {
  if (drillMode === "alg") {
    $("drill-alg-name").textContent = practiceAlgItem.name; $("drill-alg-cat").textContent = practiceAlgItem.cat; $("drill-alg-moves").textContent = practiceAlgItem.alg;
    $("drill-case-visual").innerHTML = renderAlgCaseVisual(practiceAlgItem); return;
  }
  const cube = getCubeFromScramble(llSetupScramble);
  $("drill-case-visual").innerHTML = renderTopDownLLSVG(cube, drillMode === "pll" ? "PLL" : "OLL");
  if (llRevealed) {
    $("drill-alg-name").textContent = practiceAlgItem.name; $("drill-alg-cat").textContent = practiceAlgItem.cat; $("drill-alg-moves").textContent = practiceAlgItem.alg;
    $("drill-reveal-btn").textContent = "Hide Case";
  } else {
    $("drill-alg-name").textContent = `Hidden ${drillMode.toUpperCase()} Case`; $("drill-alg-cat").textContent = drillMode.toUpperCase();
    $("drill-alg-moves").textContent = "Solve on your cube to reveal case & alg (or click Reveal Case)";
    $("drill-reveal-btn").textContent = "Reveal Case";
  }
}

function loadPracticeAlg(algItem) {
  if (!algItem) return;
  practiceAlgItem = algItem;
  if (drillMode === "alg") {
    $("drill-scramble-box").classList.add("hidden"); $("drill-new-case-btn").classList.add("hidden"); $("drill-reveal-btn").classList.add("hidden");
    $("drill-mode-note").textContent = "Drill your execution speed cleanly"; updateLLCaseRevealUI();
  }
  $("drill-timer-display").textContent = "0.00"; drillTimerState = "idle";
  $("drill-timer-box").dataset.drillState = "idle"; $("drill-timer-hint").textContent = "Hold SPACE or CLICK to ready";
  renderPracticeAlgStats();
}

function renderPracticeAlgStats() {
  if (!practiceAlgItem) return;
  const list = algReps[practiceAlgItem.id] || [];
  $("drill-reps-count").textContent = `${list.length} reps`;
  if (!list.length) { $("drill-alg-gain").textContent = "0.0%"; $("drill-alg-pb").textContent = "-"; $("drill-alg-ao5").textContent = "-"; $("drill-reps-list").innerHTML = `<li class="muted-text" style="padding:0.5rem; text-align:center;">No reps logged yet.</li>`; return; }
  const times = list.map((r) => r.ms), pb = Math.min(...times), ao5 = times.length >= 5 ? times.slice(-5).reduce((a, b) => a + b, 0) / 5 : null;
  let gain = 0; if (times.length >= 4) { const iAvg = times.slice(0, 3).reduce((a, b) => a + b, 0) / 3, cAvg = times.slice(-3).reduce((a, b) => a + b, 0) / 3; if (iAvg > 0) gain = ((iAvg - cAvg) / iAvg) * 100; }
  $("drill-alg-pb").textContent = ctx.formatTime(pb, 2); $("drill-alg-ao5").textContent = ao5 ? ctx.formatTime(ao5, 2) : "-";
  $("drill-alg-gain").textContent = `${gain >= 0 ? "+" : ""}${gain.toFixed(1)}%`;
  $("drill-reps-list").innerHTML = list.slice().reverse().slice(0, 20).map((r, i) => `<li class="solve-item"><span class="solve-index">#${list.length - i}</span><span class="solve-time">${ctx.formatTime(r.ms, 2)}</span><span class="muted-text" style="font-size:0.7rem;">${new Date(r.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></li>`).join("");
}

function beginDrillHold(trig) {
  if (drillTimerState !== "idle") return;
  drillActiveTrigger = trig; clearTimeout(drillHoldTimeoutId);
  drillTimerState = "holding"; $("drill-timer-box").dataset.drillState = "holding";
  $("drill-timer-display").textContent = "0.00"; $("drill-timer-hint").textContent = "Release to start";
  drillHoldTimeoutId = setTimeout(() => { if (drillTimerState === "holding") { drillTimerState = "ready"; $("drill-timer-box").dataset.drillState = "ready"; } }, 220);
}
function cancelDrillHold() {
  clearTimeout(drillHoldTimeoutId); drillHoldTimeoutId = null; drillActiveTrigger = null;
  drillTimerState = "idle"; $("drill-timer-box").dataset.drillState = "idle"; $("drill-timer-hint").textContent = "Hold SPACE or CLICK to ready";
}
function startDrillTimer() {
  clearTimeout(drillHoldTimeoutId); drillHoldTimeoutId = null; drillActiveTrigger = null;
  drillStartTime = performance.now(); drillTimerState = "running"; $("drill-timer-box").dataset.drillState = "running";
  $("drill-timer-hint").textContent = "Timing...";
  const tick = () => { if (drillTimerState !== "running") return; $("drill-timer-display").textContent = ctx.formatTime(performance.now() - drillStartTime, 2); drillRafId = requestAnimationFrame(tick); };
  drillRafId = requestAnimationFrame(tick);
}
function stopDrillTimer() {
  const elapsed = Math.max(1, Math.round(performance.now() - drillStartTime));
  cancelAnimationFrame(drillRafId); drillRafId = null; drillTimerState = "stopping";
  $("drill-timer-box").dataset.drillState = "idle"; $("drill-timer-display").textContent = ctx.formatTime(elapsed, 2); $("drill-timer-hint").textContent = "Hold SPACE or CLICK to ready";
  if (practiceAlgItem) {
    if (!algReps[practiceAlgItem.id]) algReps[practiceAlgItem.id] = [];
    algReps[practiceAlgItem.id].push({ ms: elapsed, createdAt: Date.now() });
    localStorage.setItem(STORAGE_ALG_REPS_KEY, JSON.stringify(algReps));
    ctx.onRepsChanged?.();
    if (drillMode !== "alg") { llRevealed = true; updateLLCaseRevealUI(); ctx.showToast(`${practiceAlgItem.name}: ${ctx.formatTime(elapsed, 2)}s`); setTimeout(() => { if (drillTimerState === "idle" || drillTimerState === "stopping") loadNewLLCase(); }, 1800); }
    renderPracticeAlgStats(); renderImprovementView();
  }
}

export function reloadTrainerReps() {
  try { algReps = JSON.parse(localStorage.getItem(STORAGE_ALG_REPS_KEY)) || {}; } catch { algReps = {}; }
  renderPracticeAlgStats();
  renderImprovementView();
}

export function renderImprovementView() {
  if (ctx.getActiveTab() !== "improvement") return;
  const settings = ctx.getSettings(), solves = ctx.getSolves().filter((s) => s.event === settings.event), valid = solves.map(ctx.getEffectiveMs).filter((t) => t !== Infinity);
  renderMacroProgressionGraph(valid);

  const m = METHOD_ALGS[settings.profileMethod] ? settings.profileMethod : "CFOP";
  const allCases = [...METHOD_ALGS[m], ...PLL_CASES, ...FULL_OLL_ALGS].filter((v, i, a) => a.findIndex((x) => x.id === v.id) === i);
  const practicedIds = Object.keys(algReps).filter((id) => (algReps[id] || []).length > 0);
  $("improve-algs-count").textContent = `${practicedIds.length} cases`;

  let totalReps = 0, totalMsSum = 0; const gains = [], rows = [];
  allCases.forEach((alg) => {
    const list = algReps[alg.id] || [], count = list.length;
    if (count === 0 && !METHOD_ALGS[m].some((x) => x.id === alg.id)) return;
    totalReps += count;
    let bStr = "-", btStr = "-", avStr = "-", gStr = "-", gVal = null;
    if (count > 0) {
      const times = list.map((r) => r.ms); times.forEach((t) => (totalMsSum += t));
      btStr = ctx.formatTime(Math.min(...times), 2);
      const curA = times.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, count); avStr = ctx.formatTime(curA, 2);
      const initA = times.slice(0, Math.min(3, count)).reduce((a, b) => a + b, 0) / Math.min(3, count); bStr = ctx.formatTime(initA, 2);
      if (count >= 3 && initA > 0) { gVal = ((initA - curA) / initA) * 100; gStr = `${gVal >= 0 ? "+" : ""}${gVal.toFixed(1)}%`; gains.push(gVal); }
    }
    rows.push(`<tr style="cursor:pointer;" data-alg-id="${alg.id}"><td><strong>${alg.name}</strong></td><td><span class="alg-tag">${alg.cat}</span></td><td class="num">${bStr}</td><td class="num">${btStr}</td><td class="num">${avStr}</td><td class="num" style="color:${gVal !== null && gVal >= 0 ? "var(--accent-color)" : "inherit"};">${gStr}</td><td class="num">${count}</td></tr>`);
  });

  $("improve-total-reps").textContent = String(totalReps);
  $("improve-avg-time").textContent = totalReps > 0 ? ctx.formatTime(totalMsSum / totalReps, 2) : "-";
  if (gains.length) { const mg = gains.reduce((a, b) => a + b, 0) / gains.length; $("improve-overall-gain").textContent = `${mg >= 0 ? "+" : ""}${mg.toFixed(1)}%`; } else $("improve-overall-gain").textContent = "0.0%";

  const tbody = $("improve-leaderboard-tbody"); tbody.innerHTML = rows.join("");
  tbody.querySelectorAll("tr[data-alg-id]").forEach((tr) => {
    tr.addEventListener("click", () => { const f = allCases.find((c) => c.id === tr.dataset.algId); if (f) { drillMode = "alg"; updateDrillModePills(); loadPracticeAlg(f); } });
  });
}

function renderMacroProgressionGraph(validTimes) {
  const wrap = $("macro-graph-wrap");
  if (validTimes.length < 2) { wrap.innerHTML = `<p class="muted-text" style="padding:1rem;">Complete at least 2 solves for the macro graph.</p>`; $("macro-graph-meta").textContent = ""; $("macro-slope-note").textContent = ""; return; }
  const numSegs = Math.min(15, Math.max(5, Math.floor(validTimes.length / 4))), bSize = validTimes.length / numSegs, milestones = [];
  for (let k = 0; k < numSegs; k++) {
    const s = Math.round(k * bSize), e = Math.min(validTimes.length, Math.round((k + 1) * bSize)), sl = validTimes.slice(s, Math.max(s + 1, e));
    milestones.push({ range: `#${s + 1}–${e}`, avg: sl.reduce((a, b) => a + b, 0) / sl.length });
  }
  const rMin = Math.min(...milestones.map((m) => m.avg)), rMax = Math.max(...milestones.map((m) => m.avg));
  const span = Math.max(400, rMax - rMin), padMs = span * 0.22, min = Math.max(0, rMin - padMs), max = rMax + padMs, ySpan = Math.max(1, max - min);
  const w = 780, h = 138, padL = 46, padR = 20, padT = 16, padB = 24;
  const clampY = (v) => padT + (1 - (v - min) / ySpan) * (h - padT - padB), clampX = (i) => padL + (i / (milestones.length - 1)) * (w - padL - padR);
  const pts = milestones.map((m, i) => ({ x: clampX(i), y: clampY(m.avg), ...m })), poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const n = milestones.length, sX = (n * (n - 1)) / 2, sXX = (n * (n - 1) * (2 * n - 1)) / 6, sY = milestones.reduce((a, c) => a + c.avg, 0), sXY = milestones.reduce((a, c, i) => a + i * c.avg, 0);
  const slp = (n * sXX - sX * sX) ? (n * sXY - sX * sY) / (n * sXX - sX * sX) : 0, icp = (sY - slp * sX) / n, totD = milestones[milestones.length - 1].avg - milestones[0].avg;
  $("macro-graph-meta").textContent = `${validTimes.length} solves • ${milestones.length} segments`;
  $("macro-slope-note").textContent = `${totD <= 0 ? "↗ -" : "↘ +"}${ctx.formatTime(Math.abs(totD), 2)}s overall`;

  wrap.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%"><line x1="${padL}" y1="${clampY(rMax).toFixed(1)}" x2="${w - padR}" y2="${clampY(rMax).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/><line x1="${padL}" y1="${clampY(rMin).toFixed(1)}" x2="${w - padR}" y2="${clampY(rMin).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/><line x1="${padL}" y1="${clampY(icp).toFixed(1)}" x2="${w - padR}" y2="${clampY(icp + slp * (n - 1)).toFixed(1)}" stroke="var(--accent-color)" stroke-opacity="0.35" stroke-dasharray="4 3" stroke-width="1.4"/><polyline fill="none" stroke="var(--accent-color)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" points="${poly}"/><text x="6" y="${clampY(rMax) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${ctx.formatTime(rMax, 1)}</text><text x="6" y="${clampY(rMin) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${ctx.formatTime(rMin, 1)}</text><text x="${padL}" y="${h - 6}" fill="var(--text-muted)" font-size="8" font-family="monospace">${milestones[0].range}</text><text x="${w - padR - 35}" y="${h - 6}" fill="var(--text-muted)" font-size="8" font-family="monospace">${milestones[milestones.length - 1].range}</text>${pts.map((p) => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3.2" fill="var(--accent-color)" stroke="#111" stroke-width="1.2"/><circle class="macro-hit" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="12" fill="transparent" data-tip="${p.range} • ${ctx.formatTime(p.avg, 2)} avg" style="cursor:crosshair;"/>`).join("")}</svg>`;
  wrap.querySelectorAll(".macro-hit").forEach((el) => {
    el.addEventListener("pointerenter", (e) => ctx.showTooltip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener("pointermove", (e) => ctx.showTooltip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener("pointerleave", ctx.hideTooltip);
  });
}

export function handleImprovementKeyDown(e) {
  if (e.code === "Space") { e.preventDefault(); if (e.repeat) return; if (drillTimerState === "idle") beginDrillHold("space"); else if (drillTimerState === "running") stopDrillTimer(); }
}
export function handleImprovementKeyUp(e) {
  if (e.code !== "Space") return; e.preventDefault();
  if (drillTimerState === "holding" && drillActiveTrigger === "space") cancelDrillHold();
  else if (drillTimerState === "ready" && drillActiveTrigger === "space") startDrillTimer();
  else if (drillTimerState === "stopping") drillTimerState = "idle";
}
export function handleImprovementPointerUp() {
  if (drillTimerState === "holding" && drillActiveTrigger === "pointer") cancelDrillHold();
  else if (drillTimerState === "ready" && drillActiveTrigger === "pointer") startDrillTimer();
  else if (drillTimerState === "stopping") drillTimerState = "idle";
}
export function onTrainerTabVisible(tab) {
  if (tab === "algs") {
    const m = METHOD_ALGS[ctx.getSettings().profileMethod] ? ctx.getSettings().profileMethod : "CFOP";
    const cur = METHOD_ALGS[m].find((a) => a.id === selectedAlgId) || METHOD_ALGS[m][0];
    if (cur) loadAlgSimulator(cur);
  } else if (tab === "guide") {
    stopAlgPlayback();
    const g = METHOD_GUIDES[ctx.getSettings().profileMethod] || METHOD_GUIDES.CFOP;
    loadStageSimulator(g.stages.find((s) => s.id === selectedStageId) || g.stages[0]);
  } else if (tab === "improvement") {
    stopAlgPlayback();
    if (drillMode !== "alg" && !practiceAlgItem) loadNewLLCase();
    renderImprovementView();
  } else stopAlgPlayback();
}

export function initTrainer(context) {
  ctx = context;
  try { learnedAlgs = JSON.parse(localStorage.getItem(STORAGE_LEARNED_KEY)) || []; } catch { learnedAlgs = []; }
  try { algReps = JSON.parse(localStorage.getItem(STORAGE_ALG_REPS_KEY)) || {}; } catch { algReps = {}; }

  $("alg-search-input")?.addEventListener("input", (e) => { algSearchQuery = e.target.value; renderAlgs(); });
  $("alg-view-mode-btn")?.addEventListener("click", () => { stopAlgPlayback(); algViewMode = algViewMode === "webgl" ? "step" : "webgl"; renderAlgSimulatorStage(); });
  $("alg-play-btn")?.addEventListener("click", () => {
    if (!currentAlgItem) return;
    const playBtn = $("alg-play-btn"), toks = currentAlgItem.alg.trim().split(/\s+/).filter(Boolean), speed = Number($("alg-speed-select")?.value || 1);
    if (algIsPlaying) { stopAlgPlayback(); return; }
    if (algViewMode === "webgl" && activeAlgTwisty) {
      try {
        activeAlgTwisty.tempoScale = speed; activeAlgTwisty.jumpToStart?.(); activeAlgTwisty.play?.();
        algIsPlaying = true; playBtn.textContent = "⏸ Pause";
        algPlayTimer = setTimeout(() => { algIsPlaying = false; playBtn.textContent = "▶ Play"; }, Math.max(1200, Math.round((toks.length * 550) / speed)));
        return;
      } catch {}
    }
    if (algStepIndex >= toks.length) algStepIndex = 0;
    algIsPlaying = true; playBtn.textContent = "⏸ Pause"; renderAlgSimulatorStage();
    algPlayTimer = setInterval(() => { if (algStepIndex < toks.length) { algStepIndex++; renderAlgSimulatorStage(); } else stopAlgPlayback(); }, Math.round(550 / speed));
  });
  $("alg-reset-btn")?.addEventListener("click", () => { stopAlgPlayback(); algStepIndex = 0; renderAlgSimulatorStage(); });
  $("alg-prev-btn")?.addEventListener("click", () => { if (!currentAlgItem) return; stopAlgPlayback(); algViewMode = "step"; algStepIndex = Math.max(0, algStepIndex - 1); renderAlgSimulatorStage(); });
  $("alg-next-btn")?.addEventListener("click", () => { if (!currentAlgItem) return; stopAlgPlayback(); algViewMode = "step"; const toks = currentAlgItem.alg.trim().split(/\s+/).filter(Boolean); algStepIndex = Math.min(toks.length, algStepIndex + 1); renderAlgSimulatorStage(); });
  $("alg-speed-select")?.addEventListener("change", () => { if (activeAlgTwisty) try { activeAlgTwisty.tempoScale = Number($("alg-speed-select").value); } catch {} });
  $("alg-filter-pills").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-cat]"); if (!b) return;
    activeAlgFilter = b.dataset.cat; $("alg-filter-pills").querySelectorAll("button").forEach((btn) => btn.classList.toggle("active", btn === b)); renderAlgs();
  });

  $("drill-mode-pills").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-dmode]"); if (!b) return;
    drillMode = b.dataset.dmode; updateDrillModePills();
    if (drillMode === "alg") { const m = METHOD_ALGS[ctx.getSettings().profileMethod] ? ctx.getSettings().profileMethod : "CFOP"; loadPracticeAlg(METHOD_ALGS[m][0]); }
    else loadNewLLCase();
  });
  $("drill-new-case-btn").addEventListener("click", () => { $("drill-new-case-btn").blur(); loadNewLLCase(); });
  $("drill-reveal-btn").addEventListener("click", () => { $("drill-reveal-btn").blur(); llRevealed = !llRevealed; updateLLCaseRevealUI(); });
  $("drill-timer-box").addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    if (drillTimerState === "idle") { e.preventDefault(); beginDrillHold("pointer"); }
    else if (drillTimerState === "running") stopDrillTimer();
  });
  $("drill-clear-history-btn").addEventListener("click", () => {
    if (!practiceAlgItem || !confirm(`Clear reps for ${practiceAlgItem.name}?`)) return;
    delete algReps[practiceAlgItem.id]; localStorage.setItem(STORAGE_ALG_REPS_KEY, JSON.stringify(algReps));
    ctx.onRepsChanged?.();
    renderPracticeAlgStats(); renderImprovementView();
  });
}