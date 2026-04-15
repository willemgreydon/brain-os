import type { Surface, WorkspaceMode } from "./app-shell";

export type ThemeMode = "light" | "dark" | "system";
export type DensityMode = "comfortable" | "compact" | "dense";

export type BrainSettings = {
  themeMode: ThemeMode;
  densityMode: DensityMode;
  uiScale: number;
  appFontSize: number;
  editorFontSize: number;
  editorLineHeight: number;
  reducedMotion: boolean;
  highContrast: boolean;
  dyslexiaFont: boolean;
  visibleFocus: boolean;
  reducedTransparency: boolean;
  largeText: boolean;
  keyboardHints: boolean;
  screenReaderMode: boolean;
  graphContrast: number;
  defaultSurface: Surface;
  defaultWorkspaceMode: WorkspaceMode;
  telemetryEnabled: boolean;
  aiDataConsent: boolean;
  offlineMode: boolean;
};

export const DEFAULT_SETTINGS: BrainSettings = {
  themeMode: "light",
  densityMode: "compact",
  uiScale: 1,
  appFontSize: 13,
  editorFontSize: 13,
  editorLineHeight: 1.5,
  reducedMotion: false,
  highContrast: false,
  dyslexiaFont: false,
  visibleFocus: true,
  reducedTransparency: false,
  largeText: false,
  keyboardHints: true,
  screenReaderMode: false,
  graphContrast: 1,
  defaultSurface: "workspace",
  defaultWorkspaceMode: "content",
  telemetryEnabled: false,
  aiDataConsent: false,
  offlineMode: true,
};

const STORAGE_KEY = "brain-os-settings-v1";

export function loadSettings(): BrainSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;

    const parsed = JSON.parse(raw) as Partial<BrainSettings>;
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: BrainSettings) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore persistence errors
  }
}

export function applySettingsToDocument(settings: BrainSettings) {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  const resolvedTheme =
    settings.themeMode === "system"
      ? window.matchMedia?.("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : settings.themeMode;

  root.dataset.theme = resolvedTheme;
  root.dataset.density = settings.densityMode;
  root.dataset.reducedMotion = settings.reducedMotion ? "true" : "false";
  root.dataset.highContrast = settings.highContrast ? "true" : "false";
  root.dataset.visibleFocus = settings.visibleFocus ? "true" : "false";
  root.dataset.dyslexiaFont = settings.dyslexiaFont ? "true" : "false";
  root.dataset.reducedTransparency = settings.reducedTransparency ? "true" : "false";
  root.dataset.largeText = settings.largeText ? "true" : "false";
  root.dataset.screenReaderMode = settings.screenReaderMode ? "true" : "false";

  root.style.setProperty("--ui-scale", settings.uiScale.toString());
  root.style.setProperty("--app-font-size", `${settings.appFontSize}px`);
  root.style.setProperty("--editor-font-size", `${settings.editorFontSize}px`);
  root.style.setProperty("--editor-line-height", settings.editorLineHeight.toString());
  root.style.setProperty("--graph-contrast", settings.graphContrast.toString());
}
