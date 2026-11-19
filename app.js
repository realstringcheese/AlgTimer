import { EVENT_TO_PUZZLE, CSTIMER_EVENT_MAP, PREMADE_SCENES, QUICK_MOODS, COLOR_PRESETS, SCENE_PRESETS } from "./data.js";
import { initTrainer, syncMethodViews, onTrainerTabVisible, renderImprovementView, handleImprovementKeyDown, handleImprovementKeyUp, handleImprovementPointerUp, reloadTrainerReps, renderIsoCubeSVG, getCubeFromScramble } from "./trainer.js";
import { initCloud, signInGoogle, signOutGoogle, scheduleCloudPush } from "./cloud.js";

// === STORAGE KEYS & DEFAULTS ===
let randomScrambleForEvent = null;
const STORAGE_SOLVES_KEY = "algtimer_solves_v1";
const STORAGE_SETTINGS_KEY = "algtimer_settings_v2";
const STORAGE_THEME_KEY = "algtimer_theme_v1";
const STORAGE_CUSTOM_PRESETS_KEY = "algtimer_custom_presets_v1";
const STORAGE_COLOR_HISTORY_KEY = "algtimer_color_history_v1";
const STORAGE_ALG_REPS_KEY = "algtimer_alg_reps_v1";

const DEFAULT_THEME = {
  presetId: "c-amber", mood: "amber", bgMode: "color", sceneId: "hearth",
  bgColor: "#110d0a", sidebarColor: "#1a1410", cardColor: "#241b15", scrambleColor: "#211913",
  textColor: "#fef3c7", mutedColor: "#d97706", accentColor: "#f59e0b",
  holdingColor: "#ef4444", readyColor: "#84cc16",
  sidebarAlpha: 90, sidebarBlur: 12, radius: 10,
  timerFont: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  uiFont: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  timerBackdrop: false, scrambleBox: true, bgBlur: 8, bgDim: 45, bgPosY: 50, bgScale: 105,
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

// === STATE & DOM ===
let settings = loadJSON(STORAGE_SETTINGS_KEY, DEFAULT_SETTINGS, true);
let activeTheme = loadJSON(STORAGE_THEME_KEY, DEFAULT_THEME, true);
let savedPresets = loadArray(STORAGE_CUSTOM_PRESETS_KEY);
let colorHistory = loadArray(STORAGE_COLOR_HISTORY_KEY);
let solves = loadArray(STORAGE_SOLVES_KEY);

let scrambleHistory = [];
let historyIndex = -1;

let draftTheme = null, uploadedBgDataUrl = null, draftUploadedBgDataUrl = null;
let activeTab = "timer", activeStudioTab = "presets", activeColorSlot = "bgColor";
let wheelHSV = { h: 0, s: 0, v: 0.04 }, isDraggingWheel = false;
let advStatsOpen = false, advStatsViewMode = "all", showAllSolvesInList = false, greetedUid = null;

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

// === TOOLTIPS, DB & INIT ===
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
    formatTime, getEffectiveMs, showToast, switchTab, showTooltip, hideTooltip, onRepsChanged: pushAllToCloud,
  });

  currentScramble = localFallbackScramble(settings.event);
  scrambleTextEl.textContent = currentScramble; scrambleStatusEl.textContent = "Connecting WCA..."; previewModeBadge.textContent = "Loading...";
  eventSelect.value = settings.event; trendRangeSelect.value = settings.trendRange;
  applySettingsToUI(); applyThemeToDOM(activeTheme, uploadedBgDataUrl);
  drawColorWheel(); syncMethodViews(); renderAll();

  initCloud((user, info) => {
    const inBtn = $("google-signin-btn"), outBtn = $("google-signout-btn");
    if (user) {
      const name = user.displayName || (user.email ? user.email.split("@")[0] : "Cuber");
      $("cloud-status-title").textContent = name; $("cloud-status-sub").textContent = "Auto-syncing solves, alg drills & theme";
      inBtn.classList.add("hidden"); outBtn.classList.remove("hidden"); $("profile-name-label").textContent = name;
      if (user.photoURL) $("profile-avatar").innerHTML = `<img src="${user.photoURL}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      else $("profile-avatar").textContent = (name[0] || "C").toUpperCase();

      if (greetedUid !== user.uid) { greetedUid = user.uid; closeModals(); showToast(`Signed in as ${name}!`); }

      if (info?.cloudData) {
        const cSolves = Array.isArray(info.cloudData.solves) ? info.cloudData.solves : [];
        const seen = new Set(solves.map((s) => s.id)); let added = 0;
        cSolves.forEach((cs) => { if (!seen.has(cs.id)) { solves.push(cs); seen.add(cs.id); added++; } });
        if (added > 0) { solves.sort((a, b) => a.createdAt - b.createdAt); localStorage.setItem(STORAGE_SOLVES_KEY, JSON.stringify(solves)); }

        if (info.cloudData.algReps) {
          const localReps = loadJSON(STORAGE_ALG_REPS_KEY, {});
          for (const [k, arr] of Object.entries(info.cloudData.algReps)) {
            const cur = Array.isArray(localReps[k]) ? localReps[k] : [], seenR = new Set(cur.map((r) => r.createdAt));
            if (Array.isArray(arr)) arr.forEach((r) => { if (!seenR.has(r.createdAt)) cur.push(r); });
            localReps[k] = cur.sort((a, b) => a.createdAt - b.createdAt);
          }
          localStorage.setItem(STORAGE_ALG_REPS_KEY, JSON.stringify(localReps));
          reloadTrainerReps();
        }
        if (!localStorage.getItem(STORAGE_THEME_KEY) && info.cloudData.theme) {
          activeTheme = { ...DEFAULT_THEME, ...info.cloudData.theme };
          localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(activeTheme));
          applyThemeToDOM(activeTheme, uploadedBgDataUrl);
        }
        if (!localStorage.getItem(STORAGE_SETTINGS_KEY) && info.cloudData.settings) {
          settings = { ...DEFAULT_SETTINGS, ...info.cloudData.settings };
          localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
          applySettingsToUI(); syncMethodViews();
        }
        renderAll(); pushAllToCloud();
        if (info.cloudData.algStatus && !localStorage.getItem("algtimer_alg_status_v1")) {
          localStorage.setItem("algtimer_alg_status_v1", JSON.stringify(info.cloudData.algStatus));
          reloadTrainerReps();
        }
      }
    } else {
      greetedUid = null;
      $("cloud-status-title").textContent = "Cloud Sync (Off)";
      $("cloud-status-sub").textContent = info?.configured === false ? "Check cloud.js setup" : "Sign in to save solves across devices";
      inBtn.classList.remove("hidden"); outBtn.classList.add("hidden");
      $("profile-avatar").textContent = (settings.profileName[0] || "C").toUpperCase();
    }
  });

  $("google-signin-btn")?.addEventListener("click", async () => {
    try { const res = await signInGoogle(); if (res?.error) showToast(res.error); } catch (e) { showToast(e?.message || "Sign-in failed"); }
  });
  $("google-signout-btn")?.addEventListener("click", () => signOutGoogle());

  uploadedBgDataUrl = await loadUploadedBg();
  if (uploadedBgDataUrl) applyThemeToDOM(activeTheme, uploadedBgDataUrl);

  ensureScramblerLoaded().then((ok) => { if (ok) { if (timerState === "idle") loadNextScramble(settings.event); } else scrambleStatusEl.textContent = "Offline fallback (Wi-Fi)"; });
  importWithTimeout("https://cdn.cubing.net/v0/js/cubing/twisty", 12000).then(() => updateScramblePreview()).catch(() => { previewModeBadge.textContent = "Offline"; });
  customElements.whenDefined("scramble-display").then(() => updateScramblePreview());
}

function showToast(msg) { toastEl.textContent = msg; toastEl.classList.remove("hidden"); clearTimeout(toastTimeoutId); toastTimeoutId = setTimeout(() => toastEl.classList.add("hidden"), 3200); }

// === COLOR WHEEL & THEME STUDIO ===
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
  applyThemeToDOM(activeTheme, uploadedBgDataUrl); draftTheme = null; $("theme-modal").classList.add("hidden");
  pushAllToCloud(); showToast("Theme applied!");
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

// === SCRAMBLES, INSPECTION & MAIN TIMER ===
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

async function loadNextScramble(eventId, isBackwards = false) {
  scrambleStatusEl.textContent = "Generating...";
  
  // If we are moving backwards, pull from history
  if (isBackwards && historyIndex > 0) {
    historyIndex--;
    currentScramble = scrambleHistory[historyIndex];
  } 
  // If moving forwards, either pull from stack or generate new
  else if (!isBackwards && historyIndex < scrambleHistory.length - 1) {
    historyIndex++;
    currentScramble = scrambleHistory[historyIndex];
  } 
  else {
    // Generate fresh
    try {
      let r = (prefetchedScramble && prefetchedEvent === eventId) 
        ? (prefetchedScramble) : await generateScramble(eventId);
      
      currentScramble = r.text;
      scrambleHistory.push(currentScramble);
      historyIndex = scrambleHistory.length - 1;
      
      if (!r.offline) prefetchScramble(eventId);
    } catch (err) {
      currentScramble = localFallbackScramble(eventId);
    }
  }

  if (eventId === settings.event) {
    scrambleTextEl.textContent = currentScramble;
    scrambleStatusEl.textContent = "";
    updateScramblePreview();
  }
}
async function prefetchScramble(eventId) {
  try { const n = await generateScramble(eventId); if (eventId === settings.event && !n.offline) { prefetchedScramble = n; prefetchedEvent = eventId; } } catch {}
}

function updateScramblePreview() {
  const dim = settings.event === "clock" ? "2D" : settings.previewDim;
  previewModeBadge.textContent = dim;
  toggleDimBtn.textContent = settings.previewDim === "3D" ? "Switch to 2D" : "Switch to 3D";

  const host = $("preview-box") || $("scramble-player")?.parentElement;
  if (!host) return;

  if (customElements.get("scramble-display")) {
    host.innerHTML = `<scramble-display id="scramble-player" event="${settings.event}" scramble="${currentScramble || ''}" visualization="${dim}"></scramble-display>`;
  } else if (customElements.get("twisty-player")) {
    const puzzle = EVENT_TO_PUZZLE[settings.event] || "3x3x3";
    host.innerHTML = `<twisty-player id="scramble-player" puzzle="${puzzle}" visualization="${dim}" experimental-setup-alg="${currentScramble || ''}" background="none" control-panel="none" hint-facelets="none" camera-latitude-limit="none" experimental-drag-input="auto"></twisty-player>`;
  } else {
    // Instant 3D SVG preview if cdn.cubing.net is slow or blocked
    const cube = getCubeFromScramble(currentScramble || "");
    host.innerHTML = `<div style="width:100%;height:100%;display:grid;place-items:center;">${renderIsoCubeSVG(cube, 27, 105, 92, "0 0 210 185")}</div>`;
  }
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
  if (e.target.closest("button, select, input, a, .scramble-text")) return;
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

// === STATS, SPARKLINE, ADVANCED ANALYTICS & PB CELEBRATIONS ===
const getEffectiveMs = (s) => s.penalty === "DNF" ? Infinity : s.penalty === "+2" ? s.rawMs + 2000 : s.rawMs;
function formatTime(ms, dec = 2) {
  if (ms === Infinity || ms == null || Number.isNaN(ms)) return "DNF";
  const t = Math.max(0, Math.round(ms)), m = Math.floor(t / 60000), s = Math.floor((t % 60000) / 1000), r = t % 1000;
  const f = dec === 3 ? String(r).padStart(3, "0") : String(Math.floor(r / 10)).padStart(2, "0");
  return m > 0 ? `${m}:${String(s).padStart(2, "0")}.${f}` : `${s}.${f}`;
}
const formatSolve = (s, dec = 2) => s.penalty === "DNF" ? "DNF" : s.penalty === "+2" ? `${formatTime(getEffectiveMs(s), dec)}+` : formatTime(getEffectiveMs(s), dec);
function calculateTrimmedAverage(list, size) {
  if (list.length < size) return null;
  const r = list.slice(-size).map(getEffectiveMs).sort((a, b) => (a === b ? 0 : a < b ? -1 : 1)).slice(1, size - 1);
  return r.some((t) => t === Infinity) ? Infinity : r.reduce((a, t) => a + t, 0) / r.length;
}
function calculateSessionMean(list) { const v = list.map(getEffectiveMs).filter((t) => t !== Infinity); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : (list.length ? Infinity : null); }
function calculateBest(list) { const v = list.map(getEffectiveMs).filter((t) => t !== Infinity); return v.length ? Math.min(...v) : (list.length ? Infinity : null); }
const getCurrentEventSolves = () => solves.filter((s) => s.event === settings.event);
function calculateMeanOfSlice(sl) { const t = sl.map(getEffectiveMs); return t.some((x) => x === Infinity) ? Infinity : t.reduce((a, b) => a + b, 0) / t.length; }
function getBestRollingAvg(list, size, isMean = false) {
  if (list.length < size) return null;
  let best = Infinity;
  for (let i = size; i <= list.length; i++) { const val = isMean ? calculateMeanOfSlice(list.slice(i - size, i)) : calculateTrimmedAverage(list.slice(i - size, i), size); if (val !== null && val < best) best = val; }
  return best === Infinity ? null : best;
}

function checkAndCelebratePB(prevList, newSolve) {
  const nt = getEffectiveMs(newSolve); if (nt === Infinity) return;
  const full = [...prevList, newSolve], recs = [], pBest = calculateBest(prevList);
  if (pBest !== null && pBest !== Infinity && nt < pBest) recs.push(`NEW SINGLE PB! (-${formatTime(pBest - nt, settings.decimals)}s)`);
  [[5, "AO5"], [12, "AO12"], [50, "AO50"], [100, "AO100"]].forEach(([sz, lbl]) => {
    if (full.length >= sz) { const cur = calculateTrimmedAverage(full, sz), pb = getBestRollingAvg(prevList, sz); if (cur !== null && cur !== Infinity && pb !== null && cur < pb) recs.push(`NEW BEST ${lbl}! (${formatTime(cur, settings.decimals)})`); }
  });
  if (!recs.length) return;
  pbBanner.textContent = recs[0]; pbBanner.classList.remove("hidden"); clearTimeout(pbTimeoutId); pbTimeoutId = setTimeout(() => pbBanner.classList.add("hidden"), 4000);
  const ctx2 = confettiCanvas.getContext("2d"); confettiCanvas.width = window.innerWidth; confettiCanvas.height = window.innerHeight;
  const cols = [activeTheme.accentColor, activeTheme.textColor, activeTheme.readyColor, "#ffffff"], cx = confettiCanvas.width / 2, cy = confettiCanvas.height * 0.45;
  const parts = Array.from({ length: 65 }, () => { const a = Math.random() * Math.PI * 2, sp = 3 + Math.random() * 8; return { x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 3, sz: 4 + Math.random() * 4, col: cols[Math.floor(Math.random() * cols.length)], a: 1, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25 }; });
  const step = () => {
    ctx2.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); let alive = false;
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.r += p.vr; p.a -= 0.015; if (p.a > 0) { alive = true; ctx2.save(); ctx2.globalAlpha = p.a; ctx2.translate(p.x, p.y); ctx2.rotate(p.r); ctx2.fillStyle = p.col; ctx2.fillRect(-p.sz / 2, -p.sz / 2, p.sz, p.sz * 0.65); ctx2.restore(); } }
    if (alive) requestAnimationFrame(step); else ctx2.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  };
  requestAnimationFrame(step);
}

function renderSparkline(eventSolves) {
  const indexed = eventSolves.map((s, idx) => ({ num: idx + 1, ms: getEffectiveMs(s), label: formatSolve(s, settings.decimals) })).filter((d) => d.ms !== Infinity);
  const data = indexed.slice(-(settings.trendRange === "all" ? indexed.length : Number(settings.trendRange)));
  if (data.length < 2) { sparklineWrap.innerHTML = `<span class="sparkline-empty">Complete 2+ solves for graph</span>`; return; }

  let series;
  if (settings.trendFlatten) {
    const numSec = Math.min(4, data.length), bSize = data.length / numSec; series = [];
    for (let b = 0; b < numSec; b++) {
      const sI = Math.round(b * bSize), eI = Math.min(data.length, Math.round((b + 1) * bSize)), sl = data.slice(sI, Math.max(sI + 1, eI));
      const avg = sl.reduce((a, x) => a + x.ms, 0) / sl.length;
      series.push({ num: `Part ${b + 1} (#${sl[0].num}–${sl[sl.length - 1].num})`, plotMs: avg, label: `${formatTime(avg, settings.decimals)} avg` });
    }
  } else series = data.map((d) => ({ num: `#${d.num}`, plotMs: d.ms, label: d.label }));

  const rMin = Math.min(...series.map((s) => s.plotMs)), rMax = Math.max(...series.map((s) => s.plotMs)), bSpan = Math.max(200, rMax - rMin);
  const padMs = settings.trendFlatten ? Math.max(800, bSpan * 0.35) : 0, min = Math.max(0, rMin - padMs), max = rMax + padMs, span = Math.max(1, max - min);
  const w = 260, h = 98, pad = 16, clampY = (ms) => Math.max(pad, Math.min(h - pad, h - pad - ((ms - min) / span) * (h - pad * 2)));
  const coords = series.map((d, i) => ({ ...d, x: pad + (i / (series.length - 1)) * (w - pad * 2), y: clampY(d.plotMs) }));
  const poly = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");

  let trendLineSvg = "";
  if (settings.trendFlatten && coords.length >= 3) {
    const n = coords.length, sX = (n * (n - 1)) / 2, sXX = (n * (n - 1) * (2 * n - 1)) / 6, sY = coords.reduce((a, c) => a + c.plotMs, 0), sXY = coords.reduce((a, c, i) => a + i * c.plotMs, 0);
    const slp = (n * sXX - sX * sX) ? (n * sXY - sX * sY) / (n * sXX - sX * sX) : 0, icp = (sY - slp * sX) / n;
    trendLineSvg = `<line x1="${coords[0].x.toFixed(1)}" y1="${clampY(icp).toFixed(1)}" x2="${coords[n - 1].x.toFixed(1)}" y2="${clampY(icp + slp * (n - 1)).toFixed(1)}" stroke="currentColor" stroke-opacity="0.3" stroke-dasharray="4 3" stroke-width="1.4" />`;
  }

  const dotR = settings.trendFlatten ? 3.5 : (coords.length <= 40 ? 2.1 : 0), hitStep = Math.max(1, Math.floor(coords.length / 35));
  const dots = coords.map((c, i) => `
    ${dotR ? `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${dotR}" fill="currentColor" stroke="var(--card-bg-rgba)" stroke-width="1.2" opacity="0.95" />` : ""}
    ${i % hitStep === 0 || i === coords.length - 1 ? `<circle class="spark-hit" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="10" fill="transparent" data-tip="${c.num} • ${c.label}" style="cursor:pointer;" />` : ""}
  `).join("");

  sparklineWrap.innerHTML = `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="color: var(--accent-color)">${settings.trendFlatten ? `<text x="6" y="11" fill="currentColor" opacity="0.45" font-size="8" font-family="monospace">${formatTime(rMax, 1)}</text><text x="6" y="${h - 3}" fill="currentColor" opacity="0.45" font-size="8" font-family="monospace">${formatTime(rMin, 1)}</text>` : ""}${trendLineSvg}<polyline fill="none" stroke="currentColor" stroke-width="${settings.trendFlatten ? 2.2 : 1.8}" stroke-opacity="0.95" stroke-linejoin="round" points="${poly}" />${dots}</svg>`;
  sparklineWrap.querySelectorAll(".spark-hit").forEach((hit) => {
    hit.addEventListener("pointerenter", (e) => showTooltip(hit.dataset.tip, e.clientX, e.clientY));
    hit.addEventListener("pointermove", (e) => showTooltip(hit.dataset.tip, e.clientX, e.clientY));
    hit.addEventListener("pointerleave", hideTooltip);
  });
}

function renderAdvancedStats(eventSolves) {
  const dec = settings.decimals, validEntries = eventSolves.map((s, i) => ({ idx: i + 1, ms: getEffectiveMs(s), createdAt: s.createdAt })).filter((d) => d.ms !== Infinity), valid = validEntries.map((d) => d.ms);
  const dnfC = eventSolves.filter((s) => s.penalty === "DNF").length, p2C = eventSolves.filter((s) => s.penalty === "+2").length;
  advStatsSubtitle.textContent = `${eventSolves.length} solves (${valid.length} valid, ${dnfC} DNF, ${p2C} +2)`;
  if (valid.length < 2) { advStatsBody.innerHTML = `<p class="muted-text">Complete at least 2 valid solves to unlock stats.</p>`; return; }

  const mean = calculateSessionMean(eventSolves), best = calculateBest(eventSolves), worst = Math.max(...valid);
  const stdDev = Math.sqrt(valid.reduce((acc, t) => acc + (t - mean) ** 2, 0) / valid.length), consistency = Math.max(0, 100 - (stdDev / mean) * 100);

  const allB = [{ label: "0–5s", min: 0, max: 5000 }, { label: "5–10s", min: 5000, max: 10000 }, { label: "10–15s", min: 10000, max: 15000 }, { label: "15–20s", min: 15000, max: 20000 }, { label: "20–25s", min: 20000, max: 25000 }, { label: "25–30s", min: 25000, max: 30000 }, { label: "30–45s", min: 30000, max: 45000 }, { label: "45s+", min: 45000, max: Infinity }].map((b) => { const it = valid.filter((t) => t >= b.min && t < b.max); return { ...b, count: it.length, avg: it.length ? it.reduce((a, x) => a + x, 0) / it.length : null }; });
  const activeB = allB.slice(Math.max(0, allB.findIndex((b) => b.count > 0)), allB.length - [...allB].reverse().findIndex((b) => b.count > 0));
  const maxB = Math.max(...activeB.map((b) => b.count), 1);
  const bracketsHtml = activeB.map((b) => `<div class="bracket-row chart-tip-target" data-tip="${b.label}: ${b.count} solves (${Math.round((b.count / valid.length) * 100)}%)${b.avg ? ` • Avg ${formatTime(b.avg, dec)}` : ""}"><span>${b.label}</span><div class="bracket-track"><div class="bracket-fill" style="width:${Math.round((b.count / maxB) * 100)}%"></div></div><span class="bracket-val">${b.count} (${Math.round((b.count / valid.length) * 100)}%)</span></div>`).join("");

  const trajW = 360, trajH = 142, tPadL = 36, tPadR = 10, tPadT = 12, tPadB = 20, pbPts = [], rollPts = [], rWin = valid.length >= 12 ? 12 : 3;
  let rPB = Infinity;
  for (let i = 0; i < valid.length; i++) { if (valid[i] < rPB) rPB = valid[i]; pbPts.push(rPB); const sl = valid.slice(Math.max(0, i - rWin + 1), i + 1); rollPts.push(sl.reduce((a, b) => a + b, 0) / sl.length); }
  const n = valid.length, sX = (n * (n - 1)) / 2, sXX = (n * (n - 1) * (2 * n - 1)) / 6, sY = valid.reduce((a, b) => a + b, 0), sXY = valid.reduce((a, y, i) => a + i * y, 0);
  const slp10 = ((n * sXX - sX * sX) ? (n * sXY - sX * sY) / (n * sXX - sX * sX) : 0) * 10;
  const slopeText = slp10 <= -20 ? `↗ -${formatTime(Math.abs(slp10), 2)}s / 10` : slp10 >= 20 ? `↘ +${formatTime(slp10, 2)}s / 10` : "→ Steady";
  const tMin = Math.min(...pbPts, ...rollPts), tMax = Math.max(...pbPts, ...rollPts), tSpan = Math.max(1, tMax - tMin), tMid = (tMin + tMax) / 2;
  const tx = (i) => tPadL + (i / (n - 1)) * (trajW - tPadL - tPadR), ty = (v) => tPadT + (1 - (v - tMin) / tSpan) * (trajH - tPadT - tPadB);
  const trajHits = []; for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 24))) trajHits.push(`<circle class="chart-tip-target" cx="${tx(i).toFixed(1)}" cy="${ty(rollPts[i]).toFixed(1)}" r="7" fill="transparent" data-tip="Solve #${validEntries[i].idx} • Ao${rWin}: ${formatTime(rollPts[i], dec)} • PB: ${formatTime(pbPts[i], dec)}" style="cursor:crosshair"/>`);

  const hB = Array.from({ length: 24 }, (_, hr) => ({ hr, sum: 0, count: 0, best: Infinity }));
  validEntries.forEach((e) => { const hr = new Date(e.createdAt).getHours(); hB[hr].sum += e.ms; hB[hr].count++; if (e.ms < hB[hr].best) hB[hr].best = e.ms; });
  const actH = hB.filter((h) => h.count > 0), maxHC = Math.max(...actH.map((h) => h.count), 1), fastH = [...actH].sort((a, b) => (a.sum / a.count) - (b.sum / b.count))[0];
  const fmtHr = (hr) => hr === 0 ? "12a" : hr < 12 ? `${hr}a` : hr === 12 ? "12p" : `${hr - 12}p`;
  const hourlyHtml = actH.map((h) => `<div class="tod-col ${fastH && h.hr === fastH.hr ? "best" : ""} chart-tip-target" data-tip="${fmtHr(h.hr)}: ${h.count} solves • ${formatTime(h.sum / h.count, dec)} avg • Best ${formatTime(h.best, dec)}"><span class="tod-time">${h.count}</span><div class="tod-bar-wrap"><div class="tod-bar" style="height:${Math.max(14, Math.round((h.count / maxHC) * 100))}%"></div></div><span class="tod-lbl">${fmtHr(h.hr)}</span></div>`).join("");

  const dayMap = new Map();
  validEntries.forEach((e) => { const d = new Date(e.createdAt), k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, lbl = d.toLocaleDateString(undefined, { month: "short", day: "numeric" }); if (!dayMap.has(k)) dayMap.set(k, { label: lbl, times: [] }); dayMap.get(k).times.push(e.ms); });
  const days = [...dayMap.values()].slice(-12), dAvgs = days.map((d) => d.times.reduce((a, b) => a + b, 0) / d.times.length), minDA = Math.min(...dAvgs), maxDA = Math.max(...dAvgs);
  const paceTilesHtml = days.map((d, idx) => { const avg = dAvgs[idx], norm = maxDA > minDA ? 1 - (avg - minDA) / (maxDA - minDA) : 0.7; return `<div class="pace-tile chart-tip-target" data-tip="${d.label}: ${d.times.length} solves • ${formatTime(avg, dec)} avg • Best ${formatTime(Math.min(...d.times), dec)}"><span class="pace-top">${d.label}</span><strong class="pace-main">${formatTime(avg, 2)}</strong><span class="pace-sub">${d.times.length}x</span><div class="pace-bar" style="width:${Math.round(25 + norm * 75)}%; opacity:${(0.35 + norm * 0.65).toFixed(2)}"></div></div>`; }).join("");

  const cSize = valid.length >= 40 ? 10 : valid.length >= 15 ? 5 : 2, chunks = [];
  for (let i = 0; i + cSize <= valid.length; i += cSize) { const sl = valid.slice(i, i + cSize), cm = sl.reduce((a, b) => a + b, 0) / sl.length, cs = Math.sqrt(sl.reduce((a, t) => a + (t - cm) ** 2, 0) / sl.length); chunks.push({ label: `#${i + 1}–${i + cSize}`, mean: cm, sd: cs }); }
  let scatterSvg = `<p class="muted-text">Need ${cSize * 2}+ solves for scatter plot</p>`;
  if (chunks.length >= 2) {
    const sw = 260, sh = 142, sL = 32, sR = 10, sT = 12, sB = 22, minM = Math.min(...chunks.map((c) => c.mean)), maxM = Math.max(...chunks.map((c) => c.mean)), minS = Math.min(...chunks.map((c) => c.sd)), maxS = Math.max(...chunks.map((c) => c.sd)), spM = Math.max(1, maxM - minM), spS = Math.max(1, maxS - minS);
    const sx = (m) => sL + ((m - minM) / spM) * (sw - sL - sR), sy = (s) => sh - sB - ((s - minS) / spS) * (sh - sT - sB), avgCM = chunks.reduce((a, c) => a + c.mean, 0) / chunks.length, avgCS = chunks.reduce((a, c) => a + c.sd, 0) / chunks.length;
    const dots = chunks.map((c, idx) => `<circle class="chart-tip-target" cx="${sx(c.mean).toFixed(1)}" cy="${sy(c.sd).toFixed(1)}" r="${idx === chunks.length - 1 ? 4.8 : 3.2}" fill="var(--accent-color)" opacity="${(0.3 + (idx / (chunks.length - 1)) * 0.7).toFixed(2)}" stroke="${idx === chunks.length - 1 ? "#fff" : "none"}" stroke-width="1.2" data-tip="${c.label}: ${formatTime(c.mean, dec)} avg • σ ${formatTime(c.sd, dec)}s" style="cursor:pointer"/>`).join("");
    scatterSvg = `<svg viewBox="0 0 ${sw} ${sh}" width="100%" height="134"><line x1="${sL}" y1="${sy(avgCS).toFixed(1)}" x2="${sw - sR}" y2="${sy(avgCS).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/><line x1="${sx(avgCM).toFixed(1)}" y1="${sT}" x2="${sx(avgCM).toFixed(1)}" y2="${sh - sB}" stroke="var(--border-color)" stroke-dasharray="3 3"/><line x1="${sL}" y1="${sh - sB}" x2="${sw - sR}" y2="${sh - sB}" stroke="var(--border-strong)"/><line x1="${sL}" y1="${sT}" x2="${sL}" y2="${sh - sB}" stroke="var(--border-strong)"/><text x="4" y="${sT + 6}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(maxS, 1)}σ</text><text x="4" y="${sh - sB}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(minS, 1)}σ</text><text x="${sL}" y="${sh - 6}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(minM, 1)}s</text><text x="${sw - sR - 26}" y="${sh - 6}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(maxM, 1)}s</text><text x="${sL + 4}" y="${sT + 8}" fill="var(--accent-color)" opacity="0.65" font-size="7" font-family="monospace">← Fast &amp; Steady</text>${dots}</svg>`;
  }

  const sorted = [...valid].sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)], iqr = sorted.length >= 4 ? sorted[Math.floor(sorted.length * 0.75)] - sorted[Math.floor(sorted.length * 0.25)] : null, subCount = valid.filter((t) => t <= settings.goalMs).length;
  let curSt = 0, bestSt = 0; eventSolves.forEach((s) => { if (getEffectiveMs(s) <= settings.goalMs) { curSt++; if (curSt > bestSt) bestSt = curSt; } else curSt = 0; });
  const fmt = (v) => (v === null ? "-" : formatTime(v, dec)), mo3 = eventSolves.length >= 3 ? calculateMeanOfSlice(eventSolves.slice(-3)) : null;
  const rows = [
    ["Single (PB)", formatSolve(eventSolves.slice(-1)[0], dec), fmt(best), `Worst: ${fmt(worst)} • Spread: ${formatTime(worst - best, dec)}`],
    ["Mean of 3 (Mo3)", fmt(mo3), fmt(getBestRollingAvg(eventSolves, 3, true)), `Median: ${fmt(median)}`],
    ["Average of 5 (Ao5)", fmt(calculateTrimmedAverage(eventSolves, 5)), fmt(getBestRollingAvg(eventSolves, 5)), `Sub-${formatTime(settings.goalMs, 2)}: ${Math.round((subCount / valid.length) * 100)}% (${subCount}/${valid.length})`],
    ["Average of 12 (Ao12)", fmt(calculateTrimmedAverage(eventSolves, 12)), fmt(getBestRollingAvg(eventSolves, 12)), `Goal Streak: ${bestSt} solves (current ${curSt})`],
    ["Ao25 / Ao50", `${fmt(calculateTrimmedAverage(eventSolves, 25))} / ${fmt(calculateTrimmedAverage(eventSolves, 50))}`, `${fmt(getBestRollingAvg(eventSolves, 25))} / ${fmt(getBestRollingAvg(eventSolves, 50))}`, `Std Dev (σ): ${formatTime(stdDev, dec)}s`],
    ["Average of 100 (Ao100)", fmt(calculateTrimmedAverage(eventSolves, 100)), fmt(getBestRollingAvg(eventSolves, 100)), `Consistency: ${consistency.toFixed(1)}% • IQR: ${iqr ? formatTime(iqr, dec) + "s" : "-"}`],
    ["Session Overall", fmt(mean), fmt(best), `Total Time: ${Math.floor(valid.reduce((a, b) => a + b, 0) / 60000)}m • Valid: ${valid.length}`],
  ];

  const jumpHtml = `<div style="display:flex; justify-content:space-between; align-items:center; padding:0.15rem 0.2rem;"><span class="muted-text" style="font-size:0.75rem;">Showing charts &amp; records</span><button id="jump-to-table-btn" class="btn-text" type="button" style="color:var(--accent-color); font-weight:700; font-size:0.76rem;">↓ Jump to Records Table</button></div>`;
  const chartsHtml = `
    <div class="charts-grid-2">
      <div class="chart-card"><div class="chart-title-row"><span>Time Brackets</span><small>${valid.length} valid</small></div><div class="bracket-list">${bracketsHtml}</div></div>
      <div class="chart-card"><div class="chart-title-row"><span>Improvement Trajectory</span><small>${slopeText}</small></div><svg viewBox="0 0 ${trajW} ${trajH}" width="100%" height="134" style="color:var(--accent-color)"><line x1="${tPadL}" y1="${ty(tMax).toFixed(1)}" x2="${trajW - tPadR}" y2="${ty(tMax).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/><line x1="${tPadL}" y1="${ty(tMid).toFixed(1)}" x2="${trajW - tPadR}" y2="${ty(tMid).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/><line x1="${tPadL}" y1="${ty(tMin).toFixed(1)}" x2="${trajW - tPadR}" y2="${ty(tMin).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/><polyline fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="4 3" stroke-width="1.4" points="${pbPts.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ")}" /><polyline fill="none" stroke="currentColor" stroke-width="2" points="${rollPts.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ")}" /><text x="2" y="${ty(tMax) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${formatTime(tMax, 1)}</text><text x="2" y="${ty(tMid) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${formatTime(tMid, 1)}</text><text x="2" y="${ty(tMin) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${formatTime(tMin, 1)}</text><text x="${tPadL}" y="${trajH - 4}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">#${validEntries[0].idx}</text><text x="${trajW - tPadR - 24}" y="${trajH - 4}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">#${validEntries[n - 1].idx}</text>${trajHits.join("")}</svg><small class="muted-text" style="font-size:0.7rem;">Solid = Rolling Ao${rWin} • Dashed = Single PB Staircase</small></div>
    </div>
    <div class="charts-grid-3">
      <div class="chart-card"><div class="chart-title-row"><span>Hourly Volume &amp; Speed</span><small>Fastest: ${fastH ? `${fmtHr(fastH.hr)} (${formatTime(fastH.sum / fastH.count, 2)})` : "-"}</small></div><div class="tod-grid" style="grid-template-columns: repeat(${actH.length}, minmax(24px, 1fr))">${hourlyHtml}</div></div>
      <div class="chart-card"><div class="chart-title-row"><span>Daily Pace Matrix</span><small>Last 12 active days</small></div><div class="pace-grid">${paceTilesHtml}</div></div>
      <div class="chart-card"><div class="chart-title-row"><span>Speed vs Consistency</span><small>${cSize}-solve blocks</small></div>${scatterSvg}</div>
    </div>
  `;
  const tableHtml = `<div id="stats-records-table-card" class="records-table-wrap"><div class="panel-header" style="padding:0.75rem 1rem; border-bottom:1px solid var(--border-color);"><span>Session Records &amp; Rolling Averages</span><span class="muted-text">${valid.length} solves calculated</span></div><table class="records-table"><thead><tr><th>Metric</th><th>Current</th><th>Best Ever</th><th>Details</th></tr></thead><tbody>${rows.map(([m, c, b, note]) => `<tr><td><strong>${m}</strong></td><td class="num">${c}</td><td class="num">${b}</td><td style="color:var(--text-secondary)">${note}</td></tr>`).join("")}</tbody></table></div>`;

  advStatsBody.innerHTML = advStatsViewMode === "table" ? tableHtml : advStatsViewMode === "charts" ? chartsHtml : (jumpHtml + chartsHtml + tableHtml);

  $("jump-to-table-btn")?.addEventListener("click", () => $("stats-records-table-card")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  $("adv-view-tabs")?.querySelectorAll(".seg-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.sview === advStatsViewMode);
    btn.onclick = () => { advStatsViewMode = btn.dataset.sview; renderAdvancedStats(eventSolves); };
  });
  advStatsBody.querySelectorAll(".chart-tip-target").forEach((el) => {
    el.addEventListener("pointerenter", (e) => showTooltip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener("pointermove", (e) => showTooltip(el.dataset.tip, e.clientX, e.clientY));
    el.addEventListener("pointerleave", hideTooltip);
  });
}

function renderGoal(ao5) {
  goalTargetLabel.textContent = `Target: Sub-${formatTime(settings.goalMs, 2)}`;
  if (ao5 === null) { goalCurrentLabel.textContent = "Ao5: -"; goalFill.style.width = "0%"; return; }
  if (ao5 === Infinity) { goalCurrentLabel.textContent = "Ao5: DNF"; goalFill.style.width = "10%"; return; }
  goalCurrentLabel.textContent = `Ao5: ${formatTime(ao5, settings.decimals)}`;
  goalFill.style.width = `${Math.min(100, Math.max(12, Math.round((settings.goalMs / ao5) * 100)))}%`;
}

function renderAll() {
  const eventSolves = getCurrentEventSolves(), dec = settings.decimals;
  const best = calculateBest(eventSolves), ao5 = calculateTrimmedAverage(eventSolves, 5), ao12 = calculateTrimmedAverage(eventSolves, 12), mean = calculateSessionMean(eventSolves);
  statBestEl.textContent = best === null ? "-" : formatTime(best, dec); statAo5El.textContent = ao5 === null ? "-" : formatTime(ao5, dec);
  statAo12El.textContent = ao12 === null ? "-" : formatTime(ao12, dec); statMeanEl.textContent = mean === null ? "-" : formatTime(mean, dec);
  statCountEl.textContent = String(eventSolves.length);
  topbarEventPill.textContent = EVENT_TO_PUZZLE[settings.event] || settings.event.toUpperCase();
  topbarAo5Pill.textContent = ao5 === null ? "Ao5: -" : `Ao5: ${formatTime(ao5, dec)}`;

  renderSparkline(eventSolves); renderGoal(ao5);
  const vMs = eventSolves.map(getEffectiveMs).filter((t) => t !== Infinity);
  advStatsTeaser.textContent = (vMs.length >= 2 && mean !== null && mean !== Infinity) ? `• σ ${formatTime(Math.sqrt(vMs.reduce((a, t) => a + (t - mean) ** 2, 0) / vMs.length), dec)}s` : "";
  if (advStatsOpen) renderAdvancedStats(eventSolves);

  const latest = eventSolves[eventSolves.length - 1];
  if (latest && !["running", "holding", "ready", "inspecting"].includes(timerState)) {
    lastSolveActions.classList.remove("hidden"); lastPlus2Btn.classList.toggle("active", latest.penalty === "+2"); lastDnfBtn.classList.toggle("active", latest.penalty === "DNF");
    if (timerState === "idle") timerDisplay.textContent = formatSolve(latest, dec);
  } else {
    lastSolveActions.classList.add("hidden"); if (timerState === "idle") timerDisplay.textContent = formatTime(0, dec);
  }

  const startIdx = showAllSolvesInList ? 0 : Math.max(0, eventSolves.length - 100), htmlRows = [];
  for (let i = eventSolves.length - 1; i >= startIdx; i--) {
    const s = eventSolves[i];
    htmlRows.push(`<li class="solve-item" data-id="${s.id}"><span class="solve-index">${i + 1}.</span><span class="solve-time">${formatSolve(s, dec)}</span><div class="solve-item-actions"><button class="mini-btn ${s.penalty === "+2" ? "active" : ""}" data-act="+2" type="button">+2</button><button class="mini-btn ${s.penalty === "DNF" ? "active" : ""}" data-act="DNF" type="button">DNF</button><button class="mini-btn" data-act="del" type="button">×</button></div></li>`);
  }
  if (startIdx > 0) htmlRows.push(`<button id="show-all-btn" class="btn-text full-width" style="padding:0.5rem 0;" type="button">Load all ${eventSolves.length} solves</button>`);
  solveListEl.innerHTML = htmlRows.join("");
  if (activeTab === "improvement") renderImprovementView();
}

solveListEl.addEventListener("click", (e) => {
  if (e.target.id === "show-all-btn") { showAllSolvesInList = true; renderAll(); return; }
  const li = e.target.closest("li[data-id]"); if (!li) return;
  const id = li.dataset.id, btn = e.target.closest("button[data-act]");
  if (btn) { e.stopPropagation(); if (btn.dataset.act === "+2") togglePenalty(id, "+2"); if (btn.dataset.act === "DNF") togglePenalty(id, "DNF"); if (btn.dataset.act === "del") deleteSolve(id); return; }
  openSolveModal(id);
});
advStatsToggle.addEventListener("click", () => { advStatsToggle.blur(); advStatsOpen = !advStatsOpen; if (advStatsOpen) renderAdvancedStats(getCurrentEventSolves()); advStatsDrawer.classList.toggle("hidden", !advStatsOpen); });
closeAdvStatsBtn.addEventListener("click", () => { advStatsOpen = false; advStatsDrawer.classList.add("hidden"); });
advStatsDrawer?.addEventListener("pointerdown", (e) => e.stopPropagation());
advStatsDrawer?.addEventListener("wheel", (e) => e.stopPropagation(), { passive: true });

// === NAVIGATION, IMPORT/EXPORT, SETTINGS & PROFILE ===
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
  scheduleCloudPush(() => ({
    solves, settings, theme: activeTheme,
    algReps: loadJSON(STORAGE_ALG_REPS_KEY, {}),
    algStatus: loadJSON("algtimer_alg_status_v1", {}),
  }));
}
function saveSolves() { localStorage.setItem(STORAGE_SOLVES_KEY, JSON.stringify(solves)); pushAllToCloud(); }
function saveSettings() { localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings)); pushAllToCloud(); }
function loadArray(k) { try { const p = JSON.parse(localStorage.getItem(k)); return Array.isArray(p) ? p : []; } catch { return []; } }
function loadJSON(k, fb, merge = false) { try { const p = JSON.parse(localStorage.getItem(k)); return p && typeof p === "object" && !Array.isArray(p) ? (merge ? { ...fb, ...p } : p) : fb; } catch { return fb; } }

