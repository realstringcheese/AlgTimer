import { EVENT_TO_PUZZLE, CSTIMER_EVENT_MAP, PREMADE_SCENES, QUICK_MOODS, COLOR_PRESETS, SCENE_PRESETS } from "./data.js";
import { initTrainer, syncMethodViews, onTrainerTabVisible, renderImprovementView, handleImprovementKeyDown, handleImprovementKeyUp, handleImprovementPointerUp } from "./trainer.js";
import { initCloud, signInGoogle, signOutGoogle, scheduleCloudPush } from "./cloud.js";

function formatTime(ms, decimals = 2) {
  if (!ms || isNaN(ms)) return "0.00";
  const seconds = ms / 1000;
  return seconds.toFixed(decimals);
}

function getEffectiveMs(solve) {
  if (!solve || solve.dnf) return Infinity;
  return solve.ms + (solve.plus2 ? 2000 : 0);
}

// === SECTION A1: STORAGE KEYS & DEFAULTS ===
let randomScrambleForEvent = null;
const STORAGE_SOLVES_KEY = "algtimer_solves_v1";
const STORAGE_SETTINGS_KEY = "algtimer_settings_v2";
const STORAGE_THEME_KEY = "algtimer_theme_v1";
const STORAGE_CUSTOM_PRESETS_KEY = "algtimer_custom_presets_v1";
const STORAGE_COLOR_HISTORY_KEY = "algtimer_color_history_v1";

const DEFAULT_THEME = {
  presetId: "c-mono", mood: "mono", bgMode: "color", sceneId: "mountains",
  bgColor: "#0a0a0a", sidebarColor: "#121212", cardColor: "#1b1b1b", scrambleColor: "#141414",
  textColor: "#f5f5f5", mutedColor: "#9a9a9a", accentColor: "#f5f5f5",
  holdingColor: "#ef4444", readyColor: "#22c55e",
  sidebarAlpha: 90, sidebarBlur: 14, radius: 10,
  timerFont: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  uiFont: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  timerBackdrop: false, scrambleBox: false, bgBlur: 8, bgDim: 45, bgPosY: 50, bgScale: 105,
};

const COLOR_SLOTS = [
  { key: "bgColor", label: "Main Background" }, { key: "sidebarColor", label: "Sidebars & Topbar" },
  { key: "scrambleColor", label: "Scramble Box" }, { key: "cardColor", label: "Cards & Panels" },
  { key: "textColor", label: "Primary Font" }, { key: "mutedColor", label: "Muted Font" },
  { key: "accentColor", label: "Accent Color" }, { key: "holdingColor", label: "Hold State" },
  { key: "readyColor", label: "Ready State" },
];

const DEFAULT_SETTINGS = {
  event: "333", holdDelayMs: 300, decimals: 2, focusMode: true, focusBgBehavior: "blur",
  inspection: false, inspectionAudio: true, trendFlatten: false,
  timerSize: 9.5, scrambleSize: 1.5, sidebarWidth: 320, goalMs: 15000,
  previewDim: "3D", trendRange: "25", profileName: "Cuber", profileMethod: "CFOP",
};

// === SECTION A2: STATE & DOM REFERENCES ===
let settings = loadJSON(STORAGE_SETTINGS_KEY, DEFAULT_SETTINGS, true);
let activeTheme = loadJSON(STORAGE_THEME_KEY, DEFAULT_THEME, true);
let savedPresets = loadArray(STORAGE_CUSTOM_PRESETS_KEY);
let colorHistory = loadArray(STORAGE_COLOR_HISTORY_KEY);
let solves = loadArray(STORAGE_SOLVES_KEY);

let draftTheme = null, uploadedBgDataUrl = null, draftUploadedBgDataUrl = null;
let activeTab = "timer", activeStudioTab = "presets", activeColorSlot = "bgColor";
let wheelHSV = { h: 0, s: 0, v: 0.04 }, isDraggingWheel = false;
let advStatsOpen = false, showAllSolvesInList = false;

let timerState = "idle", activeTrigger = null, holdTimeoutId = null, startTime = 0, rafId = null;
let suppressNextClick = false, toastTimeoutId = null, pbTimeoutId = null;
let currentScramble = "", prefetchedScramble = null, prefetchedEvent = null, selectedSolveId = null, scramblerLoadPromise = null;

const $ = (id) => document.getElementById(id);
const appEl = $("app"), bgMediaEl = $("bg-media"), bgDimEl = $("bg-dim"), confettiCanvas = $("confetti-canvas");
const navTabs = document.querySelectorAll(".nav-tab"), viewTimer = $("view-timer"), viewAlgs = $("view-algs"), viewImprovement = $("view-improvement"), viewGuide = $("view-guide");
const topbarEventPill = $("topbar-event-pill"), topbarAo5Pill = $("topbar-ao5-pill"), eventSelect = $("event-select");
const scramblePlayer = $("scramble-player"), previewModeBadge = $("preview-mode-badge"), toggleDimBtn = $("toggle-dim-btn"), resetCamBtn = $("reset-cam-btn");
const trendFlattenBtn = $("trend-flatten-btn"), trendRangeSelect = $("trend-range-select"), sparklineWrap = $("sparkline-wrap");
const editGoalBtn = $("edit-goal-btn"), goalTargetLabel = $("goal-target-label"), goalCurrentLabel = $("goal-current-label"), goalFill = $("goal-fill");
const scrambleArea = $("scramble-area"), scrambleTextEl = $("scramble-text"), scrambleStatusEl = $("scramble-status"), newScrambleBtn = $("new-scramble-btn"), copyScrambleBtn = $("copy-scramble-btn"), inspTogglePill = $("insp-toggle-pill");
const timerZone = $("timer-zone"), timerCore = $("timer-core"), pbBanner = $("pb-banner"), timerDisplay = $("timer-display"), timerHintText = $("timer-hint-text");
const lastSolveActions = $("last-solve-actions"), lastPlus2Btn = $("last-plus2-btn"), lastDnfBtn = $("last-dnf-btn"), lastDelBtn = $("last-del-btn");
const advStatsToggle = $("adv-stats-toggle"), advStatsTeaser = $("adv-stats-teaser"), advStatsDrawer = $("adv-stats-drawer"), advStatsSubtitle = $("adv-stats-subtitle"), advStatsBody = $("adv-stats-body"), closeAdvStatsBtn = $("close-adv-stats-btn");
const statBestEl = $("stat-best"), statAo5El = $("stat-ao5"), statAo12El = $("stat-ao12"), statMeanEl = $("stat-mean"), statCountEl = $("stat-count"), solveListEl = $("solve-list");
const importBtn = $("import-btn"), settingsImportBtn = $("settings-import-btn"), importFileInput = $("import-file-input"), exportBtn = $("export-btn"), clearSessionBtn = $("clear-session-btn");
const advChartTooltip = $("adv-chart-tooltip"), toastEl = $("toast");

window.addEventListener("error", (ev) => { if (scrambleStatusEl) scrambleStatusEl.textContent = `App error: ${ev.message}`; });

