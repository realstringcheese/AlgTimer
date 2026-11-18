import {
  EVENT_TO_PUZZLE, CSTIMER_EVENT_MAP, PREMADE_SCENES,
  QUICK_MOODS, COLOR_PRESETS, SCENE_PRESETS, METHOD_GUIDES, METHOD_ALGS,
} from "./data.js";

// === SECTION A1: STORAGE KEYS & DEFAULTS ===
let randomScrambleForEvent = null;

const STORAGE_SOLVES_KEY = "algtimer_solves_v1";
const STORAGE_SETTINGS_KEY = "algtimer_settings_v2";
const STORAGE_THEME_KEY = "algtimer_theme_v1";
const STORAGE_CUSTOM_PRESETS_KEY = "algtimer_custom_presets_v1";
const STORAGE_COLOR_HISTORY_KEY = "algtimer_color_history_v1";
const STORAGE_LEARNED_KEY = "algtimer_learned_v1";

const DEFAULT_THEME = {
  presetId: "c-mono", mood: "mono", bgMode: "color", sceneId: "mountains",
  bgColor: "#0a0a0a", sidebarColor: "#121212", cardColor: "#1b1b1b", scrambleColor: "#141414",
  textColor: "#f5f5f5", mutedColor: "#9a9a9a", accentColor: "#f5f5f5",
  holdingColor: "#ef4444", readyColor: "#22c55e",
  sidebarAlpha: 90, sidebarBlur: 14, radius: 10,
  timerFont: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  uiFont: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  timerBackdrop: false, scrambleBox: false,
  bgBlur: 8, bgDim: 45, bgPosY: 50, bgScale: 105,
};