window.addEventListener("keydown", (e) => {
  if (isModalOpen() || activeTab !== "timer") return;
  if (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "SELECT") return;

  if (e.code === "ArrowRight") {
    e.preventDefault();
    if (timerState === "idle" || timerState === "stopping") {
      loadNextScramble(settings.event, false); // Go Forward
    }
  } else if (e.code === "ArrowLeft") {
    e.preventDefault();
    if (timerState === "idle" || timerState === "stopping") {
      if (historyIndex > 0) {
        loadNextScramble(settings.event, true); // Go Back
      } else {
        showToast("No previous scramble");
      }
    }
  }
});

// === SECTION A12: KEYBOARD SHORTCUTS ===
window.addEventListener("keydown", (e) => {
  // Only allow when timer is idle (not solving) and no modals are open
  if (isModalOpen() || timerState !== "idle" || activeTab !== "timer") return;
  if (document.activeElement.tagName === "INPUT") return;

  const eventSolves = getCurrentEventSolves();
  const latest = eventSolves[eventSolves.length - 1];
  if (!latest) return;

  // DNF (press 'd')
  if (e.key.toLowerCase() === 'd') {
    e.preventDefault();
    togglePenalty(latest.id, "DNF");
    showToast(latest.penalty === "DNF" ? "DNF applied" : "Penalty removed");
  }

  // +2 (press '+' or '2')
  if (e.key === '+' || e.key === '2') {
    e.preventDefault();
    togglePenalty(latest.id, "+2");
    showToast(latest.penalty === "+2" ? "+2 applied" : "Penalty removed");
  }
});

init();