// === SECTION A3: TOOLTIPS, DB & INITIALIZATION ===
function showTooltip(text, x, y) {
  advChartTooltip.textContent = text; advChartTooltip.classList.remove("hidden");
  advChartTooltip.style.left = `${x}px`; advChartTooltip.style.top = `${y}px`;
}
function hideTooltip() { advChartTooltip.classList.add("hidden"); }

function openBgDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("algtimer_assets", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("wallpapers");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveUploadedBg(dataUrl) {
  try { (await openBgDB()).transaction("wallpapers", "readwrite").objectStore("wallpapers").put(dataUrl, "custom_bg"); } catch {}
}
async function loadUploadedBg() {
  try {
    const db = await Promise.race([openBgDB(), new Promise((_, rej) => setTimeout(() => rej(), 1000))]);
    return await new Promise((res) => {
      const r = db.transaction("wallpapers", "readonly").objectStore("wallpapers").get("custom_bg");
      r.onsuccess = () => res(r.result || null); r.onerror = () => res(null);
    });
  } catch { return null; }
}
function importWithTimeout(url, ms = 8000) {
  return Promise.race([import(url), new Promise((_, rej) => setTimeout(() => rej(new Error("Timeout")), ms))]);
}
function ensureScramblerLoaded() {
  if (randomScrambleForEvent) return Promise.resolve(true);
  if (!scramblerLoadPromise) {
    scramblerLoadPromise = importWithTimeout("https://cdn.cubing.net/v0/js/cubing/scramble", 8000)
      .then((mod) => {
        randomScrambleForEvent = mod.randomScrambleForEvent;
        if (timerState === "idle" && scrambleStatusEl.textContent.includes("Offline")) loadNextScramble(settings.event);
        return true;
      }).catch(() => { scramblerLoadPromise = null; return false; });
  }
  return scramblerLoadPromise;
}

function switchTab(tabName) {
  activeTab = tabName;
  navTabs.forEach((b) => b.classList.toggle("active", b.dataset.tab === tabName));
  viewTimer.classList.toggle("hidden", tabName !== "timer");
  viewAlgs.classList.toggle("hidden", tabName !== "algs");
  viewImprovement.classList.toggle("hidden", tabName !== "improvement");
  viewGuide.classList.toggle("hidden", tabName !== "guide");
  onTrainerTabVisible(tabName);
}

async function init() {
  initTrainer({
    getSettings: () => settings, getSolves: () => solves, getActiveTab: () => activeTab,
    formatTime, getEffectiveMs, showToast, switchTab, showTooltip, hideTooltip,
  });

  initCloud((user, info) => {
    const inBtn = $("google-signin-btn"), outBtn = $("google-signout-btn");
    if (user) {
      const name = user.displayName || user.email.split("@")[0];
      $("cloud-status-title").textContent = name; $("cloud-status-sub").textContent = "Auto-syncing solves & alg drills";
      inBtn.classList.add("hidden"); outBtn.classList.remove("hidden");
      $("profile-name-label").textContent = name;
      if (user.photoURL) $("profile-avatar").innerHTML = `<img src="${user.photoURL}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      else $("profile-avatar").textContent = (name[0] || "C").toUpperCase();
      closeModals(); showToast(`Signed in as ${name}!`);

      if (info?.cloudData?.solves) {
        const cloudSolves = Array.isArray(info.cloudData.solves) ? info.cloudData.solves : [];
        const seen = new Set(solves.map((s) => s.id)); let added = 0;
        cloudSolves.forEach((cs) => { if (!seen.has(cs.id)) { solves.push(cs); seen.add(cs.id); added++; } });
        if (added > 0) { solves.sort((a, b) => a.createdAt - b.createdAt); saveSolves(); renderAll(); }
      }
      pushAllToCloud();
    } else {
      $("cloud-status-title").textContent = "Cloud Sync (Off)"; $("cloud-status-sub").textContent = "Sign in to save solves across devices";
      inBtn.classList.remove("hidden"); outBtn.classList.add("hidden");
      $("profile-avatar").textContent = (settings.profileName[0] || "C").toUpperCase();
    }
  });

  $("google-signin-btn").addEventListener("click", async () => {
    try { const res = await signInGoogle(); if (res?.error) showToast(res.error); } catch (e) { showToast(e?.message || "Sign-in failed"); }
  });
  $("google-signout-btn").addEventListener("click", () => signOutGoogle());

  currentScramble = localFallbackScramble(settings.event);
  scrambleTextEl.textContent = currentScramble; scrambleStatusEl.textContent = "Connecting WCA..."; previewModeBadge.textContent = "Loading...";

  eventSelect.value = settings.event; trendRangeSelect.value = settings.trendRange;
  applySettingsToUI(); applyThemeToDOM(activeTheme, uploadedBgDataUrl);
  drawColorWheel(); syncMethodViews(); renderAll();

  uploadedBgDataUrl = await loadUploadedBg();
  if (uploadedBgDataUrl) applyThemeToDOM(activeTheme, uploadedBgDataUrl);

  ensureScramblerLoaded().then((ok) => { if (ok) { if (timerState === "idle") loadNextScramble(settings.event); } else scrambleStatusEl.textContent = "Offline fallback (Wi-Fi)"; });
  importWithTimeout("https://cdn.cubing.net/v0/js/cubing/twisty", 12000).then(() => updateScramblePreview()).catch(() => { previewModeBadge.textContent = "Offline"; });
}

function showToast(msg) { toastEl.textContent = msg; toastEl.classList.remove("hidden"); clearTimeout(toastTimeoutId); toastTimeoutId = setTimeout(() => toastEl.classList.add("hidden"), 3200); }

// === SECTION A4: COLOR WHEEL & THEME STUDIO ===
function hexToRgb(hex) {
  const c = (hex || "#000000").replace("#", ""), full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const n = parseInt(full, 16); return Number.isNaN(n) ? { r: 10, g: 10, b: 10 } : { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const hexToRgba = (hex, a) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const isLightColor = (hex) => { const { r, g, b } = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62; };

function hsvToHex(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0); };
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}
function hexToHsv(hex) {
  const { r: r0, g: g0, b: b0 } = hexToRgb(hex), r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min; let h = 0;
  if (d !== 0) { h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}
function drawColorWheel() {
  const ctx2 = $("color-wheel-canvas").getContext("2d"), size = 152, c = 76, r = 74, img = ctx2.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = x - c, dy = y - c, dist = Math.hypot(dx, dy), idx = (y * size + x) * 4;
    if (dist <= r) {
      const { r: cr, g: cg, b: cb } = hexToRgb(hsvToHex((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, dist / r, 1));
      img.data[idx] = cr; img.data[idx + 1] = cg; img.data[idx + 2] = cb; img.data[idx + 3] = 255;
    }
  }
  ctx2.putImageData(img, 0, 0);
}
function syncWheelToHex(hex) {
  wheelHSV = hexToHsv(hex); const c = 76, r = 74, rad = (wheelHSV.h * Math.PI) / 180, d = wheelHSV.s * r;
  $("wheel-cursor").style.left = `${c + Math.cos(rad) * d}px`; $("wheel-cursor").style.top = `${c + Math.sin(rad) * d}px`;
  $("wheel-val-slider").value = Math.round(wheelHSV.v * 100);
  $("wheel-hex-input").value = hex.toUpperCase(); $("wheel-hex-badge").textContent = hex.toUpperCase();
}
function pushColorHistory(hex) {
  const u = hex.toUpperCase(); if (!/^#[0-9A-F]{6}$/.test(u)) return;
  colorHistory = [u, ...colorHistory.filter((c) => c !== u)].slice(0, 14);
  localStorage.setItem(STORAGE_COLOR_HISTORY_KEY, JSON.stringify(colorHistory)); renderColorHistory();
}
function applyDraftSlotColor(hex) {
  if (!draftTheme) return;
  draftTheme[activeColorSlot] = hex; syncWheelToHex(hex); renderColorSlots(); applyThemeToDOM(draftTheme, draftUploadedBgDataUrl);
}
function handleWheelPointer(cx, cy) {
  const rect = $("color-wheel-canvas").getBoundingClientRect(), c = rect.width / 2, r = c - 2;
  let dx = cx - rect.left - c, dy = cy - rect.top - c, dist = Math.hypot(dx, dy);
  if (dist > r) { dx = (dx / dist) * r; dy = (dy / dist) * r; dist = r; }
  wheelHSV.h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360; wheelHSV.s = dist / r;
  applyDraftSlotColor(hsvToHex(wheelHSV.h, wheelHSV.s, wheelHSV.v));
}

$("wheel-wrap").addEventListener("pointerdown", (e) => { isDraggingWheel = true; $("wheel-wrap").setPointerCapture(e.pointerId); handleWheelPointer(e.clientX, e.clientY); });
$("wheel-wrap").addEventListener("pointermove", (e) => { if (isDraggingWheel) handleWheelPointer(e.clientX, e.clientY); });
$("wheel-wrap").addEventListener("pointerup", () => { if (isDraggingWheel && draftTheme) { isDraggingWheel = false; pushColorHistory(draftTheme[activeColorSlot]); } });
$("wheel-val-slider").addEventListener("input", () => { wheelHSV.v = Number($("wheel-val-slider").value) / 100; applyDraftSlotColor(hsvToHex(wheelHSV.h, wheelHSV.s, wheelHSV.v)); });
$("wheel-val-slider").addEventListener("change", () => draftTheme && pushColorHistory(draftTheme[activeColorSlot]));
$("wheel-hex-input").addEventListener("input", () => { const v = $("wheel-hex-input").value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyDraftSlotColor(v); });
$("wheel-hex-input").addEventListener("change", () => { const v = $("wheel-hex-input").value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) pushColorHistory(v); });
$("clear-history-btn").addEventListener("click", () => { colorHistory = []; localStorage.setItem(STORAGE_COLOR_HISTORY_KEY, "[]"); renderColorHistory(); });

function applyThemeToDOM(theme, uploadedImg) {
  const root = document.documentElement.style, lightBase = isLightColor(theme.sidebarColor), bBase = lightBase ? "#000000" : "#ffffff";
  root.setProperty("--bg-primary", theme.bgColor);
  root.setProperty("--sidebar-bg-rgba", hexToRgba(theme.sidebarColor, theme.sidebarAlpha / 100));
  root.setProperty("--sidebar-blur", `${theme.sidebarBlur}px`);
  root.setProperty("--card-bg-rgba", hexToRgba(theme.cardColor, Math.min(0.95, (theme.sidebarAlpha + 4) / 100)));
  root.setProperty("--scramble-bg-rgba", theme.scrambleBox ? hexToRgba(theme.scrambleColor, 0.72) : "rgba(0,0,0,0)");
  root.setProperty("--border-color", hexToRgba(bBase, lightBase ? 0.14 : 0.1));
  root.setProperty("--border-strong", hexToRgba(bBase, lightBase ? 0.28 : 0.22));
  root.setProperty("--text-primary", theme.textColor); root.setProperty("--text-secondary", theme.mutedColor);
  root.setProperty("--accent-color", theme.accentColor); root.setProperty("--accent-contrast", isLightColor(theme.accentColor) ? "#0a0a0a" : "#ffffff");
  root.setProperty("--state-idle", theme.textColor); root.setProperty("--state-holding", theme.holdingColor); root.setProperty("--state-ready", theme.readyColor); root.setProperty("--state-running", theme.textColor);
  root.setProperty("--font-timer", theme.timerFont); root.setProperty("--font-ui", theme.uiFont); root.setProperty("--radius", `${theme.radius}px`);
  root.setProperty("--bg-blur", `${theme.bgBlur}px`); root.setProperty("--bg-dim", String(theme.bgDim / 100)); root.setProperty("--bg-pos-y", `${theme.bgPosY}%`); root.setProperty("--bg-scale", String(theme.bgScale / 100));

  if (theme.bgMode === "scene") {
    const sc = PREMADE_SCENES.find((s) => s.id === theme.sceneId) || PREMADE_SCENES[0];
    bgMediaEl.style.backgroundImage = sc.uri; bgMediaEl.style.opacity = "1"; bgDimEl.style.display = "block";
  } else if (theme.bgMode === "upload" && uploadedImg) {
    bgMediaEl.style.backgroundImage = `url("${uploadedImg}")`; bgMediaEl.style.opacity = "1"; bgDimEl.style.display = "block";
  } else {
    bgMediaEl.style.backgroundImage = "none"; bgMediaEl.style.opacity = "0"; bgDimEl.style.display = "none";
  }
  timerCore.classList.toggle("has-backdrop", Boolean(theme.timerBackdrop));
  scrambleArea.classList.toggle("has-box", Boolean(theme.scrambleBox));
}

function openThemeStudio() { draftTheme = JSON.parse(JSON.stringify(activeTheme)); draftUploadedBgDataUrl = uploadedBgDataUrl; syncStudioUI(); $("theme-modal").classList.remove("hidden"); }
function cancelThemeStudio() { draftTheme = null; draftUploadedBgDataUrl = null; applyThemeToDOM(activeTheme, uploadedBgDataUrl); $("theme-modal").classList.add("hidden"); }
async function applyThemeStudio() {
  if (!draftTheme) return;
  activeTheme = JSON.parse(JSON.stringify(draftTheme));
  if (draftUploadedBgDataUrl && draftUploadedBgDataUrl !== uploadedBgDataUrl) { uploadedBgDataUrl = draftUploadedBgDataUrl; await saveUploadedBg(uploadedBgDataUrl); }
  localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(activeTheme));
  applyThemeToDOM(activeTheme, uploadedBgDataUrl); draftTheme = null; $("theme-modal").classList.add("hidden"); showToast("Theme applied!");
}

function syncStudioUI() {
  if (!draftTheme) return;
  renderQuickMoods(); renderPresets(); renderGallery(); renderColorSlots(); renderColorHistory();
  $("theme-timer-box").checked = Boolean(draftTheme.timerBackdrop); $("theme-scramble-box").checked = Boolean(draftTheme.scrambleBox);
  document.querySelectorAll(".source-tab").forEach((b) => b.classList.toggle("active", b.dataset.bgMode === draftTheme.bgMode));
  $("bg-source-scene").classList.toggle("hidden", draftTheme.bgMode !== "scene");
  $("bg-source-upload").classList.toggle("hidden", draftTheme.bgMode !== "upload");
  $("bg-sliders-panel").classList.toggle("hidden", draftTheme.bgMode === "color");
  $("upload-status-text").textContent = draftUploadedBgDataUrl ? "Custom photo loaded" : "Upload your own wallpaper";
  $("theme-bg-blur").value = draftTheme.bgBlur; $("bg-blur-val").textContent = `${draftTheme.bgBlur}px`;
  $("theme-bg-dim").value = draftTheme.bgDim; $("bg-dim-val").textContent = `${draftTheme.bgDim}%`;
  $("theme-bg-posy").value = draftTheme.bgPosY; $("bg-posy-val").textContent = `${draftTheme.bgPosY}%`;
  $("theme-bg-scale").value = draftTheme.bgScale; $("bg-scale-val").textContent = `${draftTheme.bgScale}%`;
  $("theme-sidebar-alpha").value = draftTheme.sidebarAlpha; $("sidebar-alpha-val").textContent = `${draftTheme.sidebarAlpha}%`;
  $("theme-sidebar-blur").value = draftTheme.sidebarBlur; $("sidebar-blur-val").textContent = `${draftTheme.sidebarBlur}px`;
  $("theme-radius").value = draftTheme.radius; $("radius-val").textContent = `${draftTheme.radius}px`;
  $("theme-timer-font").value = draftTheme.timerFont; $("theme-ui-font").value = draftTheme.uiFont;
  $("wheel-slot-name").textContent = (COLOR_SLOTS.find((s) => s.key === activeColorSlot) || COLOR_SLOTS[0]).label;
  syncWheelToHex(draftTheme[activeColorSlot]);
}
function renderQuickMoods() {
  const wrap = $("accent-pills"); wrap.innerHTML = "";
  const cur = QUICK_MOODS.find((m) => m.id === draftTheme.mood);
  $("active-mood-label").textContent = cur ? cur.name.toUpperCase() : "CUSTOM";
  QUICK_MOODS.forEach((m) => {
    const b = document.createElement("button"); b.type = "button"; b.className = `accent-pill ${draftTheme.mood === m.id ? "active" : ""}`;
    b.innerHTML = `<span class="accent-dot" style="background:${m.dot}"></span><span>${m.name}</span>`;
    b.addEventListener("click", () => { Object.assign(draftTheme, { mood: m.id, bgColor: m.bg, sidebarColor: m.sidebar, cardColor: m.card, textColor: m.text, mutedColor: m.muted, accentColor: m.accent, presetId: null }); applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI(); });
    wrap.appendChild(b);
  });
}
function renderPresets() {
  const makeCard = (p, isCust = false) => {
    const c = document.createElement("div"); c.className = `preset-card ${draftTheme.presetId === p.id ? "active" : ""}`;
    let ts = `background: linear-gradient(135deg, ${p.theme.bgColor} 55%, ${p.theme.accentColor} 100%)`;
    if (p.theme.bgMode === "scene") { const sc = PREMADE_SCENES.find((s) => s.id === p.theme.sceneId); if (sc) ts = `background-image: ${sc.uri}`; }
    c.innerHTML = `<div class="preset-thumb" style="${ts}"></div><div class="preset-meta"><strong>${p.name}</strong><small>${p.desc || "Custom"}</small></div>${isCust ? `<button class="preset-del" data-del="${p.id}" type="button">✕</button>` : ""}`;
    c.addEventListener("click", (e) => {
      if (e.target.closest("[data-del]")) { e.stopPropagation(); savedPresets = savedPresets.filter((x) => x.id !== p.id); localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(savedPresets)); renderPresets(); return; }
      draftTheme = { ...DEFAULT_THEME, ...p.theme, presetId: p.id }; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI();
    });
    return c;
  };
  $("color-presets-grid").innerHTML = ""; COLOR_PRESETS.forEach((p) => $("color-presets-grid").appendChild(makeCard(p)));
  $("scene-presets-grid").innerHTML = ""; SCENE_PRESETS.forEach((p) => $("scene-presets-grid").appendChild(makeCard(p)));
  $("saved-presets-grid").innerHTML = ""; $("saved-presets-section").classList.toggle("hidden", !savedPresets.length);
  savedPresets.forEach((p) => $("saved-presets-grid").appendChild(makeCard(p, true)));
}
function renderGallery() {
  const g = $("gallery-grid"); g.innerHTML = "";
  PREMADE_SCENES.forEach((sc) => {
    const it = document.createElement("button"); it.type = "button"; it.className = `gallery-item ${draftTheme.sceneId === sc.id ? "active" : ""}`;
    it.style.backgroundImage = sc.uri; it.textContent = sc.name;
    it.addEventListener("click", () => { draftTheme.bgMode = "scene"; draftTheme.sceneId = sc.id; draftTheme.presetId = null; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI(); });
    g.appendChild(it);
  });
}
function renderColorSlots() {
  const w = $("color-slots"); w.innerHTML = "";
  COLOR_SLOTS.forEach((slot) => {
    const b = document.createElement("button"); b.type = "button"; b.className = `color-slot-btn ${activeColorSlot === slot.key ? "active" : ""}`;
    b.innerHTML = `<span>${slot.label}</span><span class="slot-swatch" style="background:${draftTheme[slot.key]}"></span>`;
    b.addEventListener("click", () => { activeColorSlot = slot.key; syncStudioUI(); });
    w.appendChild(b);
  });
}
function renderColorHistory() {
  const w = $("color-history-swatches"); w.innerHTML = "";
  const list = colorHistory.length ? colorHistory : [...new Set(COLOR_SLOTS.map((s) => (draftTheme || activeTheme)[s.key].toUpperCase()))];
  list.forEach((hex) => {
    const sw = document.createElement("button"); sw.type = "button"; sw.className = "hist-swatch"; sw.style.background = hex; sw.title = hex;
    sw.addEventListener("click", () => { applyDraftSlotColor(hex); pushColorHistory(hex); });
    w.appendChild(sw);
  });
}

$("theme-btn").addEventListener("click", openThemeStudio);
$("close-theme-btn").addEventListener("click", cancelThemeStudio);
$("cancel-theme-btn").addEventListener("click", cancelThemeStudio);
$("apply-theme-btn").addEventListener("click", applyThemeStudio);
document.querySelectorAll(".studio-tab").forEach((t) => t.addEventListener("click", () => {
  activeStudioTab = t.dataset.studioTab;
  document.querySelectorAll(".studio-tab").forEach((x) => x.classList.toggle("active", x === t));
  $("studio-pane-presets").classList.toggle("hidden", activeStudioTab !== "presets");
  $("studio-pane-custom").classList.toggle("hidden", activeStudioTab !== "custom");
}));
document.querySelectorAll(".source-tab").forEach((t) => t.addEventListener("click", () => {
  draftTheme.bgMode = t.dataset.bgMode; draftTheme.presetId = null; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI();
}));
$("upload-bg-btn").addEventListener("click", () => { $("bg-image-input").value = ""; $("bg-image-input").click(); });
$("bg-image-input").addEventListener("change", () => {
  const f = $("bg-image-input").files?.[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => { draftUploadedBgDataUrl = r.result; draftTheme.bgMode = "upload"; draftTheme.presetId = null; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI(); };
  r.readAsDataURL(f);
});
$("theme-timer-box").addEventListener("change", () => { draftTheme.timerBackdrop = $("theme-timer-box").checked; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
$("theme-scramble-box").addEventListener("change", () => { draftTheme.scrambleBox = $("theme-scramble-box").checked; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
[["theme-bg-blur", "bgBlur", "bg-blur-val", "px"], ["theme-bg-dim", "bgDim", "bg-dim-val", "%"], ["theme-bg-posy", "bgPosY", "bg-posy-val", "%"], ["theme-bg-scale", "bgScale", "bg-scale-val", "%"], ["theme-sidebar-alpha", "sidebarAlpha", "sidebar-alpha-val", "%"], ["theme-sidebar-blur", "sidebarBlur", "sidebar-blur-val", "px"], ["theme-radius", "radius", "radius-val", "px"]].forEach(([id, k, lbl, suf]) => {
  $(id).addEventListener("input", () => { draftTheme[k] = Number($(id).value); draftTheme.presetId = null; $(lbl).textContent = `${$(id).value}${suf}`; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
});
$("theme-timer-font").addEventListener("change", () => { draftTheme.timerFont = $("theme-timer-font").value; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
$("theme-ui-font").addEventListener("change", () => { draftTheme.uiFont = $("theme-ui-font").value; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
$("save-custom-preset-btn").addEventListener("click", () => {
  if (!draftTheme) return;
  const name = prompt("Name your custom theme preset:", "My Custom Vibe");
  if (!name || !name.trim()) return;
  const id = `custom-${Date.now()}`;
  savedPresets.push({ id, name: name.trim(), desc: "Custom saved vibe", theme: { ...draftTheme, presetId: id } });
  localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(savedPresets));
  draftTheme.presetId = id; renderPresets(); showToast(`Saved "${name.trim()}"`);
});

// === SECTION A5: SCRAMBLES, INSPECTION & TIMER ===
let inspStartTime = null, inspIntervalId = null, inspWarned8 = false, inspWarned12 = false, pendingPenalty = null, armingInspTrigger = null;

function playBeep(freq = 880, dur = 0.09) {
  if (!settings.inspectionAudio) return;
  try {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    const c = new AC(), o = c.createOscillator(), g = c.createGain();
    o.type = "sine"; o.frequency.value = freq; g.gain.setValueAtTime(0.08, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    o.connect(g); g.connect(c.destination); o.start(); o.stop(c.currentTime + dur);
    setTimeout(() => c.close(), 350);
  } catch {}
}

function localFallbackScramble(eventId) {
  const pick = (a) => a[Math.floor(Math.random() * a.length)], mods = ["", "'", "2"];
  const gen = (faces, len) => {
    const out = []; let last = "", prev2 = "";
    for (let i = 0; i < len; i++) { let f; do { f = pick(faces); } while (f === last || (f[0] === last[0] && f === prev2)); prev2 = last; last = f; out.push(f + pick(mods)); }
    return out.join(" ");
  };
  if (eventId === "222") return gen(["U", "R", "F"], 9);
  if (eventId === "444") return gen(["U", "D", "R", "L", "F", "B", "Uw", "Rw", "Fw"], 40);
  if (eventId === "555") return gen(["U", "D", "R", "L", "F", "B", "Uw", "Dw", "Rw", "Lw", "Fw", "Bw"], 60);
  if (eventId === "666" || eventId === "777") return gen(["U", "D", "R", "L", "F", "B", "Uw", "Dw", "Rw", "Lw", "Fw", "Bw", "3Uw", "3Rw", "3Fw"], 80);
  if (eventId === "pyram") return gen(["U", "L", "R", "B"], 10);
  if (eventId === "skewb") return gen(["U", "L", "R", "B"], 9);
  return gen(["U", "D", "R", "L", "F", "B"], 20);
}

async function generateScramble(eventId) {
  if (!randomScrambleForEvent) { ensureScramblerLoaded(); return { text: localFallbackScramble(eventId), offline: true }; }
  return { text: (await randomScrambleForEvent(eventId)).toString(), offline: false };
}

async function loadNextScramble(eventId) {
  scrambleStatusEl.textContent = "Generating...";
  try {
    let r;
    if (prefetchedScramble && prefetchedEvent === eventId) { r = prefetchedScramble; prefetchedScramble = null; prefetchedEvent = null; }
    else r = await generateScramble(eventId);
    if (eventId === settings.event) {
      currentScramble = r.text; scrambleTextEl.textContent = currentScramble;
      scrambleStatusEl.textContent = r.offline ? "Offline fallback (Wi-Fi)" : "";
      updateScramblePreview();
      if (!r.offline) prefetchScramble(eventId);
    }
  } catch { currentScramble = localFallbackScramble(eventId); scrambleTextEl.textContent = currentScramble; scrambleStatusEl.textContent = "Offline fallback"; }
}
async function prefetchScramble(eventId) {
  try { const n = await generateScramble(eventId); if (eventId === settings.event && !n.offline) { prefetchedScramble = n; prefetchedEvent = eventId; } } catch {}
}

function updateScramblePreview() {
  const puzzle = EVENT_TO_PUZZLE[settings.event] || "3x3x3", dim = settings.event === "clock" ? "2D" : settings.previewDim;
  scramblePlayer.setAttribute("puzzle", puzzle); scramblePlayer.setAttribute("visualization", dim);
  scramblePlayer.setAttribute("experimental-setup-alg", currentScramble || ""); scramblePlayer.setAttribute("alg", "");
  scramblePlayer.setAttribute("camera-latitude-limit", "none"); scramblePlayer.setAttribute("experimental-drag-input", "auto");
  try { scramblePlayer.puzzle = puzzle; scramblePlayer.visualization = dim; scramblePlayer.experimentalSetupAlg = currentScramble || ""; scramblePlayer.alg = ""; } catch {}
  previewModeBadge.textContent = dim; toggleDimBtn.textContent = settings.previewDim === "3D" ? "Switch to 2D" : "Switch to 3D";
}

toggleDimBtn.addEventListener("click", () => { toggleDimBtn.blur(); updateSetting("previewDim", settings.previewDim === "3D" ? "2D" : "3D"); updateScramblePreview(); });
resetCamBtn.addEventListener("click", () => { resetCamBtn.blur(); try { scramblePlayer.cameraLatitude = 30; scramblePlayer.cameraLongitude = 35; } catch {} });

function setTimerState(next) {
  timerState = next; timerZone.dataset.state = next;
  if (next !== "inspecting") delete timerZone.dataset.inspWarn;
  const hideUI = (next === "running" || next === "inspecting") && settings.focusMode;
  appEl.classList.toggle("is-running", hideUI); document.body.classList.toggle("is-solving", hideUI);
  if (hideUI) { advStatsOpen = false; advStatsDrawer.classList.add("hidden"); }

  if (next === "idle") timerHintText.textContent = settings.inspection ? "Tap SPACE or CLICK to inspect (15s)" : "Hold SPACE or CLICK to ready";
  else if (next === "inspecting") timerHintText.textContent = "Inspecting • Hold SPACE/CLICK to start (ESC cancels)";
  else if (next === "holding") { timerDisplay.textContent = formatTime(0, settings.decimals); timerHintText.textContent = settings.holdDelayMs > 0 ? "Keep holding..." : "Release to start"; }
  else if (next === "ready") { timerDisplay.textContent = formatTime(0, settings.decimals); timerHintText.textContent = "Release to start"; }
  else if (next === "running") timerHintText.textContent = "Running";
}

function startInspection() {
  clearInterval(inspIntervalId); inspStartTime = performance.now(); inspWarned8 = false; inspWarned12 = false; pendingPenalty = null;
  pbBanner.classList.add("hidden"); lastSolveActions.classList.add("hidden"); setTimerState("inspecting"); updateInspectionDisplay();
  inspIntervalId = setInterval(() => {
    if (inspStartTime === null) return;
    const elapsed = performance.now() - inspStartTime;
    if (elapsed >= 8000 && !inspWarned8) { inspWarned8 = true; playBeep(880, 0.08); }
    if (elapsed >= 12000 && !inspWarned12) { inspWarned12 = true; playBeep(1046, 0.09); setTimeout(() => playBeep(1046, 0.09), 130); }
    if (elapsed >= 17000 && timerState === "inspecting") {
      clearInterval(inspIntervalId); inspIntervalId = null; inspStartTime = null; playBeep(220, 0.22);
      solves.push({ id: String(Date.now() + Math.random()), event: settings.event, rawMs: 1, penalty: "DNF", scramble: currentScramble, createdAt: Date.now() });
      saveSolves(); setTimerState("idle"); renderAll(); showToast("Inspection > 17s — DNF"); loadNextScramble(settings.event);
      return;
    }
    if (timerState === "inspecting") updateInspectionDisplay();
  }, 50);
}
function updateInspectionDisplay() {
  if (inspStartTime === null) return;
  const elapsed = performance.now() - inspStartTime;
  if (elapsed < 15000) {
    timerDisplay.textContent = String(Math.ceil((15000 - elapsed) / 1000));
    if (elapsed >= 12000) timerZone.dataset.inspWarn = "12"; else delete timerZone.dataset.inspWarn;
  } else { timerDisplay.textContent = "+2"; timerZone.dataset.inspWarn = "plus2"; }
}
function cancelInspection() { clearInterval(inspIntervalId); inspIntervalId = null; inspStartTime = null; pendingPenalty = null; armingInspTrigger = null; setTimerState("idle"); renderAll(); }
function beginHold(trig) {
  if (timerState !== "idle" && timerState !== "inspecting") return;
  activeTrigger = trig; clearTimeout(holdTimeoutId); pbBanner.classList.add("hidden");
  if (settings.holdDelayMs <= 0) { setTimerState("ready"); return; }
  setTimerState("holding"); holdTimeoutId = setTimeout(() => { if (timerState === "holding") setTimerState("ready"); }, settings.holdDelayMs);
}
function cancelHold() {
  clearTimeout(holdTimeoutId); holdTimeoutId = null; activeTrigger = null;
  if (inspStartTime !== null) { setTimerState("inspecting"); updateInspectionDisplay(); } else { setTimerState("idle"); renderAll(); }
}
function startTimer() {
  clearTimeout(holdTimeoutId); holdTimeoutId = null; activeTrigger = null;
  if (inspStartTime !== null) {
    const ie = performance.now() - inspStartTime; clearInterval(inspIntervalId); inspIntervalId = null; inspStartTime = null;
    pendingPenalty = ie > 17000 ? "DNF" : ie > 15000 ? "+2" : null;
  } else pendingPenalty = null;
  startTime = performance.now(); setTimerState("running"); lastSolveActions.classList.add("hidden");
  const tick = () => { if (timerState !== "running") return; timerDisplay.textContent = formatTime(performance.now() - startTime, settings.decimals); rafId = requestAnimationFrame(tick); };
  rafId = requestAnimationFrame(tick);
}
function stopTimer(stopTrig) {
  const stopTime = performance.now(); cancelAnimationFrame(rafId); rafId = null;
  const elapsedMs = Math.max(1, Math.round(stopTime - startTime)); activeTrigger = stopTrig; setTimerState("stopping");
  const prev = getCurrentEventSolves();
  const solve = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), event: settings.event, rawMs: elapsedMs, penalty: pendingPenalty, scramble: currentScramble, createdAt: Date.now() };
  pendingPenalty = null; timerDisplay.textContent = formatSolve(solve, settings.decimals);
  lastSolveActions.classList.remove("hidden"); lastPlus2Btn.classList.remove("active"); lastDnfBtn.classList.remove("active");
  solves.push(solve);
  setTimeout(() => { saveSolves(); renderAll(); checkAndCelebratePB(prev, solve); loadNextScramble(settings.event); }, 0);
}
function finishStopCycle() { if (timerState === "stopping") { activeTrigger = null; setTimerState("idle"); } }

const isModalOpen = () => !$("theme-modal").classList.contains("hidden") || !$("settings-modal").classList.contains("hidden") || !$("solve-modal").classList.contains("hidden") || !$("profile-modal").classList.contains("hidden");

window.addEventListener("keydown", (e) => {
  if (isModalOpen()) { if (e.key === "Escape") { if (!$("theme-modal").classList.contains("hidden")) cancelThemeStudio(); else closeModals(); } return; }
  if (activeTab === "improvement") { handleImprovementKeyDown(e); return; }
  if (activeTab !== "timer") return;
  if (e.key === "Escape" && (timerState === "inspecting" || timerState === "holding" || timerState === "ready")) { clearTimeout(holdTimeoutId); holdTimeoutId = null; activeTrigger = null; cancelInspection(); return; }
  if (e.code === "Space") {
    e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (e.repeat) return;
    if (timerState === "idle") { if (settings.inspection) armingInspTrigger = "space"; else beginHold("space"); }
    else if (timerState === "inspecting") beginHold("space");
    else if (timerState === "running") stopTimer("space");
  }
});
window.addEventListener("keyup", (e) => {
  if (e.code !== "Space") return; e.preventDefault();
  if (activeTab === "improvement") { handleImprovementKeyUp(e); return; }
  if (activeTab !== "timer") return;
  if (armingInspTrigger === "space" && timerState === "idle") { armingInspTrigger = null; startInspection(); }
  else if (timerState === "holding" && activeTrigger === "space") cancelHold();
  else if (timerState === "ready" && activeTrigger === "space") startTimer();
  else if (timerState === "stopping" && activeTrigger === "space") finishStopCycle();
});
window.addEventListener("pointerdown", (e) => {
  if (timerState !== "running") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  e.preventDefault(); e.stopPropagation(); suppressNextClick = true; setTimeout(() => (suppressNextClick = false), 100); stopTimer("pointer");
}, { capture: true });
window.addEventListener("click", (e) => { if (suppressNextClick) { e.preventDefault(); e.stopPropagation(); suppressNextClick = false; } }, { capture: true });
timerZone.addEventListener("pointerdown", (e) => {
  if (isModalOpen() || activeTab !== "timer") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.target.closest("button, select, input, a, .scramble-text, .adv-stats-drawer")) return;
  if (timerState === "idle") { e.preventDefault(); if (settings.inspection) armingInspTrigger = "pointer"; else beginHold("pointer"); }
  else if (timerState === "inspecting") { e.preventDefault(); beginHold("pointer"); }
});
window.addEventListener("pointerup", () => {
  if (activeTab === "improvement") { handleImprovementPointerUp(); return; }
  if (armingInspTrigger === "pointer" && timerState === "idle") { armingInspTrigger = null; startInspection(); }
  else if (timerState === "holding" && activeTrigger === "pointer") cancelHold();
  else if (timerState === "ready" && activeTrigger === "pointer") startTimer();
  else if (timerState === "stopping" && activeTrigger === "pointer") finishStopCycle();
});
window.addEventListener("pointercancel", () => { armingInspTrigger = null; if (timerState === "holding" || timerState === "ready") cancelHold(); else if (timerState === "stopping") finishStopCycle(); });
window.addEventListener("blur", () => { armingInspTrigger = null; if (timerState === "holding" || timerState === "ready") cancelHold(); else if (timerState === "stopping") finishStopCycle(); });

// === SECTION A6: NAVIGATION, IMPORT/EXPORT, SETTINGS & PROFILE ===
navTabs.forEach((btn) => btn.addEventListener("click", () => { if (timerState !== "running") { switchTab(btn.dataset.tab); btn.blur(); } }));
function togglePenalty(id, type) { const s = solves.find((x) => x.id === id); if (!s) return; s.penalty = s.penalty === type ? null : type; saveSolves(); renderAll(); if (selectedSolveId === id) openSolveModal(id); }
function deleteSolve(id) { solves = solves.filter((x) => x.id !== id); saveSolves(); if (selectedSolveId === id) closeModals(); renderAll(); }

eventSelect.addEventListener("change", () => { settings.event = eventSelect.value; eventSelect.blur(); prefetchedScramble = null; prefetchedEvent = null; saveSettings(); renderAll(); loadNextScramble(settings.event); });
trendRangeSelect.addEventListener("change", () => { updateSetting("trendRange", trendRangeSelect.value); trendRangeSelect.blur(); });
trendFlattenBtn.addEventListener("click", () => { trendFlattenBtn.blur(); updateSetting("trendFlatten", !settings.trendFlatten); });
inspTogglePill.addEventListener("click", () => { inspTogglePill.blur(); if (timerState === "idle") updateSetting("inspection", !settings.inspection); });
newScrambleBtn.addEventListener("click", () => { newScrambleBtn.blur(); loadNextScramble(settings.event); });
copyScrambleBtn.addEventListener("click", async () => { copyScrambleBtn.blur(); if (currentScramble) try { await navigator.clipboard.writeText(currentScramble); showToast("Scramble copied"); } catch {} });
editGoalBtn.addEventListener("click", () => { editGoalBtn.blur(); const v = prompt("Target Ao5 in seconds:", (settings.goalMs / 1000).toFixed(2)); const n = parseFloat(v); if (v !== null && !Number.isNaN(n) && n > 0) updateSetting("goalMs", Math.round(n * 1000)); });
lastPlus2Btn.addEventListener("click", () => { const l = getCurrentEventSolves().slice(-1)[0]; if (l) togglePenalty(l.id, "+2"); });
lastDnfBtn.addEventListener("click", () => { const l = getCurrentEventSolves().slice(-1)[0]; if (l) togglePenalty(l.id, "DNF"); });
lastDelBtn.addEventListener("click", () => { const l = getCurrentEventSolves().slice(-1)[0]; if (l) deleteSolve(l.id); });
clearSessionBtn.addEventListener("click", () => { const l = getCurrentEventSolves(); if (l.length && confirm(`Clear ${l.length} solves?`)) { solves = solves.filter((s) => s.event !== settings.event); saveSolves(); renderAll(); } });
exportBtn.addEventListener("click", () => { const u = URL.createObjectURL(new Blob([JSON.stringify(solves, null, 2)], { type: "application/json" })); const a = document.createElement("a"); a.href = u; a.download = `algtimer-solves-${new Date().toISOString().slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(u); });

const triggerImport = () => { importFileInput.value = ""; importFileInput.click(); };
importBtn.addEventListener("click", () => { importBtn.blur(); triggerImport(); });
settingsImportBtn.addEventListener("click", () => { settingsImportBtn.blur(); triggerImport(); });
importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files?.[0]; if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    let inc = 0, dup = 0; const evC = {}, mk = (s) => `${s.event}|${s.rawMs}|${s.penalty || ""}|${s.scramble || ""}|${s.createdAt}`, ex = new Set(solves.map(mk));
    if (Array.isArray(data)) {
      for (const it of data) {
        if (!it || typeof it.rawMs !== "number") continue;
        const s = { id: it.id || String(Date.now() + Math.random()), event: EVENT_TO_PUZZLE[it.event] ? it.event : "333", rawMs: Math.max(1, Math.round(it.rawMs)), penalty: it.penalty === "+2" || it.penalty === "DNF" ? it.penalty : null, scramble: typeof it.scramble === "string" ? it.scramble : "", createdAt: typeof it.createdAt === "number" ? it.createdAt : Date.now() };
        if (ex.has(mk(s))) { dup++; continue; } ex.add(mk(s)); solves.push(s); inc++; evC[s.event] = (evC[s.event] || 0) + 1;
      }
    } else if (data && typeof data === "object") {
      let sData = {}; if (typeof data.properties?.sessionData === "string") try { sData = JSON.parse(data.properties.sessionData); } catch {} else if (data.properties?.sessionData) sData = data.properties.sessionData;
      for (const [k, list] of Object.entries(data)) {
        const m = k.match(/^session(\d+)$/); if (!m || !Array.isArray(list)) continue;
        const mEv = CSTIMER_EVENT_MAP[sData[m[1]]?.opt?.scrType || "333"] || "333";
        for (const en of list) {
          if (!Array.isArray(en) || !Array.isArray(en[0])) continue;
          const [flg, ms] = en[0]; if (typeof ms !== "number" || ms <= 0) continue;
          const s = { id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()), event: mEv, rawMs: Math.round(ms), penalty: flg === -1 ? "DNF" : flg === 2000 ? "+2" : null, scramble: typeof en[1] === "string" ? en[1] : "", createdAt: typeof en[3] === "number" ? en[3] * 1000 : Date.now() };
          if (ex.has(mk(s))) { dup++; continue; } ex.add(mk(s)); solves.push(s); inc++; evC[mEv] = (evC[mEv] || 0) + 1;
        }
      }
    }
    solves.sort((a, b) => a.createdAt - b.createdAt); saveSolves();
    const topEv = Object.entries(evC).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topEv && !evC[settings.event]) { settings.event = topEv; eventSelect.value = topEv; saveSettings(); loadNextScramble(topEv); }
    renderAll(); showToast(`Imported ${inc} solves${dup ? ` (${dup} dupes)` : ""}`);
  } catch { showToast("Could not parse file."); }
});