const COLOR_SLOTS = [
  { key: "bgColor", label: "Main Background" },
  { key: "sidebarColor", label: "Sidebars & Topbar" },
  { key: "scrambleColor", label: "Scramble Box" },
  { key: "cardColor", label: "Cards & Panels" },
  { key: "textColor", label: "Primary Font" },
  { key: "mutedColor", label: "Muted Font" },
  { key: "accentColor", label: "Accent Color" },
  { key: "holdingColor", label: "Hold State" },
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
let learnedAlgs = loadArray(STORAGE_LEARNED_KEY);

let draftTheme = null;
let uploadedBgDataUrl = null;
let draftUploadedBgDataUrl = null;

let activeTab = "timer";
let activeStudioTab = "presets";
let activeColorSlot = "bgColor";
let wheelHSV = { h: 0, s: 0, v: 0.04 };
let isDraggingWheel = false;

let activeAlgFilter = "ALL";
let selectedAlgId = null;
let selectedStageId = null;
let advStatsOpen = false;

let timerState = "idle";
let activeTrigger = null;
let holdTimeoutId = null;
let startTime = 0;
let rafId = null;
let suppressNextClick = false;
let toastTimeoutId = null;
let pbTimeoutId = null;

let currentScramble = "";
let prefetchedScramble = null;
let prefetchedEvent = null;
let selectedSolveId = null;
let scramblerLoadPromise = null;

const $ = (id) => document.getElementById(id);
const appEl = $("app");
const bgMediaEl = $("bg-media");
const bgDimEl = $("bg-dim");
const confettiCanvas = $("confetti-canvas");
const navTabs = document.querySelectorAll(".nav-tab");
const guideNavTab = $("guide-nav-tab");
const viewTimer = $("view-timer");
const viewAlgs = $("view-algs");
const viewGuide = $("view-guide");

const topbarEventPill = $("topbar-event-pill");
const topbarAo5Pill = $("topbar-ao5-pill");
const eventSelect = $("event-select");

const scramblePlayer = $("scramble-player");
const previewModeBadge = $("preview-mode-badge");
const toggleDimBtn = $("toggle-dim-btn");
const resetCamBtn = $("reset-cam-btn");
const trendFlattenBtn = $("trend-flatten-btn");
const trendRangeSelect = $("trend-range-select");
const sparklineWrap = $("sparkline-wrap");
const editGoalBtn = $("edit-goal-btn");
const goalTargetLabel = $("goal-target-label");
const goalCurrentLabel = $("goal-current-label");
const goalFill = $("goal-fill");

const scrambleArea = $("scramble-area");
const scrambleTextEl = $("scramble-text");
const scrambleStatusEl = $("scramble-status");
const newScrambleBtn = $("new-scramble-btn");
const copyScrambleBtn = $("copy-scramble-btn");
const inspTogglePill = $("insp-toggle-pill");

const timerZone = $("timer-zone");
const timerCore = $("timer-core");
const pbBanner = $("pb-banner");
const timerDisplay = $("timer-display");
const timerHintText = $("timer-hint-text");

const lastSolveActions = $("last-solve-actions");
const lastPlus2Btn = $("last-plus2-btn");
const lastDnfBtn = $("last-dnf-btn");
const lastDelBtn = $("last-del-btn");
const advStatsToggle = $("adv-stats-toggle");
const advStatsTeaser = $("adv-stats-teaser");
const advStatsDrawer = $("adv-stats-drawer");
const advStatsSubtitle = $("adv-stats-subtitle");
const advStatsBody = $("adv-stats-body");
const closeAdvStatsBtn = $("close-adv-stats-btn");

const statBestEl = $("stat-best");
const statAo5El = $("stat-ao5");
const statAo12El = $("stat-ao12");
const statMeanEl = $("stat-mean");
const statCountEl = $("stat-count");
const solveListEl = $("solve-list");
const importBtn = $("import-btn");
const settingsImportBtn = $("settings-import-btn");
const importFileInput = $("import-file-input");
const exportBtn = $("export-btn");
const clearSessionBtn = $("clear-session-btn");

const algPageTitle = $("alg-page-title");
const algGrid = $("alg-grid");
const algFilterPills = $("alg-filter-pills");
const algPlayer = $("alg-player");
const algSimTitle = $("alg-sim-title");
const algSimCat = $("alg-sim-cat");
const algSimMoves = $("alg-sim-moves");
const algSimTip = $("alg-sim-tip");

const guidePageTitle = $("guide-page-title");
const guidePageSubtitle = $("guide-page-subtitle");
const stageList = $("stage-list");
const stagePlayer = $("stage-player");
const stageSimTitle = $("stage-sim-title");
const stageSimBadge = $("stage-sim-badge");

const themeBtn = $("theme-btn");
const themeModal = $("theme-modal");
const closeThemeBtn = $("close-theme-btn");
const cancelThemeBtn = $("cancel-theme-btn");
const applyThemeBtn = $("apply-theme-btn");
const saveCustomPresetBtn = $("save-custom-preset-btn");
const accentPillsWrap = $("accent-pills");
const activeMoodLabel = $("active-mood-label");
const studioTabs = document.querySelectorAll(".studio-tab");
const studioPanePresets = $("studio-pane-presets");
const studioPaneCustom = $("studio-pane-custom");
const themeTimerBox = $("theme-timer-box");
const themeScrambleBox = $("theme-scramble-box");
const colorPresetsGrid = $("color-presets-grid");
const scenePresetsGrid = $("scene-presets-grid");
const savedPresetsSection = $("saved-presets-section");
const savedPresetsGrid = $("saved-presets-grid");
const sourceTabs = document.querySelectorAll(".source-tab");
const bgSourceScene = $("bg-source-scene");
const bgSourceUpload = $("bg-source-upload");
const bgSlidersPanel = $("bg-sliders-panel");
const galleryGrid = $("gallery-grid");
const uploadBgBtn = $("upload-bg-btn");
const uploadStatusText = $("upload-status-text");
const bgImageInput = $("bg-image-input");
const themeBgBlur = $("theme-bg-blur");
const bgBlurVal = $("bg-blur-val");
const themeBgDim = $("theme-bg-dim");
const bgDimVal = $("bg-dim-val");
const themeBgPosY = $("theme-bg-posy");
const bgPosYVal = $("bg-posy-val");
const themeBgScale = $("theme-bg-scale");
const bgScaleVal = $("bg-scale-val");
const colorSlotsWrap = $("color-slots");
const wheelSlotName = $("wheel-slot-name");
const wheelHexBadge = $("wheel-hex-badge");
const wheelWrap = $("wheel-wrap");
const wheelCanvas = $("color-wheel-canvas");
const wheelCursor = $("wheel-cursor");
const wheelValSlider = $("wheel-val-slider");
const wheelHexInput = $("wheel-hex-input");
const colorHistorySwatches = $("color-history-swatches");
const clearHistoryBtn = $("clear-history-btn");
const themeSidebarAlpha = $("theme-sidebar-alpha");
const sidebarAlphaVal = $("sidebar-alpha-val");
const themeSidebarBlur = $("theme-sidebar-blur");
const sidebarBlurVal = $("sidebar-blur-val");
const themeRadius = $("theme-radius");
const radiusVal = $("radius-val");
const themeTimerFont = $("theme-timer-font");
const themeUiFont = $("theme-ui-font");

const settingsModal = $("settings-modal");
const settingsBtn = $("settings-btn");
const closeSettingsBtn = $("close-settings-btn");
const holdDelayInput = $("setting-hold-delay");
const holdDelayValue = $("hold-delay-value");
const decimalsSeg = $("decimals-seg");
const inspEnabledInput = $("setting-inspection");
const inspAudioInput = $("setting-inspection-audio");
const focusModeInput = $("setting-focus-mode");
const focusBgSelect = $("setting-focus-bg");
const timerSizeInput = $("setting-timer-size");
const timerSizeValue = $("timer-size-value");
const scrambleSizeInput = $("setting-scramble-size");
const scrambleSizeValue = $("scramble-size-value");
const sidebarWidthInput = $("setting-sidebar-width");
const sidebarWidthValue = $("sidebar-width-value");

const profileBtn = $("profile-btn");
const profileModal = $("profile-modal");
const closeProfileBtn = $("close-profile-btn");
const profileAvatar = $("profile-avatar");
const profileNameLabel = $("profile-name-label");
const profileNameInput = $("profile-name-input");
const profileMethodSelect = $("profile-method-select");
const saveProfileBtn = $("save-profile-btn");

const solveModal = $("solve-modal");
const closeSolveModalBtn = $("close-solve-modal-btn");
const solveModalTime = $("solve-modal-time");
const solveModalMeta = $("solve-modal-meta");
const solveModalScramble = $("solve-modal-scramble");
const modalPlus2Btn = $("modal-plus2-btn");
const modalDnfBtn = $("modal-dnf-btn");
const modalDelBtn = $("modal-del-btn");
const toastEl = $("toast");

window.addEventListener("error", (ev) => {
  if (scrambleStatusEl) scrambleStatusEl.textContent = `App error: ${ev.message}`;
});

// === SECTION A3: INITIALIZATION & INDEXEDDB ===
function openBgDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("algtimer_assets", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("wallpapers");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveUploadedBg(dataUrl) {
  try {
    const db = await openBgDB();
    db.transaction("wallpapers", "readwrite").objectStore("wallpapers").put(dataUrl, "custom_bg");
  } catch (e) { console.warn(e); }
}

async function loadUploadedBg() {
  try {
    const db = await Promise.race([
      openBgDB(),
      new Promise((_, reject) => setTimeout(() => reject(new Error("IDB timeout")), 1000)),
    ]);
    return await new Promise((resolve) => {
      const req = db.transaction("wallpapers", "readonly").objectStore("wallpapers").get("custom_bg");
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch { return null; }
}

function importWithTimeout(url, ms = 8000) {
  return Promise.race([
    import(url),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Network timeout")), ms)),
  ]);
}

function ensureScramblerLoaded() {
  if (randomScrambleForEvent) return Promise.resolve(true);
  if (!scramblerLoadPromise) {
    scramblerLoadPromise = importWithTimeout("https://cdn.cubing.net/v0/js/cubing/scramble", 8000)
      .then((mod) => {
        randomScrambleForEvent = mod.randomScrambleForEvent;
        if (timerState === "idle" && scrambleStatusEl.textContent.includes("Offline")) {
          loadNextScramble(settings.event);
        }
        return true;
      })
      .catch((err) => {
        console.warn("WCA scrambler unreachable:", err);
        scramblerLoadPromise = null;
        return false;
      });
  }
  return scramblerLoadPromise;
}

async function init() {
  try {
    currentScramble = localFallbackScramble(settings.event);
    scrambleTextEl.textContent = currentScramble;
    scrambleStatusEl.textContent = "Connecting WCA...";
    previewModeBadge.textContent = "Loading...";

    eventSelect.value = settings.event;
    trendRangeSelect.value = settings.trendRange;
    applySettingsToUI();
    applyThemeToDOM(activeTheme, uploadedBgDataUrl);
    drawColorWheel();
    syncMethodViews();
    renderAll();

    uploadedBgDataUrl = await loadUploadedBg();
    if (uploadedBgDataUrl) applyThemeToDOM(activeTheme, uploadedBgDataUrl);

    ensureScramblerLoaded().then((ok) => {
      if (ok) {
        if (timerState === "idle") loadNextScramble(settings.event);
      } else {
        scrambleStatusEl.textContent = "Offline fallback (Wi-Fi)";
      }
    });

    importWithTimeout("https://cdn.cubing.net/v0/js/cubing/twisty", 12000)
      .then(() => updateScramblePreview())
      .catch((err) => {
        console.warn("3D preview offline:", err);
        previewModeBadge.textContent = "Offline";
      });
  } catch (err) {
    console.error("Init error:", err);
    if (scrambleStatusEl) scrambleStatusEl.textContent = `Init error: ${err.message}`;
  }
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove("hidden");
  clearTimeout(toastTimeoutId);
  toastTimeoutId = setTimeout(() => toastEl.classList.add("hidden"), 3200);
}

// === SECTION A4: COLOR WHEEL & THEME ENGINE ===
function hexToRgb(hex) {
  const c = (hex || "#000000").replace("#", "");
  const full = c.length === 3 ? c.split("").map((x) => x + x).join("") : c;
  const num = parseInt(full, 16);
  return Number.isNaN(num) ? { r: 10, g: 10, b: 10 } : { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
const hexToRgba = (hex, a) => { const { r, g, b } = hexToRgb(hex); return `rgba(${r}, ${g}, ${b}, ${a})`; };
const isLightColor = (hex) => { const { r, g, b } = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62; };

function hsvToHex(h, s, v) {
  const f = (n) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(Math.min(k, 4 - k, 1), 0); };
  const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function hexToHsv(hex) {
  const { r: r0, g: g0, b: b0 } = hexToRgb(hex);
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s: max === 0 ? 0 : d / max, v: max };
}

function drawColorWheel() {
  const ctx = wheelCanvas.getContext("2d"), size = wheelCanvas.width, c = size / 2, r = c - 2;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - c, dy = y - c, dist = Math.hypot(dx, dy), idx = (y * size + x) * 4;
      if (dist <= r) {
        const { r: cr, g: cg, b: cb } = hexToRgb(hsvToHex((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, dist / r, 1));
        img.data[idx] = cr; img.data[idx + 1] = cg; img.data[idx + 2] = cb; img.data[idx + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function syncWheelToHex(hex) {
  wheelHSV = hexToHsv(hex);
  const c = wheelCanvas.width / 2, r = c - 2, rad = (wheelHSV.h * Math.PI) / 180, d = wheelHSV.s * r;
  wheelCursor.style.left = `${c + Math.cos(rad) * d}px`;
  wheelCursor.style.top = `${c + Math.sin(rad) * d}px`;
  wheelValSlider.value = Math.round(wheelHSV.v * 100);
  wheelHexInput.value = hex.toUpperCase();
  wheelHexBadge.textContent = hex.toUpperCase();
}

function pushColorHistory(hex) {
  const upper = hex.toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(upper)) return;
  colorHistory = [upper, ...colorHistory.filter((c) => c !== upper)].slice(0, 14);
  localStorage.setItem(STORAGE_COLOR_HISTORY_KEY, JSON.stringify(colorHistory));
  renderColorHistory();
}

function applyDraftSlotColor(hex) {
  if (!draftTheme) return;
  draftTheme[activeColorSlot] = hex;
  syncWheelToHex(hex);
  renderColorSlots();
  applyThemeToDOM(draftTheme, draftUploadedBgDataUrl);
}

function handleWheelPointer(cx, cy) {
  const rect = wheelCanvas.getBoundingClientRect(), c = rect.width / 2, r = c - 2;
  let dx = cx - rect.left - c, dy = cy - rect.top - c, dist = Math.hypot(dx, dy);
  if (dist > r) { dx = (dx / dist) * r; dy = (dy / dist) * r; dist = r; }
  wheelHSV.h = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
  wheelHSV.s = dist / r;
  applyDraftSlotColor(hsvToHex(wheelHSV.h, wheelHSV.s, wheelHSV.v));
}

wheelWrap.addEventListener("pointerdown", (e) => { isDraggingWheel = true; wheelWrap.setPointerCapture(e.pointerId); handleWheelPointer(e.clientX, e.clientY); });
wheelWrap.addEventListener("pointermove", (e) => { if (isDraggingWheel) handleWheelPointer(e.clientX, e.clientY); });
wheelWrap.addEventListener("pointerup", () => { if (isDraggingWheel && draftTheme) { isDraggingWheel = false; pushColorHistory(draftTheme[activeColorSlot]); } });
wheelValSlider.addEventListener("input", () => { wheelHSV.v = Number(wheelValSlider.value) / 100; applyDraftSlotColor(hsvToHex(wheelHSV.h, wheelHSV.s, wheelHSV.v)); });
wheelValSlider.addEventListener("change", () => draftTheme && pushColorHistory(draftTheme[activeColorSlot]));
wheelHexInput.addEventListener("input", () => { const v = wheelHexInput.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) applyDraftSlotColor(v); });
wheelHexInput.addEventListener("change", () => { const v = wheelHexInput.value.trim(); if (/^#[0-9A-Fa-f]{6}$/.test(v)) pushColorHistory(v); });
clearHistoryBtn.addEventListener("click", () => { colorHistory = []; localStorage.setItem(STORAGE_COLOR_HISTORY_KEY, "[]"); renderColorHistory(); });

function applyThemeToDOM(theme, uploadedImg) {
  const root = document.documentElement.style;
  const lightBase = isLightColor(theme.sidebarColor);
  const borderBase = lightBase ? "#000000" : "#ffffff";

  root.setProperty("--bg-primary", theme.bgColor);
  root.setProperty("--sidebar-bg-rgba", hexToRgba(theme.sidebarColor, theme.sidebarAlpha / 100));
  root.setProperty("--sidebar-blur", `${theme.sidebarBlur}px`);
  root.setProperty("--card-bg-rgba", hexToRgba(theme.cardColor, Math.min(0.95, (theme.sidebarAlpha + 4) / 100)));
  root.setProperty("--scramble-bg-rgba", theme.scrambleBox ? hexToRgba(theme.scrambleColor, 0.72) : "rgba(0,0,0,0)");
  root.setProperty("--border-color", hexToRgba(borderBase, lightBase ? 0.14 : 0.1));
  root.setProperty("--border-strong", hexToRgba(borderBase, lightBase ? 0.28 : 0.22));
  root.setProperty("--text-primary", theme.textColor);
  root.setProperty("--text-secondary", theme.mutedColor);
  root.setProperty("--accent-color", theme.accentColor);
  root.setProperty("--accent-contrast", isLightColor(theme.accentColor) ? "#0a0a0a" : "#ffffff");
  root.setProperty("--state-idle", theme.textColor);
  root.setProperty("--state-holding", theme.holdingColor);
  root.setProperty("--state-ready", theme.readyColor);
  root.setProperty("--state-running", theme.textColor);
  root.setProperty("--font-timer", theme.timerFont);
  root.setProperty("--font-ui", theme.uiFont);
  root.setProperty("--radius", `${theme.radius}px`);
  root.setProperty("--bg-blur", `${theme.bgBlur}px`);
  root.setProperty("--bg-dim", String(theme.bgDim / 100));
  root.setProperty("--bg-pos-y", `${theme.bgPosY}%`);
  root.setProperty("--bg-scale", String(theme.bgScale / 100));

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

// === SECTION A5: THEME STUDIO UI ===
function openThemeStudio() {
  draftTheme = JSON.parse(JSON.stringify(activeTheme));
  draftUploadedBgDataUrl = uploadedBgDataUrl;
  syncStudioUI();
  themeModal.classList.remove("hidden");
}
function cancelThemeStudio() {
  draftTheme = null; draftUploadedBgDataUrl = null;
  applyThemeToDOM(activeTheme, uploadedBgDataUrl);
  themeModal.classList.add("hidden");
}
async function applyThemeStudio() {
  if (!draftTheme) return;
  activeTheme = JSON.parse(JSON.stringify(draftTheme));
  if (draftUploadedBgDataUrl && draftUploadedBgDataUrl !== uploadedBgDataUrl) {
    uploadedBgDataUrl = draftUploadedBgDataUrl;
    await saveUploadedBg(uploadedBgDataUrl);
  }
  localStorage.setItem(STORAGE_THEME_KEY, JSON.stringify(activeTheme));
  applyThemeToDOM(activeTheme, uploadedBgDataUrl);
  draftTheme = null;
  themeModal.classList.add("hidden");
  showToast("Theme applied!");
}

function syncStudioUI() {
  if (!draftTheme) return;
  renderQuickMoods(); renderPresets(); renderGallery(); renderColorSlots(); renderColorHistory();
  themeTimerBox.checked = Boolean(draftTheme.timerBackdrop);
  themeScrambleBox.checked = Boolean(draftTheme.scrambleBox);
  sourceTabs.forEach((b) => b.classList.toggle("active", b.dataset.bgMode === draftTheme.bgMode));
  bgSourceScene.classList.toggle("hidden", draftTheme.bgMode !== "scene");
  bgSourceUpload.classList.toggle("hidden", draftTheme.bgMode !== "upload");
  bgSlidersPanel.classList.toggle("hidden", draftTheme.bgMode === "color");
  uploadStatusText.textContent = draftUploadedBgDataUrl ? "Custom photo loaded" : "Upload your own wallpaper";

  themeBgBlur.value = draftTheme.bgBlur; bgBlurVal.textContent = `${draftTheme.bgBlur}px`;
  themeBgDim.value = draftTheme.bgDim; bgDimVal.textContent = `${draftTheme.bgDim}%`;
  themeBgPosY.value = draftTheme.bgPosY; bgPosYVal.textContent = `${draftTheme.bgPosY}%`;
  themeBgScale.value = draftTheme.bgScale; bgScaleVal.textContent = `${draftTheme.bgScale}%`;
  themeSidebarAlpha.value = draftTheme.sidebarAlpha; sidebarAlphaVal.textContent = `${draftTheme.sidebarAlpha}%`;
  themeSidebarBlur.value = draftTheme.sidebarBlur; sidebarBlurVal.textContent = `${draftTheme.sidebarBlur}px`;
  themeRadius.value = draftTheme.radius; radiusVal.textContent = `${draftTheme.radius}px`;
  themeTimerFont.value = draftTheme.timerFont;
  themeUiFont.value = draftTheme.uiFont;

  const slotMeta = COLOR_SLOTS.find((s) => s.key === activeColorSlot) || COLOR_SLOTS[0];
  wheelSlotName.textContent = slotMeta.label;
  syncWheelToHex(draftTheme[activeColorSlot]);
}

function renderQuickMoods() {
  accentPillsWrap.innerHTML = "";
  const cur = QUICK_MOODS.find((m) => m.id === draftTheme.mood);
  activeMoodLabel.textContent = cur ? cur.name.toUpperCase() : "CUSTOM";
  QUICK_MOODS.forEach((m) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `accent-pill ${draftTheme.mood === m.id ? "active" : ""}`;
    btn.innerHTML = `<span class="accent-dot" style="background:${m.dot}"></span><span>${m.name}</span>`;
    btn.addEventListener("click", () => {
      Object.assign(draftTheme, { mood: m.id, bgColor: m.bg, sidebarColor: m.sidebar, cardColor: m.card, textColor: m.text, mutedColor: m.muted, accentColor: m.accent, presetId: null });
      applyThemeToDOM(draftTheme, draftUploadedBgDataUrl);
      syncStudioUI();
    });
    accentPillsWrap.appendChild(btn);
  });
}

function renderPresets() {
  const makeCard = (p, isCustom = false) => {
    const card = document.createElement("div");
    card.className = `preset-card ${draftTheme.presetId === p.id ? "active" : ""}`;
    let thumbStyle = `background: linear-gradient(135deg, ${p.theme.bgColor} 55%, ${p.theme.accentColor} 100%)`;
    if (p.theme.bgMode === "scene") {
      const sc = PREMADE_SCENES.find((s) => s.id === p.theme.sceneId);
      if (sc) thumbStyle = `background-image: ${sc.uri}`;
    }
    card.innerHTML = `
      <div class="preset-thumb" style="${thumbStyle}"></div>
      <div class="preset-meta"><strong>${p.name}</strong><small>${p.desc || "Custom saved vibe"}</small></div>
      ${isCustom ? `<button class="preset-del" data-del="${p.id}" type="button">✕</button>` : ""}
    `;
    card.addEventListener("click", (e) => {
      if (e.target.closest("[data-del]")) {
        e.stopPropagation();
        savedPresets = savedPresets.filter((x) => x.id !== p.id);
        localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(savedPresets));
        renderPresets();
        return;
      }
      draftTheme = { ...DEFAULT_THEME, ...p.theme, presetId: p.id };
      applyThemeToDOM(draftTheme, draftUploadedBgDataUrl);
      syncStudioUI();
    });
    return card;
  };
  colorPresetsGrid.innerHTML = ""; COLOR_PRESETS.forEach((p) => colorPresetsGrid.appendChild(makeCard(p)));
  scenePresetsGrid.innerHTML = ""; SCENE_PRESETS.forEach((p) => scenePresetsGrid.appendChild(makeCard(p)));
  savedPresetsGrid.innerHTML = ""; savedPresetsSection.classList.toggle("hidden", savedPresets.length === 0);
  savedPresets.forEach((p) => savedPresetsGrid.appendChild(makeCard(p, true)));
}

function renderGallery() {
  galleryGrid.innerHTML = "";
  PREMADE_SCENES.forEach((sc) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `gallery-item ${draftTheme.sceneId === sc.id ? "active" : ""}`;
    item.style.backgroundImage = sc.uri;
    item.textContent = sc.name;
    item.addEventListener("click", () => {
      draftTheme.bgMode = "scene"; draftTheme.sceneId = sc.id; draftTheme.presetId = null;
      applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI();
    });
    galleryGrid.appendChild(item);
  });
}

function renderColorSlots() {
  colorSlotsWrap.innerHTML = "";
  COLOR_SLOTS.forEach((slot) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `color-slot-btn ${activeColorSlot === slot.key ? "active" : ""}`;
    btn.innerHTML = `<span>${slot.label}</span><span class="slot-swatch" style="background:${draftTheme[slot.key]}"></span>`;
    btn.addEventListener("click", () => { activeColorSlot = slot.key; syncStudioUI(); });
    colorSlotsWrap.appendChild(btn);
  });
}

function renderColorHistory() {
  colorHistorySwatches.innerHTML = "";
  const list = colorHistory.length > 0 ? colorHistory : [...new Set(COLOR_SLOTS.map((s) => (draftTheme || activeTheme)[s.key].toUpperCase()))];
  list.forEach((hex) => {
    const sw = document.createElement("button");
    sw.type = "button"; sw.className = "hist-swatch"; sw.style.background = hex; sw.title = hex;
    sw.addEventListener("click", () => { applyDraftSlotColor(hex); pushColorHistory(hex); });
    colorHistorySwatches.appendChild(sw);
  });
}

themeBtn.addEventListener("click", openThemeStudio);
closeThemeBtn.addEventListener("click", cancelThemeStudio);
cancelThemeBtn.addEventListener("click", cancelThemeStudio);
applyThemeBtn.addEventListener("click", applyThemeStudio);
studioTabs.forEach((t) => t.addEventListener("click", () => {
  activeStudioTab = t.dataset.studioTab;
  studioTabs.forEach((x) => x.classList.toggle("active", x === t));
  studioPanePresets.classList.toggle("hidden", activeStudioTab !== "presets");
  studioPaneCustom.classList.toggle("hidden", activeStudioTab !== "custom");
}));
sourceTabs.forEach((t) => t.addEventListener("click", () => {
  draftTheme.bgMode = t.dataset.bgMode; draftTheme.presetId = null;
  applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI();
}));
uploadBgBtn.addEventListener("click", () => { bgImageInput.value = ""; bgImageInput.click(); });
bgImageInput.addEventListener("change", () => {
  const file = bgImageInput.files?.[0];
  if (!file) return;
  const r = new FileReader();
  r.onload = () => { draftUploadedBgDataUrl = r.result; draftTheme.bgMode = "upload"; draftTheme.presetId = null; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); syncStudioUI(); };
  r.readAsDataURL(file);
});
themeTimerBox.addEventListener("change", () => { draftTheme.timerBackdrop = themeTimerBox.checked; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
themeScrambleBox.addEventListener("change", () => { draftTheme.scrambleBox = themeScrambleBox.checked; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
const bindDraftSlider = (el, key, lbl, suf) => el.addEventListener("input", () => {
  draftTheme[key] = Number(el.value); draftTheme.presetId = null; lbl.textContent = `${el.value}${suf}`;
  applyThemeToDOM(draftTheme, draftUploadedBgDataUrl);
});
bindDraftSlider(themeBgBlur, "bgBlur", bgBlurVal, "px");
bindDraftSlider(themeBgDim, "bgDim", bgDimVal, "%");
bindDraftSlider(themeBgPosY, "bgPosY", bgPosYVal, "%");
bindDraftSlider(themeBgScale, "bgScale", bgScaleVal, "%");
bindDraftSlider(themeSidebarAlpha, "sidebarAlpha", sidebarAlphaVal, "%");
bindDraftSlider(themeSidebarBlur, "sidebarBlur", sidebarBlurVal, "px");
bindDraftSlider(themeRadius, "radius", radiusVal, "px");
themeTimerFont.addEventListener("change", () => { draftTheme.timerFont = themeTimerFont.value; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
themeUiFont.addEventListener("change", () => { draftTheme.uiFont = themeUiFont.value; applyThemeToDOM(draftTheme, draftUploadedBgDataUrl); });
saveCustomPresetBtn.addEventListener("click", () => {
  if (!draftTheme) return;
  const name = prompt("Name your custom theme preset:", "My Custom Vibe");
  if (!name || !name.trim()) return;
  const id = `custom-${Date.now()}`;
  savedPresets.push({ id, name: name.trim(), desc: draftTheme.bgMode === "scene" ? "Scene + Custom" : "Custom Colors", theme: { ...draftTheme, presetId: id } });
  localStorage.setItem(STORAGE_CUSTOM_PRESETS_KEY, JSON.stringify(savedPresets));
  draftTheme.presetId = id; renderPresets(); showToast(`Saved preset "${name.trim()}"`);
});

// === SECTION A6: SCRAMBLES, 3D PREVIEW, 15s INSPECTION & TIMER ===
let inspStartTime = null;
let inspIntervalId = null;
let inspWarned8 = false;
let inspWarned12 = false;
let pendingPenalty = null;
let armingInspTrigger = null;

function playBeep(freq = 880, duration = 0.09) {
  if (!settings.inspectionAudio) return;
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), 350);
  } catch {}
}

function localFallbackScramble(eventId) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const mods = ["", "'", "2"];
  const genMoves = (faces, len) => {
    const out = [];
    let last = "", prev2 = "";
    for (let i = 0; i < len; i++) {
      let f;
      do { f = pick(faces); } while (f === last || (f[0] === last[0] && f === prev2));
      prev2 = last; last = f;
      out.push(f + pick(mods));
    }
    return out.join(" ");
  };
  if (eventId === "222") return genMoves(["U", "R", "F"], 9);
  if (eventId === "444") return genMoves(["U", "D", "R", "L", "F", "B", "Uw", "Rw", "Fw"], 40);
  if (eventId === "555") return genMoves(["U", "D", "R", "L", "F", "B", "Uw", "Dw", "Rw", "Lw", "Fw", "Bw"], 60);
  if (eventId === "666" || eventId === "777") return genMoves(["U", "D", "R", "L", "F", "B", "Uw", "Dw", "Rw", "Lw", "Fw", "Bw", "3Uw", "3Rw", "3Fw"], 80);
  if (eventId === "pyram") return genMoves(["U", "L", "R", "B"], 10);
  if (eventId === "skewb") return genMoves(["U", "L", "R", "B"], 9);
  return genMoves(["U", "D", "R", "L", "F", "B"], 20);
}

async function generateScramble(eventId) {
  if (!randomScrambleForEvent) {
    ensureScramblerLoaded();
    return { text: localFallbackScramble(eventId), offline: true };
  }
  const alg = await randomScrambleForEvent(eventId);
  return { text: alg.toString(), offline: false };
}

async function loadNextScramble(eventId) {
  scrambleStatusEl.textContent = "Generating...";
  try {
    let result;
    if (prefetchedScramble && prefetchedEvent === eventId) {
      result = prefetchedScramble; prefetchedScramble = null; prefetchedEvent = null;
    } else {
      result = await generateScramble(eventId);
    }
    if (eventId === settings.event) {
      currentScramble = result.text;
      scrambleTextEl.textContent = currentScramble;
      scrambleStatusEl.textContent = result.offline ? "Offline fallback (Wi-Fi)" : "";
      updateScramblePreview();
      if (!result.offline) prefetchScramble(eventId);
    }
  } catch (err) {
    console.error(err);
    currentScramble = localFallbackScramble(eventId);
    scrambleTextEl.textContent = currentScramble;
    scrambleStatusEl.textContent = "Offline fallback";
  }
}

async function prefetchScramble(eventId) {
  try {
    const next = await generateScramble(eventId);
    if (eventId === settings.event && !next.offline) { prefetchedScramble = next; prefetchedEvent = eventId; }
  } catch {}
}

function updateScramblePreview() {
  const puzzle = EVENT_TO_PUZZLE[settings.event] || "3x3x3";
  const dim = settings.event === "clock" ? "2D" : settings.previewDim;
  scramblePlayer.setAttribute("puzzle", puzzle);
  scramblePlayer.setAttribute("visualization", dim);
  scramblePlayer.setAttribute("experimental-setup-alg", currentScramble || "");
  scramblePlayer.setAttribute("alg", "");
  try { scramblePlayer.puzzle = puzzle; scramblePlayer.visualization = dim; scramblePlayer.experimentalSetupAlg = currentScramble || ""; scramblePlayer.alg = ""; } catch {}
  previewModeBadge.textContent = dim;
  toggleDimBtn.textContent = settings.previewDim === "3D" ? "Switch to 2D" : "Switch to 3D";
}

toggleDimBtn.addEventListener("click", () => { toggleDimBtn.blur(); updateSetting("previewDim", settings.previewDim === "3D" ? "2D" : "3D"); updateScramblePreview(); });
resetCamBtn.addEventListener("click", () => { resetCamBtn.blur(); try { scramblePlayer.cameraLatitude = 30; scramblePlayer.cameraLongitude = 35; } catch {} });

function setTimerState(nextState) {
  timerState = nextState;
  timerZone.dataset.state = nextState;
  if (nextState !== "inspecting") delete timerZone.dataset.inspWarn;

  const hideUI = (nextState === "running" || nextState === "inspecting") && settings.focusMode;
  if (hideUI) {
    appEl.classList.add("is-running"); document.body.classList.add("is-solving");
    advStatsOpen = false; advStatsDrawer.classList.add("hidden");
  } else {
    appEl.classList.remove("is-running"); document.body.classList.remove("is-solving");
  }

  if (nextState === "idle") {
    timerHintText.textContent = settings.inspection ? "Tap SPACE or CLICK to inspect (15s)" : "Hold SPACE or CLICK to ready";
  } else if (nextState === "inspecting") {
    timerHintText.textContent = "Inspecting • Hold SPACE/CLICK to start (ESC cancels)";
  } else if (nextState === "holding") {
    timerDisplay.textContent = formatTime(0, settings.decimals);
    timerHintText.textContent = settings.holdDelayMs > 0 ? "Keep holding..." : "Release to start";
  } else if (nextState === "ready") {
    timerDisplay.textContent = formatTime(0, settings.decimals);
    timerHintText.textContent = "Release to start";
  } else if (nextState === "running") {
    timerHintText.textContent = "Running";
  }
}

function startInspection() {
  clearInterval(inspIntervalId);
  inspStartTime = performance.now();
  inspWarned8 = false;
  inspWarned12 = false;
  pendingPenalty = null;
  pbBanner.classList.add("hidden");
  lastSolveActions.classList.add("hidden");
  setTimerState("inspecting");
  updateInspectionDisplay();

  inspIntervalId = setInterval(() => {
    if (inspStartTime === null) return;
    const elapsed = performance.now() - inspStartTime;

    if (elapsed >= 8000 && !inspWarned8) { inspWarned8 = true; playBeep(880, 0.08); }
    if (elapsed >= 12000 && !inspWarned12) {
      inspWarned12 = true;
      playBeep(1046, 0.09);
      setTimeout(() => playBeep(1046, 0.09), 130);
    }
    if (elapsed >= 17000 && timerState === "inspecting") {
      clearInterval(inspIntervalId);
      inspIntervalId = null;
      inspStartTime = null;
      playBeep(220, 0.22);
      const solve = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        event: settings.event, rawMs: 1, penalty: "DNF", scramble: currentScramble, createdAt: Date.now(),
      };
      solves.push(solve);
      saveSolves();
      setTimerState("idle");
      renderAll();
      showToast("Inspection exceeded 17s — DNF recorded");
      loadNextScramble(settings.event);
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
    if (elapsed >= 12000) timerZone.dataset.inspWarn = "12";
    else delete timerZone.dataset.inspWarn;
  } else {
    timerDisplay.textContent = "+2";
    timerZone.dataset.inspWarn = "plus2";
  }
}

function cancelInspection() {
  clearInterval(inspIntervalId);
  inspIntervalId = null;
  inspStartTime = null;
  pendingPenalty = null;
  armingInspTrigger = null;
  setTimerState("idle");
  renderAll();
}

function beginHold(trigger) {
  if (timerState !== "idle" && timerState !== "inspecting") return;
  activeTrigger = trigger; clearTimeout(holdTimeoutId);
  pbBanner.classList.add("hidden");
  if (settings.holdDelayMs <= 0) { setTimerState("ready"); return; }
  setTimerState("holding");
  holdTimeoutId = setTimeout(() => { if (timerState === "holding") setTimerState("ready"); }, settings.holdDelayMs);
}

function cancelHold() {
  clearTimeout(holdTimeoutId); holdTimeoutId = null; activeTrigger = null;
  if (inspStartTime !== null) {
    setTimerState("inspecting");
    updateInspectionDisplay();
  } else {
    setTimerState("idle");
    renderAll();
  }
}

function startTimer() {
  clearTimeout(holdTimeoutId); holdTimeoutId = null; activeTrigger = null;
  if (inspStartTime !== null) {
    const inspElapsed = performance.now() - inspStartTime;
    clearInterval(inspIntervalId); inspIntervalId = null; inspStartTime = null;
    pendingPenalty = inspElapsed > 17000 ? "DNF" : inspElapsed > 15000 ? "+2" : null;
  } else {
    pendingPenalty = null;
  }

  startTime = performance.now();
  setTimerState("running");
  lastSolveActions.classList.add("hidden");
  const tick = () => {
    if (timerState !== "running") return;
    timerDisplay.textContent = formatTime(performance.now() - startTime, settings.decimals);
    rafId = requestAnimationFrame(tick);
  };
  rafId = requestAnimationFrame(tick);
}

function stopTimer(stopTrigger) {
  const stopTime = performance.now();
  cancelAnimationFrame(rafId); rafId = null;
  const elapsedMs = Math.max(1, Math.round(stopTime - startTime));
  activeTrigger = stopTrigger; setTimerState("stopping");

  const prevEventSolves = getCurrentEventSolves();
  const solve = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
    event: settings.event, rawMs: elapsedMs, penalty: pendingPenalty, scramble: currentScramble, createdAt: Date.now(),
  };
  pendingPenalty = null;

  solves.push(solve);
  saveSolves();
  timerDisplay.textContent = formatSolve(solve, settings.decimals);
  renderAll();
  checkAndCelebratePB(prevEventSolves, solve);
  loadNextScramble(settings.event);
}

function finishStopCycle() { if (timerState === "stopping") { activeTrigger = null; setTimerState("idle"); } }

const isModalOpen = () => !themeModal.classList.contains("hidden") || !settingsModal.classList.contains("hidden") || !solveModal.classList.contains("hidden") || !profileModal.classList.contains("hidden");

window.addEventListener("keydown", (e) => {
  if (isModalOpen()) {
    if (e.key === "Escape") { if (!themeModal.classList.contains("hidden")) cancelThemeStudio(); else closeModals(); }
    return;
  }
  if (activeTab !== "timer") return;

  if (e.key === "Escape" && (timerState === "inspecting" || timerState === "holding" || timerState === "ready")) {
    clearTimeout(holdTimeoutId); holdTimeoutId = null; activeTrigger = null;
    cancelInspection();
    return;
  }

  if (e.code === "Space") {
    e.preventDefault();
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    if (e.repeat) return;

    if (timerState === "idle") {
      if (settings.inspection) armingInspTrigger = "space";
      else beginHold("space");
    } else if (timerState === "inspecting") {
      beginHold("space");
    } else if (timerState === "running") {
      stopTimer("space");
    }
  }
});

window.addEventListener("keyup", (e) => {
  if (e.code !== "Space" || activeTab !== "timer") return;
  e.preventDefault();
  if (armingInspTrigger === "space" && timerState === "idle") {
    armingInspTrigger = null;
    startInspection();
  } else if (timerState === "holding" && activeTrigger === "space") cancelHold();
  else if (timerState === "ready" && activeTrigger === "space") startTimer();
  else if (timerState === "stopping" && activeTrigger === "space") finishStopCycle();
});

window.addEventListener("pointerdown", (e) => {
  if (timerState !== "running") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  e.preventDefault(); e.stopPropagation();
  suppressNextClick = true; setTimeout(() => (suppressNextClick = false), 100);
  stopTimer("pointer");
}, { capture: true });

window.addEventListener("click", (e) => { if (suppressNextClick) { e.preventDefault(); e.stopPropagation(); suppressNextClick = false; } }, { capture: true });

timerZone.addEventListener("pointerdown", (e) => {
  if (isModalOpen() || activeTab !== "timer") return;
  if (e.pointerType === "mouse" && e.button !== 0) return;
  if (e.target.closest("button, select, input, a, .scramble-text, .adv-stats-drawer")) return;

  if (timerState === "idle") {
    e.preventDefault();
    if (settings.inspection) armingInspTrigger = "pointer";
    else beginHold("pointer");
  } else if (timerState === "inspecting") {
    e.preventDefault();
    beginHold("pointer");
  }
});

window.addEventListener("pointerup", () => {
  if (armingInspTrigger === "pointer" && timerState === "idle") {
    armingInspTrigger = null;
    startInspection();
  } else if (timerState === "holding" && activeTrigger === "pointer") cancelHold();
  else if (timerState === "ready" && activeTrigger === "pointer") startTimer();
  else if (timerState === "stopping" && activeTrigger === "pointer") finishStopCycle();
});

window.addEventListener("pointercancel", () => {
  armingInspTrigger = null;
  if (timerState === "holding" || timerState === "ready") cancelHold();
  else if (timerState === "stopping") finishStopCycle();
});
window.addEventListener("blur", () => {
  armingInspTrigger = null;
  if (timerState === "holding" || timerState === "ready") cancelHold();
  else if (timerState === "stopping") finishStopCycle();
});

// === SECTION A7: PB CELEBRATION ENGINE ===
function getBestRollingAvg(list, size, isMean = false) {
  if (list.length < size) return null;
  let best = Infinity;
  for (let i = size; i <= list.length; i++) {
    const slice = list.slice(i - size, i);
    const val = isMean ? calculateMeanOfSlice(slice) : calculateTrimmedAverage(slice, size);
    if (val !== null && val < best) best = val;
  }
  return best === Infinity ? null : best;
}

function calculateMeanOfSlice(slice) {
  const times = slice.map(getEffectiveMs);
  if (times.some((t) => t === Infinity)) return Infinity;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

function checkAndCelebratePB(prevList, newSolve) {
  const newTime = getEffectiveMs(newSolve);
  if (newTime === Infinity) return;
  const fullList = [...prevList, newSolve];
  const records = [];

  const prevBestSingle = calculateBest(prevList);
  if (prevBestSingle !== null && prevBestSingle !== Infinity && newTime < prevBestSingle) {
    records.push(`NEW SINGLE PB! (-${formatTime(prevBestSingle - newTime, settings.decimals)}s)`);
  }

  [[5, "AO5"], [12, "AO12"], [50, "AO50"], [100, "AO100"]].forEach(([size, label]) => {
    if (fullList.length >= size) {
      const cur = calculateTrimmedAverage(fullList, size);
      const prevBest = getBestRollingAvg(prevList, size);
      if (cur !== null && cur !== Infinity && prevBest !== null && cur < prevBest) {
        records.push(`NEW BEST ${label}! (${formatTime(cur, settings.decimals)})`);
      }
    }
  });

  if (records.length === 0) return;
  pbBanner.textContent = records[0];
  pbBanner.classList.remove("hidden");
  clearTimeout(pbTimeoutId);
  pbTimeoutId = setTimeout(() => pbBanner.classList.add("hidden"), 4000);
  launchConfetti();
}

function launchConfetti() {
  const ctx = confettiCanvas.getContext("2d");
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
  const colors = [activeTheme.accentColor, activeTheme.textColor, activeTheme.readyColor, "#ffffff"];
  const cx = confettiCanvas.width / 2, cy = confettiCanvas.height * 0.45;

  const particles = Array.from({ length: 65 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    return {
      x: cx, y: cy, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
      size: 4 + Math.random() * 4, color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.25,
    };
  });

  const step = () => {
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let alive = false;
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy; p.vy += 0.22; p.rot += p.vr; p.alpha -= 0.015;
      if (p.alpha > 0) {
        alive = true;
        ctx.save(); ctx.globalAlpha = p.alpha; ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.65);
        ctx.restore();
      }
    }
    if (alive) requestAnimationFrame(step);
    else ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  };
  requestAnimationFrame(step);
}

// === SECTION A8: STATS, INTERACTIVE TREND & VISUAL ANALYTICS ===
const getEffectiveMs = (s) => s.penalty === "DNF" ? Infinity : s.penalty === "+2" ? s.rawMs + 2000 : s.rawMs;

function formatTime(ms, decimals = 2) {
  if (ms === Infinity || ms == null || Number.isNaN(ms)) return "DNF";
  const totalMs = Math.max(0, Math.round(ms));
  const min = Math.floor(totalMs / 60000), sec = Math.floor((totalMs % 60000) / 1000), rem = totalMs % 1000;
  const frac = decimals === 3 ? String(rem).padStart(3, "0") : String(Math.floor(rem / 10)).padStart(2, "0");
  return min > 0 ? `${min}:${String(sec).padStart(2, "0")}.${frac}` : `${sec}.${frac}`;
}

function formatSolve(s, dec = 2) {
  if (s.penalty === "DNF") return "DNF";
  const b = formatTime(getEffectiveMs(s), dec);
  return s.penalty === "+2" ? `${b}+` : b;
}

function calculateTrimmedAverage(list, size) {
  if (list.length < size) return null;
  const recent = list.slice(-size).map(getEffectiveMs).sort((a, b) => (a === b ? 0 : a < b ? -1 : 1));
  const mid = recent.slice(1, size - 1);
  return mid.some((t) => t === Infinity) ? Infinity : mid.reduce((a, t) => a + t, 0) / mid.length;
}

function calculateSessionMean(list) {
  const v = list.map(getEffectiveMs).filter((t) => t !== Infinity);
  return v.length === 0 ? (list.length > 0 ? Infinity : null) : v.reduce((a, b) => a + b, 0) / v.length;
}

function calculateBest(list) {
  const v = list.map(getEffectiveMs).filter((t) => t !== Infinity);
  return v.length === 0 ? (list.length > 0 ? Infinity : null) : Math.min(...v);
}

const getCurrentEventSolves = () => solves.filter((s) => s.event === settings.event);

function renderSparkline(eventSolves) {
  const indexed = eventSolves
    .map((s, idx) => ({ num: idx + 1, ms: getEffectiveMs(s), label: formatSolve(s, settings.decimals) }))
    .filter((d) => d.ms !== Infinity);

  const limit = settings.trendRange === "all" ? indexed.length : Number(settings.trendRange);
  const data = indexed.slice(-limit);

  if (data.length < 2) {
    sparklineWrap.innerHTML = `<span class="sparkline-empty">Complete 2+ solves for graph</span>`;
    return;
  }

  const series = data.map((d, i) => {
    const win = data.slice(Math.max(0, i - 4), i + 1);
    const avg = win.reduce((acc, x) => acc + x.ms, 0) / win.length;
    return { ...d, plotMs: settings.trendFlatten ? avg : d.ms };
  });

  let min, max;
  if (settings.trendFlatten && series.length >= 6) {
    const sorted = [...series.map((s) => s.plotMs)].sort((a, b) => a - b);
    min = sorted[Math.floor(sorted.length * 0.05)];
    max = sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.95) - 1)];
    if (max <= min) { min = Math.min(...sorted); max = Math.max(...sorted); }
  } else {
    min = Math.min(...series.map((s) => s.plotMs));
    max = Math.max(...series.map((s) => s.plotMs));
  }
  const span = Math.max(1, max - min);

  const w = 260, h = 98, pad = 12;
  const clampY = (ms) => Math.max(pad, Math.min(h - pad, h - pad - ((ms - min) / span) * (h - pad * 2)));

  const coords = series.map((d, i) => ({
    ...d,
    x: pad + (i / (series.length - 1)) * (w - pad * 2),
    y: clampY(d.plotMs),
    rawY: clampY(d.ms),
  }));

  const poly = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const rawDots = settings.trendFlatten
    ? coords.map((c) => `<circle cx="${c.x.toFixed(1)}" cy="${c.rawY.toFixed(1)}" r="1.4" fill="currentColor" opacity="0.22" />`).join("")
    : "";

  const dots = coords.map((c) => `
    <circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="${series.length > 60 ? 1.7 : 2.4}" fill="currentColor" opacity="0.92" />
    <circle class="spark-hit" cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="9" fill="transparent"
      data-num="${c.num}" data-label="${settings.trendFlatten ? `${formatTime(c.plotMs, settings.decimals)} avg (${c.label})` : c.label}"
      data-x="${(c.x / w) * 100}" data-y="${(c.y / h) * 100}" style="cursor:pointer;" />
  `).join("");

  const scaleLabels = settings.trendFlatten
    ? `<text x="6" y="12" fill="currentColor" opacity="0.45" font-size="8" font-family="monospace">${formatTime(max, 1)}</text>
       <text x="6" y="${h - 4}" fill="currentColor" opacity="0.45" font-size="8" font-family="monospace">${formatTime(min, 1)}</text>`
    : "";

  sparklineWrap.innerHTML = `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" style="color: var(--accent-color)">
      ${scaleLabels}
      ${rawDots}
      <polyline fill="none" stroke="currentColor" stroke-width="1.9" stroke-opacity="0.9" points="${poly}" />
      ${dots}
    </svg>
    <div id="sparkline-tooltip" class="sparkline-tooltip hidden"></div>
  `;

  const tip = $("sparkline-tooltip");
  sparklineWrap.querySelectorAll(".spark-hit").forEach((hit) => {
    hit.addEventListener("pointerenter", () => {
      tip.textContent = `#${hit.dataset.num} • ${hit.dataset.label}`;
      tip.style.left = `${Math.min(78, Math.max(22, Number(hit.dataset.x)))}%`;
      tip.style.top = `${Math.max(18, Number(hit.dataset.y))}%`;
      tip.classList.remove("hidden");
    });
    hit.addEventListener("pointerleave", () => tip.classList.add("hidden"));
  });
}

let advBracketStep = 5000;

function renderAdvancedStats(eventSolves) {
  const dec = settings.decimals;
  const validEntries = eventSolves
    .map((s, i) => ({ idx: i + 1, ms: getEffectiveMs(s), createdAt: s.createdAt }))
    .filter((d) => d.ms !== Infinity);
  const valid = validEntries.map((d) => d.ms);
  const dnfCount = eventSolves.filter((s) => s.penalty === "DNF").length;
  const plus2Count = eventSolves.filter((s) => s.penalty === "+2").length;

  advStatsSubtitle.textContent = `${eventSolves.length} solves (${valid.length} valid, ${dnfCount} DNF, ${plus2Count} +2)`;
  const mean = calculateSessionMean(eventSolves);
  const best = calculateBest(eventSolves);
  const worst = valid.length ? Math.max(...valid) : null;
  let stdDev = null, consistency = null;
  if (valid.length >= 2 && mean !== null && mean !== Infinity) {
    stdDev = Math.sqrt(valid.reduce((acc, t) => acc + (t - mean) ** 2, 0) / valid.length);
    consistency = Math.max(0, 100 - (stdDev / mean) * 100);
  }
  advStatsTeaser.textContent = stdDev !== null ? `• σ ${formatTime(stdDev, dec)}s` : "";

  if (valid.length < 2) {
    advStatsBody.innerHTML = `<p class="muted-text">Complete at least 2 valid solves to unlock visual analytics.</p>`;
    return;
  }

  // 1. Time Distribution Brackets (5s or 2s toggleable)
  let brackets = [];
  if (advBracketStep === 5000) {
    const fixed = [
      { label: "0–5s", min: 0, max: 5000 },
      { label: "5–10s", min: 5000, max: 10000 },
      { label: "10–15s", min: 10000, max: 15000 },
      { label: "15–20s", min: 15000, max: 20000 },
      { label: "20–25s", min: 20000, max: 25000 },
      { label: "25–30s", min: 25000, max: 30000 },
      { label: "30–45s", min: 30000, max: 45000 },
      { label: "45s+", min: 45000, max: Infinity },
    ].map((b) => {
      const items = valid.filter((t) => t >= b.min && t < b.max);
      return { ...b, count: items.length, avg: items.length ? items.reduce((a, x) => a + x, 0) / items.length : null };
    });
    const f = fixed.findIndex((b) => b.count > 0);
    const l = fixed.length - 1 - [...fixed].reverse().findIndex((b) => b.count > 0);
    brackets = fixed.slice(Math.max(0, f), Math.min(fixed.length, l + 1));
  } else {
    const sortedV = [...valid].sort((a, b) => a - b);
    const p02 = sortedV[Math.floor(sortedV.length * 0.02)];
    const startMs = Math.floor(p02 / 2000) * 2000;
    for (let i = 0; i < 8; i++) {
      const lo = startMs + i * 2000, hi = i === 7 ? Infinity : lo + 2000;
      const items = valid.filter((t) => (i === 0 ? t < hi : t >= lo && t < hi));
      const label = i === 0 && lo > 0 ? `<${hi / 1000}s` : hi === Infinity ? `${lo / 1000}s+` : `${lo / 1000}–${hi / 1000}s`;
      brackets.push({ label, count: items.length, avg: items.length ? items.reduce((a, x) => a + x, 0) / items.length : null });
    }
  }
  const maxBracket = Math.max(...brackets.map((b) => b.count), 1);
  const bracketsHtml = brackets.map((b) => `
    <div class="bracket-row chart-tip-target" data-tip="${b.label}: ${b.count} solves (${Math.round((b.count / valid.length) * 100)}%)${b.avg ? ` • Avg ${formatTime(b.avg, dec)}` : ""}">
      <span>${b.label}</span>
      <div class="bracket-track"><div class="bracket-fill" style="width:${Math.round((b.count / maxBracket) * 100)}%"></div></div>
      <span class="bracket-val">${b.count} (${Math.round((b.count / valid.length) * 100)}%)</span>
    </div>
  `).join("");

  // 2. Improvement Trajectory (Gridlines + Hover Scrubbing + PB Staircase)
  const trajW = 360, trajH = 142, tPadL = 36, tPadR = 10, tPadT = 12, tPadB = 20;
  let runningPB = Infinity;
  const pbPoints = [], rollPoints = [], rollWin = valid.length >= 12 ? 12 : 3;
  for (let i = 0; i < valid.length; i++) {
    if (valid[i] < runningPB) runningPB = valid[i];
    pbPoints.push(runningPB);
    const slice = valid.slice(Math.max(0, i - rollWin + 1), i + 1);
    rollPoints.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  const n = valid.length;
  const sumX = (n * (n - 1)) / 2, sumXX = (n * (n - 1) * (2 * n - 1)) / 6;
  const sumY = valid.reduce((a, b) => a + b, 0), sumXY = valid.reduce((a, y, i) => a + i * y, 0);
  const slope = (n * sumXX - sumX * sumX) ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
  const slopePer10 = slope * 10;
  const slopeText = slopePer10 <= -20 ? `↗ -${formatTime(Math.abs(slopePer10), 2)}s / 10` : slopePer10 >= 20 ? `↘ +${formatTime(slopePer10, 2)}s / 10` : "→ Steady";

  const tMin = Math.min(...pbPoints, ...rollPoints), tMax = Math.max(...pbPoints, ...rollPoints), tSpan = Math.max(1, tMax - tMin);
  const tMid = (tMin + tMax) / 2;
  const tx = (i) => tPadL + (i / (n - 1)) * (trajW - tPadL - tPadR);
  const ty = (val) => tPadT + (1 - (val - tMin) / tSpan) * (trajH - tPadT - tPadB);
  const pbPoly = pbPoints.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");
  const rollPoly = rollPoints.map((v, i) => `${tx(i).toFixed(1)},${ty(v).toFixed(1)}`).join(" ");

  const stepTraj = Math.max(1, Math.floor(n / 24));
  const trajHits = [];
  for (let i = 0; i < n; i += stepTraj) {
    trajHits.push(`<circle class="chart-tip-target" cx="${tx(i).toFixed(1)}" cy="${ty(rollPoints[i]).toFixed(1)}" r="7" fill="transparent" data-tip="Solve #${validEntries[i].idx} • Ao${rollWin}: ${formatTime(rollPoints[i], dec)} • PB: ${formatTime(pbPoints[i], dec)}" style="cursor:crosshair"/>`);
  }

  // 3. Hourly Performance (Real Active Hours: Bar = Solve Count, Accent = Fastest Hour)
  const hourBuckets = Array.from({ length: 24 }, (_, hr) => ({ hr, sum: 0, count: 0, best: Infinity }));
  validEntries.forEach((e) => {
    const hr = new Date(e.createdAt).getHours();
    hourBuckets[hr].sum += e.ms; hourBuckets[hr].count++;
    if (e.ms < hourBuckets[hr].best) hourBuckets[hr].best = e.ms;
  });
  const activeHours = hourBuckets.filter((h) => h.count > 0);
  const maxHourCount = Math.max(...activeHours.map((h) => h.count), 1);
  const fastestHour = [...activeHours].sort((a, b) => (a.sum / a.count) - (b.sum / b.count))[0];
  const fmtHr = (hr) => hr === 0 ? "12a" : hr < 12 ? `${hr}a` : hr === 12 ? "12p" : `${hr - 12}p`;

  const hourlyHtml = activeHours.map((h) => {
    const avg = h.sum / h.count;
    const hPct = Math.max(14, Math.round((h.count / maxHourCount) * 100));
    const isFastest = fastestHour && h.hr === fastestHour.hr;
    return `
      <div class="tod-col ${isFastest ? "best" : ""} chart-tip-target" data-tip="${fmtHr(h.hr)}: ${h.count} solves • ${formatTime(avg, dec)} avg • Best ${formatTime(h.best, dec)}">
        <span class="tod-time">${h.count}</span>
        <div class="tod-bar-wrap"><div class="tod-bar" style="height:${hPct}%"></div></div>
        <span class="tod-lbl">${fmtHr(h.hr)}</span>
      </div>
    `;
  }).join("");

  // 4. Daily Activity & Pace Matrix (Real Dates + Counts + Avg inside each tile)
  const dayMap = new Map();
  validEntries.forEach((e) => {
    const d = new Date(e.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    if (!dayMap.has(key)) dayMap.set(key, { label, times: [] });
    dayMap.get(key).times.push(e.ms);
  });

  let paceTiles = [], paceSubtitle = "";
  if (dayMap.size >= 2) {
    paceSubtitle = "Daily avg & solves (full bar = faster)";
    const days = [...dayMap.values()].slice(-12);
    const dayAvgs = days.map((d) => d.times.reduce((a, b) => a + b, 0) / d.times.length);
    const minDA = Math.min(...dayAvgs), maxDA = Math.max(...dayAvgs);
    paceTiles = days.map((d, idx) => {
      const avg = dayAvgs[idx];
      const norm = maxDA > minDA ? 1 - (avg - minDA) / (maxDA - minDA) : 0.7;
      return {
        top: d.label, main: formatTime(avg, 2), sub: `${d.times.length}x`,
        pct: Math.round(25 + norm * 75), alpha: (0.35 + norm * 0.65).toFixed(2),
        tip: `${d.label}: ${d.times.length} solves • ${formatTime(avg, dec)} avg • Best ${formatTime(Math.min(...d.times), dec)}`,
      };
    });
  } else {
    paceSubtitle = "Session blocks (full bar = faster)";
    const bSize = valid.length >= 30 ? 10 : Math.max(2, Math.floor(valid.length / 4));
    const blocks = [];
    for (let i = 0; i < valid.length; i += bSize) {
      const sl = valid.slice(i, i + bSize);
      blocks.push({ label: `#${i + 1}-${i + sl.length}`, times: sl, avg: sl.reduce((a, b) => a + b, 0) / sl.length });
    }
    const minBA = Math.min(...blocks.map((b) => b.avg)), maxBA = Math.max(...blocks.map((b) => b.avg));
    paceTiles = blocks.slice(-12).map((b) => {
      const norm = maxBA > minBA ? 1 - (b.avg - minBA) / (maxBA - minBA) : 0.7;
      return {
        top: b.label, main: formatTime(b.avg, 2), sub: `${b.times.length}x`,
        pct: Math.round(25 + norm * 75), alpha: (0.35 + norm * 0.65).toFixed(2),
        tip: `Solves ${b.label}: ${formatTime(b.avg, dec)} avg • Best ${formatTime(Math.min(...b.times), dec)}`,
      };
    });
  }

  const paceTilesHtml = paceTiles.map((t) => `
    <div class="pace-tile chart-tip-target" data-tip="${t.tip}">
      <span class="pace-top">${t.top}</span>
      <strong class="pace-main">${t.main}</strong>
      <span class="pace-sub">${t.sub}</span>
      <div class="pace-bar" style="width:${t.pct}%; opacity:${t.alpha}"></div>
    </div>
  `).join("");

  // 5. Speed vs Consistency Scatter Plot (Real Axes, Crosshair & Hover Tooltips)
  const chunkSize = valid.length >= 40 ? 10 : valid.length >= 15 ? 5 : 2;
  const chunks = [];
  for (let i = 0; i + chunkSize <= valid.length; i += chunkSize) {
    const sl = valid.slice(i, i + chunkSize);
    const cMean = sl.reduce((a, b) => a + b, 0) / sl.length;
    const cSd = Math.sqrt(sl.reduce((a, t) => a + (t - cMean) ** 2, 0) / sl.length);
    chunks.push({ label: `#${i + 1}–${i + chunkSize}`, mean: cMean, sd: cSd });
  }

  let scatterSvg = `<p class="muted-text">Need ${chunkSize * 2}+ solves for scatter plot</p>`;
  if (chunks.length >= 2) {
    const sw = 260, sh = 142, sL = 32, sR = 10, sT = 12, sB = 22;
    const minM = Math.min(...chunks.map((c) => c.mean)), maxM = Math.max(...chunks.map((c) => c.mean));
    const minS = Math.min(...chunks.map((c) => c.sd)), maxS = Math.max(...chunks.map((c) => c.sd));
    const spanM = Math.max(1, maxM - minM), spanS = Math.max(1, maxS - minS);
    const sx = (m) => sL + ((m - minM) / spanM) * (sw - sL - sR);
    const sy = (s) => sh - sB - ((s - minS) / spanS) * (sh - sT - sB);

    const avgChunkM = chunks.reduce((a, c) => a + c.mean, 0) / chunks.length;
    const avgChunkS = chunks.reduce((a, c) => a + c.sd, 0) / chunks.length;

    const dots = chunks.map((c, idx) => {
      const cx = sx(c.mean).toFixed(1), cy = sy(c.sd).toFixed(1);
      const isLast = idx === chunks.length - 1;
      const op = (0.3 + (idx / (chunks.length - 1)) * 0.7).toFixed(2);
      return `<circle class="chart-tip-target" cx="${cx}" cy="${cy}" r="${isLast ? 4.8 : 3.2}" fill="var(--accent-color)" opacity="${op}" stroke="${isLast ? "#fff" : "none"}" stroke-width="1.2" data-tip="${c.label}: ${formatTime(c.mean, dec)} avg • σ ${formatTime(c.sd, dec)}s" style="cursor:pointer"/>`;
    }).join("");

    scatterSvg = `
      <svg viewBox="0 0 ${sw} ${sh}" width="100%" height="134">
        <line x1="${sL}" y1="${sy(avgChunkS).toFixed(1)}" x2="${sw - sR}" y2="${sy(avgChunkS).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/>
        <line x1="${sx(avgChunkM).toFixed(1)}" y1="${sT}" x2="${sx(avgChunkM).toFixed(1)}" y2="${sh - sB}" stroke="var(--border-color)" stroke-dasharray="3 3"/>
        <line x1="${sL}" y1="${sh - sB}" x2="${sw - sR}" y2="${sh - sB}" stroke="var(--border-strong)"/>
        <line x1="${sL}" y1="${sT}" x2="${sL}" y2="${sh - sB}" stroke="var(--border-strong)"/>
        <text x="4" y="${sT + 6}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(maxS, 1)}σ</text>
        <text x="4" y="${sh - sB}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(minS, 1)}σ</text>
        <text x="${sL}" y="${sh - 6}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(minM, 1)}s</text>
        <text x="${sw - sR - 26}" y="${sh - 6}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">${formatTime(maxM, 1)}s</text>
        <text x="${sL + 4}" y="${sT + 8}" fill="var(--accent-color)" opacity="0.65" font-size="7" font-family="monospace">← Fast &amp; Steady (bottom-left)</text>
        ${dots}
      </svg>
    `;
  }

  // 6. Compact Records & Averages Matrix at the Bottom
  const sorted = [...valid].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const iqr = sorted.length >= 4 ? sorted[Math.floor(sorted.length * 0.75)] - sorted[Math.floor(sorted.length * 0.25)] : null;
  const subCount = valid.filter((t) => t <= settings.goalMs).length;
  let curStreak = 0, bestStreak = 0;
  eventSolves.forEach((s) => { if (getEffectiveMs(s) <= settings.goalMs) { curStreak++; if (curStreak > bestStreak) bestStreak = curStreak; } else curStreak = 0; });

  const fmt = (v) => (v === null ? "-" : formatTime(v, dec));
  const mo3 = eventSolves.length >= 3 ? calculateMeanOfSlice(eventSolves.slice(-3)) : null;
  const rows = [
    ["Single", formatSolve(eventSolves.slice(-1)[0], dec), fmt(best), `Worst: ${fmt(worst)}`],
    ["Mo3", fmt(mo3), fmt(getBestRollingAvg(eventSolves, 3, true)), `Median: ${fmt(median)}`],
    ["Ao5", fmt(calculateTrimmedAverage(eventSolves, 5)), fmt(getBestRollingAvg(eventSolves, 5)), `Sub-Goal: ${Math.round((subCount / valid.length) * 100)}%`],
    ["Ao12", fmt(calculateTrimmedAverage(eventSolves, 12)), fmt(getBestRollingAvg(eventSolves, 12)), `Goal Streak: ${bestStreak} (cur ${curStreak})`],
    ["Ao25 / Ao50", `${fmt(calculateTrimmedAverage(eventSolves, 25))} / ${fmt(calculateTrimmedAverage(eventSolves, 50))}`, `${fmt(getBestRollingAvg(eventSolves, 25))} / ${fmt(getBestRollingAvg(eventSolves, 50))}`, `Std Dev: ${stdDev !== null ? formatTime(stdDev, dec) + "s" : "-"}`],
    ["Ao100", fmt(calculateTrimmedAverage(eventSolves, 100)), fmt(getBestRollingAvg(eventSolves, 100)), `Consistency: ${consistency ? consistency.toFixed(1) + "%" : "-"} · IQR: ${iqr ? formatTime(iqr, dec) + "s" : "-"}`],
  ];

  advStatsBody.innerHTML = `
    <div id="adv-chart-tooltip" class="adv-chart-tooltip hidden"></div>

    <div class="charts-grid-2">
      <div class="chart-card">
        <div class="chart-title-row">
          <span>Time Brackets</span>
          <div style="display:flex; gap:0.25rem;">
            <button class="btn-mini-pill ${advBracketStep === 5000 ? "active" : ""}" data-bstep="5000" type="button">5s</button>
            <button class="btn-mini-pill ${advBracketStep === 2000 ? "active" : ""}" data-bstep="2000" type="button">2s</button>
          </div>
        </div>
        <div class="bracket-list">${bracketsHtml}</div>
      </div>

      <div class="chart-card">
        <div class="chart-title-row"><span>Improvement Trajectory</span><small>${slopeText}</small></div>
        <svg viewBox="0 0 ${trajW} ${trajH}" width="100%" height="134" style="color:var(--accent-color)">
          <line x1="${tPadL}" y1="${ty(tMax).toFixed(1)}" x2="${trajW - tPadR}" y2="${ty(tMax).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/>
          <line x1="${tPadL}" y1="${ty(tMid).toFixed(1)}" x2="${trajW - tPadR}" y2="${ty(tMid).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/>
          <line x1="${tPadL}" y1="${ty(tMin).toFixed(1)}" x2="${trajW - tPadR}" y2="${ty(tMin).toFixed(1)}" stroke="var(--border-color)" stroke-dasharray="3 3"/>
          <polyline fill="none" stroke="currentColor" stroke-opacity="0.35" stroke-dasharray="4 3" stroke-width="1.4" points="${pbPoly}" />
          <polyline fill="none" stroke="currentColor" stroke-width="2" points="${rollPoly}" />
          <text x="2" y="${ty(tMax) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${formatTime(tMax, 1)}</text>
          <text x="2" y="${ty(tMid) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${formatTime(tMid, 1)}</text>
          <text x="2" y="${ty(tMin) + 3}" fill="var(--text-muted)" font-size="8" font-family="monospace">${formatTime(tMin, 1)}</text>
          <text x="${tPadL}" y="${trajH - 4}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">#${validEntries[0].idx}</text>
          <text x="${trajW - tPadR - 24}" y="${trajH - 4}" fill="var(--text-muted)" font-size="7.5" font-family="monospace">#${validEntries[n - 1].idx}</text>
          ${trajHits.join("")}
        </svg>
        <small class="muted-text" style="font-size:0.7rem;">Solid = Rolling Ao${rollWin} • Dashed = Single PB Staircase (hover to inspect)</small>
      </div>
    </div>

    <div class="charts-grid-3">
      <div class="chart-card">
        <div class="chart-title-row"><span>Hourly Volume &amp; Speed</span><small>Fastest: ${fastestHour ? `${fmtHr(fastestHour.hr)} (${formatTime(fastestHour.sum / fastestHour.count, 2)})` : "-"}</small></div>
        <div class="tod-grid" style="grid-template-columns: repeat(${activeHours.length}, minmax(24px, 1fr))">${hourlyHtml}</div>
      </div>

      <div class="chart-card">
        <div class="chart-title-row"><span>Daily Pace Matrix</span><small>${paceSubtitle}</small></div>
        <div class="pace-grid">${paceTilesHtml}</div>
      </div>

      <div class="chart-card">
        <div class="chart-title-row"><span>Speed vs Consistency</span><small>${chunkSize}-solve blocks</small></div>
        ${scatterSvg}
      </div>
    </div>

    <div class="records-table-wrap">
      <table class="records-table">
        <thead><tr><th>Metric</th><th>Current</th><th>Best Ever</th><th>Details</th></tr></thead>
        <tbody>${rows.map(([m, c, b, note]) => `<tr><td>${m}</td><td class="num">${c}</td><td class="num">${b}</td><td style="color:var(--text-secondary)">${note}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  `;

  advStatsBody.querySelectorAll("[data-bstep]").forEach((btn) => {
    btn.addEventListener("click", () => {
      advBracketStep = Number(btn.dataset.bstep);
      renderAdvancedStats(eventSolves);
    });
  });

  const tipEl = $("adv-chart-tooltip");
  advStatsBody.querySelectorAll(".chart-tip-target").forEach((el) => {
    el.addEventListener("pointerenter", (e) => {
      tipEl.textContent = el.dataset.tip;
      tipEl.classList.remove("hidden");
      const rect = advStatsDrawer.getBoundingClientRect();
      tipEl.style.left = `${Math.min(rect.width - 140, Math.max(120, e.clientX - rect.left))}px`;
      tipEl.style.top = `${Math.max(48, e.clientY - rect.top - 14)}px`;
    });
    el.addEventListener("pointerleave", () => tipEl.classList.add("hidden"));
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
  const best = calculateBest(eventSolves), ao5 = calculateTrimmedAverage(eventSolves, 5);
  const ao12 = calculateTrimmedAverage(eventSolves, 12), mean = calculateSessionMean(eventSolves);

  statBestEl.textContent = best === null ? "-" : formatTime(best, dec);
  statAo5El.textContent = ao5 === null ? "-" : formatTime(ao5, dec);
  statAo12El.textContent = ao12 === null ? "-" : formatTime(ao12, dec);
  statMeanEl.textContent = mean === null ? "-" : formatTime(mean, dec);
  statCountEl.textContent = String(eventSolves.length);

  topbarEventPill.textContent = EVENT_TO_PUZZLE[settings.event] || settings.event.toUpperCase();
  topbarAo5Pill.textContent = ao5 === null ? "Ao5: -" : `Ao5: ${formatTime(ao5, dec)}`;

  renderSparkline(eventSolves);
  renderGoal(ao5);
  renderAdvancedStats(eventSolves);

  const latest = eventSolves[eventSolves.length - 1];
  if (latest && timerState !== "running" && timerState !== "holding" && timerState !== "ready" && timerState !== "inspecting") {
    lastSolveActions.classList.remove("hidden");
    lastPlus2Btn.classList.toggle("active", latest.penalty === "+2");
    lastDnfBtn.classList.toggle("active", latest.penalty === "DNF");
    if (timerState === "idle") timerDisplay.textContent = formatSolve(latest, dec);
  } else {
    lastSolveActions.classList.add("hidden");
    if (timerState === "idle") timerDisplay.textContent = formatTime(0, dec);
  }

  solveListEl.innerHTML = "";
  for (let i = eventSolves.length - 1; i >= 0; i--) {
    const solve = eventSolves[i], li = document.createElement("li");
    li.className = "solve-item";
    li.innerHTML = `
      <span class="solve-index">${i + 1}.</span>
      <span class="solve-time">${formatSolve(solve, dec)}</span>
      <div class="solve-item-actions">
        <button class="mini-btn ${solve.penalty === "+2" ? "active" : ""}" data-act="+2" type="button">+2</button>
        <button class="mini-btn ${solve.penalty === "DNF" ? "active" : ""}" data-act="DNF" type="button">DNF</button>
        <button class="mini-btn" data-act="del" type="button">×</button>
      </div>
    `;
    li.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-act]");
      if (btn) {
        e.stopPropagation();
        if (btn.dataset.act === "+2") togglePenalty(solve.id, "+2");
        if (btn.dataset.act === "DNF") togglePenalty(solve.id, "DNF");
        if (btn.dataset.act === "del") deleteSolve(solve.id);
        return;
      }
      openSolveModal(solve.id);
    });
    solveListEl.appendChild(li);
  }
}

advStatsToggle.addEventListener("click", () => {
  advStatsToggle.blur();
  advStatsOpen = !advStatsOpen;
  advStatsDrawer.classList.toggle("hidden", !advStatsOpen);
});
closeAdvStatsBtn.addEventListener("click", () => {
  advStatsOpen = false;
  advStatsDrawer.classList.add("hidden");
});

// === SECTION A9: METHOD-SYNCED GUIDES & ALG LEARNER ===
function syncMethodViews() {
  const method = METHOD_GUIDES[settings.profileMethod] ? settings.profileMethod : "CFOP";
  guideNavTab.textContent = `${method} Guide`;
  algPageTitle.textContent = `Alg Learner (${method})`;

  const algs = METHOD_ALGS[method] || METHOD_ALGS.CFOP;
  const cats = ["ALL", ...new Set(algs.map((a) => a.cat))];
  activeAlgFilter = "ALL";
  selectedAlgId = algs[0]?.id;

  algFilterPills.innerHTML = cats.map((c, idx) =>
    `<button class="btn-pill ${idx === 0 ? "active" : ""}" data-cat="${c}" type="button">${c === "ALL" ? "All" : c}</button>`
  ).join("");

  const guide = METHOD_GUIDES[method];
  selectedStageId = guide.stages[0].id;
  renderAlgs();
  renderGuide();
}

function renderAlgs() {
  const method = METHOD_ALGS[settings.profileMethod] ? settings.profileMethod : "CFOP";
  const list = METHOD_ALGS[method];
  const filtered = activeAlgFilter === "ALL" ? list : list.filter((a) => a.cat === activeAlgFilter);
  algGrid.innerHTML = "";

  filtered.forEach((item) => {
    const isLearned = learnedAlgs.includes(item.id);
    const card = document.createElement("div");
    card.className = `alg-card ${item.id === selectedAlgId ? "selected" : ""}`;
    card.innerHTML = `
      <div class="alg-card-top"><span class="alg-name">${item.name}</span><span class="alg-tag">${item.cat}</span></div>
      <div class="alg-moves">${item.alg}</div>
      <p class="alg-tip">${item.tip}</p>
      <div class="alg-card-footer">
        <button class="btn-outline" data-act="play" type="button">Preview 3D</button>
        <button class="btn-pill ${isLearned ? "active" : ""}" data-act="learn" type="button">${isLearned ? "✓ Learned" : "Mark Learned"}</button>
      </div>
    `;
    card.addEventListener("click", (e) => {
      if (e.target.closest('button[data-act="learn"]')) {
        e.stopPropagation();
        learnedAlgs = learnedAlgs.includes(item.id) ? learnedAlgs.filter((x) => x !== item.id) : [...learnedAlgs, item.id];
        localStorage.setItem(STORAGE_LEARNED_KEY, JSON.stringify(learnedAlgs));
        renderAlgs();
        return;
      }
      selectedAlgId = item.id; loadAlgSimulator(item); renderAlgs();
    });
    algGrid.appendChild(card);
  });

  const current = list.find((a) => a.id === selectedAlgId) || list[0];
  if (current) loadAlgSimulator(current);
}

function loadAlgSimulator(item) {
  algSimTitle.textContent = item.name; algSimCat.textContent = item.cat;
  algSimMoves.textContent = item.alg; algSimTip.textContent = item.tip;
  algPlayer.setAttribute("experimental-stickering", item.stickering);
  algPlayer.setAttribute("alg", item.alg);
  try { algPlayer.experimentalStickering = item.stickering; algPlayer.alg = item.alg; algPlayer.timestamp = 0; } catch {}
}

algFilterPills.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-cat]");
  if (!btn) return;
  activeAlgFilter = btn.dataset.cat;
  algFilterPills.querySelectorAll("button").forEach((b) => b.classList.toggle("active", b === btn));
  renderAlgs();
});

function renderGuide() {
  const guide = METHOD_GUIDES[settings.profileMethod] || METHOD_GUIDES.CFOP;
  guidePageTitle.textContent = guide.title;
  guidePageSubtitle.textContent = guide.subtitle;
  stageList.innerHTML = "";

  guide.stages.forEach((stage) => {
    const card = document.createElement("div");
    card.className = `stage-card ${stage.id === selectedStageId ? "active" : ""}`;
    card.innerHTML = `
      <div class="stage-header"><span class="stage-title">${stage.title}</span><span class="stage-split">${stage.split}</span></div>
      <ul class="stage-points">${stage.points.map((p) => `<li>${p}</li>`).join("")}</ul>
    `;
    card.addEventListener("click", () => { selectedStageId = stage.id; loadStageSimulator(stage); renderGuide(); });
    stageList.appendChild(card);
  });

  const activeStage = guide.stages.find((s) => s.id === selectedStageId) || guide.stages[0];
  loadStageSimulator(activeStage);
}

function loadStageSimulator(stage) {
  stageSimTitle.textContent = stage.title; stageSimBadge.textContent = stage.split;
  stagePlayer.setAttribute("experimental-stickering", stage.stickering);
  stagePlayer.setAttribute("alg", stage.alg);
  try { stagePlayer.experimentalStickering = stage.stickering; stagePlayer.alg = stage.alg; stagePlayer.timestamp = 0; } catch {}
}

// === SECTION A10: NAVIGATION, IMPORT/EXPORT, SETTINGS & PROFILE ===
navTabs.forEach((btn) => btn.addEventListener("click", () => {
  if (timerState === "running") return;
  activeTab = btn.dataset.tab;
  navTabs.forEach((b) => b.classList.toggle("active", b === btn));
  viewTimer.classList.toggle("hidden", activeTab !== "timer");
  viewAlgs.classList.toggle("hidden", activeTab !== "algs");
  viewGuide.classList.toggle("hidden", activeTab !== "guide");
  btn.blur();
}));

function togglePenalty(id, type) {
  const s = solves.find((x) => x.id === id);
  if (!s) return;
  s.penalty = s.penalty === type ? null : type;
  saveSolves(); renderAll();
  if (selectedSolveId === id) openSolveModal(id);
}

function deleteSolve(id) {
  solves = solves.filter((x) => x.id !== id);
  saveSolves();
  if (selectedSolveId === id) closeModals();
  renderAll();
}

eventSelect.addEventListener("change", () => {
  settings.event = eventSelect.value; eventSelect.blur();
  prefetchedScramble = null; prefetchedEvent = null;
  saveSettings(); renderAll(); loadNextScramble(settings.event);
});
trendRangeSelect.addEventListener("change", () => { updateSetting("trendRange", trendRangeSelect.value); trendRangeSelect.blur(); });
trendFlattenBtn.addEventListener("click", () => { trendFlattenBtn.blur(); updateSetting("trendFlatten", !settings.trendFlatten); });
inspTogglePill.addEventListener("click", () => {
  inspTogglePill.blur();
  if (timerState !== "idle") return;
  updateSetting("inspection", !settings.inspection);
});

newScrambleBtn.addEventListener("click", () => { newScrambleBtn.blur(); loadNextScramble(settings.event); });
copyScrambleBtn.addEventListener("click", async () => {
  copyScrambleBtn.blur();
  if (!currentScramble) return;
  try { await navigator.clipboard.writeText(currentScramble); showToast("Scramble copied"); } catch {}
});
editGoalBtn.addEventListener("click", () => {
  editGoalBtn.blur();
  const val = prompt("Enter target Ao5 in seconds (e.g. 12.5):", (settings.goalMs / 1000).toFixed(2));
  if (val === null) return;
  const num = parseFloat(val);
  if (!Number.isNaN(num) && num > 0) updateSetting("goalMs", Math.round(num * 1000));
});

lastPlus2Btn.addEventListener("click", () => { const l = getCurrentEventSolves().slice(-1)[0]; if (l) togglePenalty(l.id, "+2"); });
lastDnfBtn.addEventListener("click", () => { const l = getCurrentEventSolves().slice(-1)[0]; if (l) togglePenalty(l.id, "DNF"); });
lastDelBtn.addEventListener("click", () => { const l = getCurrentEventSolves().slice(-1)[0]; if (l) deleteSolve(l.id); });

clearSessionBtn.addEventListener("click", () => {
  const list = getCurrentEventSolves();
  if (!list.length || !confirm(`Clear all ${list.length} solves for ${settings.event}?`)) return;
  solves = solves.filter((s) => s.event !== settings.event);
  saveSolves(); renderAll();
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(solves, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `algtimer-solves-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  URL.revokeObjectURL(url);
});

const triggerImport = () => { importFileInput.value = ""; importFileInput.click(); };
importBtn.addEventListener("click", () => { importBtn.blur(); triggerImport(); });
settingsImportBtn.addEventListener("click", () => { settingsImportBtn.blur(); triggerImport(); });

importFileInput.addEventListener("change", async () => {
  const file = importFileInput.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    let importedCount = 0, skippedDupes = 0;
    const eventCounts = {};
    const makeKey = (s) => `${s.event}|${s.rawMs}|${s.penalty || ""}|${s.scramble || ""}|${s.createdAt}`;
    const existingKeys = new Set(solves.map(makeKey));

    if (Array.isArray(data)) {
      for (const item of data) {
        if (!item || typeof item.rawMs !== "number") continue;
        const s = {
          id: item.id || String(Date.now() + Math.random()),
          event: EVENT_TO_PUZZLE[item.event] ? item.event : "333",
          rawMs: Math.max(1, Math.round(item.rawMs)),
          penalty: item.penalty === "+2" || item.penalty === "DNF" ? item.penalty : null,
          scramble: typeof item.scramble === "string" ? item.scramble : "",
          createdAt: typeof item.createdAt === "number" ? item.createdAt : Date.now(),
        };
        if (existingKeys.has(makeKey(s))) { skippedDupes++; continue; }
        existingKeys.add(makeKey(s)); solves.push(s); importedCount++;
        eventCounts[s.event] = (eventCounts[s.event] || 0) + 1;
      }
    } else if (data && typeof data === "object") {
      let sData = {};
      if (typeof data.properties?.sessionData === "string") { try { sData = JSON.parse(data.properties.sessionData); } catch {} }
      else if (data.properties?.sessionData) sData = data.properties.sessionData;

      for (const [key, list] of Object.entries(data)) {
        const match = key.match(/^session(\d+)$/);
        if (!match || !Array.isArray(list)) continue;
        const scrType = sData[match[1]]?.opt?.scrType || "333";
        const mappedEvent = CSTIMER_EVENT_MAP[scrType] || "333";

        for (const entry of list) {
          if (!Array.isArray(entry) || !Array.isArray(entry[0])) continue;
          const [flag, timeMs] = entry[0];
          if (typeof timeMs !== "number" || timeMs <= 0) continue;
          const s = {
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
            event: mappedEvent, rawMs: Math.round(timeMs),
            penalty: flag === -1 ? "DNF" : flag === 2000 ? "+2" : null,
            scramble: typeof entry[1] === "string" ? entry[1] : "",
            createdAt: typeof entry[3] === "number" ? entry[3] * 1000 : Date.now(),
          };
          if (existingKeys.has(makeKey(s))) { skippedDupes++; continue; }
          existingKeys.add(makeKey(s)); solves.push(s); importedCount++;
          eventCounts[mappedEvent] = (eventCounts[mappedEvent] || 0) + 1;
        }
      }
    } else throw new Error("Bad file");

    solves.sort((a, b) => a.createdAt - b.createdAt);
    saveSolves();
    const topEv = Object.entries(eventCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topEv && !eventCounts[settings.event]) {
      settings.event = topEv; eventSelect.value = topEv; saveSettings(); loadNextScramble(topEv);
    }
    renderAll();
    showToast(`Imported ${importedCount} solves${skippedDupes ? ` (${skippedDupes} dupes skipped)` : ""}`);
  } catch { showToast("Could not parse file. Export a JSON/txt backup from csTimer."); }
});

function openSolveModal(id) {
  const s = solves.find((x) => x.id === id);
  if (!s) return;
  selectedSolveId = id;
  solveModalTime.textContent = formatSolve(s, settings.decimals);
  solveModalMeta.textContent = `${s.event.toUpperCase()} • ${new Date(s.createdAt).toLocaleString()}`;
  solveModalScramble.textContent = s.scramble || "(no scramble recorded)";
  modalPlus2Btn.classList.toggle("active", s.penalty === "+2");
  modalDnfBtn.classList.toggle("active", s.penalty === "DNF");
  solveModal.classList.remove("hidden");
}

modalPlus2Btn.addEventListener("click", () => selectedSolveId && togglePenalty(selectedSolveId, "+2"));
modalDnfBtn.addEventListener("click", () => selectedSolveId && togglePenalty(selectedSolveId, "DNF"));
modalDelBtn.addEventListener("click", () => selectedSolveId && deleteSolve(selectedSolveId));
closeSolveModalBtn.addEventListener("click", closeModals);

settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
closeSettingsBtn.addEventListener("click", closeModals);
profileBtn.addEventListener("click", () => {
  profileNameInput.value = settings.profileName;
  profileMethodSelect.value = settings.profileMethod;
  profileModal.classList.remove("hidden");
});
closeProfileBtn.addEventListener("click", closeModals);
saveProfileBtn.addEventListener("click", () => {
  settings.profileName = profileNameInput.value.trim() || "Cuber";
  const methodChanged = settings.profileMethod !== profileMethodSelect.value;
  settings.profileMethod = profileMethodSelect.value;
  saveSettings(); applySettingsToUI();
  if (methodChanged) syncMethodViews();
  closeModals();
  showToast(`Profile saved (${settings.profileMethod})`);
});

[settingsModal, solveModal, profileModal].forEach((m) => m.addEventListener("click", (e) => { if (e.target === m) closeModals(); }));
themeModal.addEventListener("click", (e) => { if (e.target === themeModal) cancelThemeStudio(); });
function closeModals() { settingsModal.classList.add("hidden"); solveModal.classList.add("hidden"); profileModal.classList.add("hidden"); selectedSolveId = null; }

function applySettingsToUI() {
  const root = document.documentElement.style;
  root.setProperty("--timer-size", `${settings.timerSize}rem`);
  root.setProperty("--scramble-size", `${settings.scrambleSize}rem`);
  root.setProperty("--sidebar-width", `${settings.sidebarWidth}px`);
  document.body.classList.toggle("focus-extra-blur", settings.focusBgBehavior === "blur");
  document.body.classList.toggle("focus-dim", settings.focusBgBehavior === "dim");

  holdDelayInput.value = settings.holdDelayMs; holdDelayValue.textContent = `${settings.holdDelayMs}ms`;
  decimalsSeg.querySelectorAll(".seg-btn").forEach((b) => b.classList.toggle("active", Number(b.dataset.dec) === settings.decimals));
  inspEnabledInput.checked = Boolean(settings.inspection);
  inspAudioInput.checked = Boolean(settings.inspectionAudio);
  inspTogglePill.textContent = settings.inspection ? "Insp: 15s" : "Insp: Off";
  inspTogglePill.classList.toggle("active", Boolean(settings.inspection));
  trendFlattenBtn.classList.toggle("active", Boolean(settings.trendFlatten));

  focusModeInput.checked = settings.focusMode; focusBgSelect.value = settings.focusBgBehavior;
  timerSizeInput.value = settings.timerSize; timerSizeValue.textContent = `${settings.timerSize}rem`;
  scrambleSizeInput.value = settings.scrambleSize; scrambleSizeValue.textContent = `${settings.scrambleSize}rem`;
  sidebarWidthInput.value = settings.sidebarWidth; sidebarWidthValue.textContent = `${settings.sidebarWidth}px`;
  profileNameLabel.textContent = settings.profileName;
  profileAvatar.textContent = (settings.profileName[0] || "C").toUpperCase();

  if (timerState === "idle") {
    timerHintText.textContent = settings.inspection ? "Tap SPACE or CLICK to inspect (15s)" : "Hold SPACE or CLICK to ready";
  }
}

function updateSetting(key, value) { settings[key] = value; saveSettings(); applySettingsToUI(); renderAll(); }
holdDelayInput.addEventListener("input", () => updateSetting("holdDelayMs", Number(holdDelayInput.value)));
decimalsSeg.addEventListener("click", (e) => { const b = e.target.closest("button[data-dec]"); if (b) updateSetting("decimals", Number(b.dataset.dec)); });
inspEnabledInput.addEventListener("change", () => updateSetting("inspection", inspEnabledInput.checked));
inspAudioInput.addEventListener("change", () => updateSetting("inspectionAudio", inspAudioInput.checked));
focusModeInput.addEventListener("change", () => updateSetting("focusMode", focusModeInput.checked));
focusBgSelect.addEventListener("change", () => updateSetting("focusBgBehavior", focusBgSelect.value));
timerSizeInput.addEventListener("input", () => updateSetting("timerSize", Number(timerSizeInput.value)));
scrambleSizeInput.addEventListener("input", () => updateSetting("scrambleSize", Number(scrambleSizeInput.value)));
sidebarWidthInput.addEventListener("input", () => updateSetting("sidebarWidth", Number(sidebarWidthInput.value)));

function saveSolves() { localStorage.setItem(STORAGE_SOLVES_KEY, JSON.stringify(solves)); }
function saveSettings() { localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings)); }
function loadArray(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}
function loadJSON(key, fallback, merge = false) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return fallback;
    return merge ? { ...fallback, ...parsed } : parsed;
  } catch { return fallback; }
}

init();