function openSolveModal(id) {
  const s = solves.find((x) => x.id === id); if (!s) return;
  selectedSolveId = id; $("solve-modal-time").textContent = formatSolve(s, settings.decimals);
  $("solve-modal-meta").textContent = `${s.event.toUpperCase()} • ${new Date(s.createdAt).toLocaleString()}`;
  $("solve-modal-scramble").textContent = s.scramble || "(no scramble)";
  $("modal-plus2-btn").classList.toggle("active", s.penalty === "+2"); $("modal-dnf-btn").classList.toggle("active", s.penalty === "DNF");
  $("solve-modal").classList.remove("hidden");
}
$("modal-plus2-btn").addEventListener("click", () => selectedSolveId && togglePenalty(selectedSolveId, "+2"));
$("modal-dnf-btn").addEventListener("click", () => selectedSolveId && togglePenalty(selectedSolveId, "DNF"));
$("modal-del-btn").addEventListener("click", () => selectedSolveId && deleteSolve(selectedSolveId));
$("close-solve-modal-btn").addEventListener("click", closeModals);
$("settings-btn").addEventListener("click", () => $("settings-modal").classList.remove("hidden"));
$("close-settings-btn").addEventListener("click", closeModals);
$("profile-btn").addEventListener("click", () => { $("profile-name-input").value = settings.profileName; $("profile-method-select").value = settings.profileMethod; $("profile-modal").classList.remove("hidden"); });
$("close-profile-btn").addEventListener("click", closeModals);
$("save-profile-btn").addEventListener("click", () => {
  settings.profileName = $("profile-name-input").value.trim() || "Cuber";
  const mc = settings.profileMethod !== $("profile-method-select").value;
  settings.profileMethod = $("profile-method-select").value; saveSettings(); applySettingsToUI();
  if (mc) syncMethodViews(); closeModals(); showToast(`Profile saved (${settings.profileMethod})`);
});
[$("settings-modal"), $("solve-modal"), $("profile-modal")].forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
$("theme-modal").addEventListener("click", (e) => { if (e.target === $("theme-modal")) cancelThemeStudio(); });
function closeModals() { $("settings-modal").classList.add("hidden"); $("solve-modal").classList.add("hidden"); $("profile-modal").classList.add("hidden"); selectedSolveId = null; }

function applySettingsToUI() {
  const root = document.documentElement.style;
  root.setProperty("--timer-size", `${settings.timerSize}rem`); root.setProperty("--scramble-size", `${settings.scrambleSize}rem`); root.setProperty("--sidebar-width", `${settings.sidebarWidth}px`);
  document.body.classList.toggle("focus-extra-blur", settings.focusBgBehavior === "blur"); document.body.classList.toggle("focus-dim", settings.focusBgBehavior === "dim");
  $("setting-hold-delay").value = settings.holdDelayMs; $("hold-delay-value").textContent = `${settings.holdDelayMs}ms`;
  $("decimals-seg").querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", Number(b.dataset.dec) === settings.decimals));
  $("setting-inspection").checked = Boolean(settings.inspection); $("setting-inspection-audio").checked = Boolean(settings.inspectionAudio);
  inspTogglePill.textContent = settings.inspection ? "Insp: 15s" : "Insp: Off"; inspTogglePill.classList.toggle("active", Boolean(settings.inspection));
  trendFlattenBtn.classList.toggle("active", Boolean(settings.trendFlatten));
  $("setting-focus-mode").checked = settings.focusMode; $("setting-focus-bg").value = settings.focusBgBehavior;
  $("setting-timer-size").value = settings.timerSize; $("timer-size-value").textContent = `${settings.timerSize}rem`;
  $("setting-scramble-size").value = settings.scrambleSize; $("scramble-size-value").textContent = `${settings.scrambleSize}rem`;
  $("setting-sidebar-width").value = settings.sidebarWidth; $("sidebar-width-value").textContent = `${settings.sidebarWidth}px`;
  $("profile-name-label").textContent = settings.profileName;
  $("profile-avatar").textContent = (settings.profileName[0] || "C").toUpperCase();
  if (timerState === "idle") timerHintText.textContent = settings.inspection ? "Tap SPACE or CLICK to inspect (15s)" : "Hold SPACE or CLICK to ready";
}

function updateSetting(k, v) { settings[k] = v; saveSettings(); applySettingsToUI(); renderAll(); }
$("setting-hold-delay").addEventListener("input", () => updateSetting("holdDelayMs", Number($("setting-hold-delay").value)));
$("decimals-seg").addEventListener("click", (e) => { const b = e.target.closest("button[data-dec]"); if (b) updateSetting("decimals", Number(b.dataset.dec)); });
$("setting-inspection").addEventListener("change", () => updateSetting("inspection", $("setting-inspection").checked));
$("setting-inspection-audio").addEventListener("change", () => updateSetting("inspectionAudio", $("setting-inspection-audio").checked));
$("setting-focus-mode").addEventListener("change", () => updateSetting("focusMode", $("setting-focus-mode").checked));
$("setting-focus-bg").addEventListener("change", () => updateSetting("focusBgBehavior", $("setting-focus-bg").value));
$("setting-timer-size").addEventListener("input", () => updateSetting("timerSize", Number($("setting-timer-size").value)));
$("setting-scramble-size").addEventListener("input", () => updateSetting("scrambleSize", Number($("setting-scramble-size").value)));
$("setting-sidebar-width").addEventListener("input", () => updateSetting("sidebarWidth", Number($("setting-sidebar-width").value)));

function pushAllToCloud() {
  scheduleCloudPush(() => ({ solves, settings, theme: activeTheme, algReps: JSON.parse(localStorage.getItem(STORAGE_ALG_REPS_KEY) || "{}") }));
}
function saveSolves() { localStorage.setItem(STORAGE_SOLVES_KEY, JSON.stringify(solves)); pushAllToCloud(); }
function saveSettings() { localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings)); pushAllToCloud(); }
function loadArray(k) { try { const p = JSON.parse(localStorage.getItem(k)); return Array.isArray(p) ? p : []; } catch { return []; } }
function loadJSON(k, fb, merge = false) { try { const p = JSON.parse(localStorage.getItem(k)); return p && typeof p === "object" && !Array.isArray(p) ? (merge ? { ...fb, ...p } : p) : fb; } catch { return fb; } }

// Isolate Adv Stats drawer from timer surface clicks/scrolls
$("adv-stats-drawer")?.addEventListener("pointerdown", (e) => e.stopPropagation());
$("adv-stats-drawer")?.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });

init();