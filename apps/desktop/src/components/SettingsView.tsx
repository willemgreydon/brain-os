import React from "react";

type BrainSettings = {
  themeMode: "light" | "dark" | "system";
  densityMode: "comfortable" | "compact" | "dense";
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
  telemetryEnabled: boolean;
  aiDataConsent: boolean;
  offlineMode: boolean;
};

export function SettingsView({
  settings,
  setSettings,
}: {
  settings: BrainSettings;
  setSettings: React.Dispatch<React.SetStateAction<BrainSettings>>;
}) {
  function update<K extends keyof BrainSettings>(key: K, value: BrainSettings[K]) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  }

  return (
    <div className="surface-grid">
      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Appearance</p>
        </div>

        <div className="form-grid">
          <label className="field">
            <span>Theme</span>
            <select value={settings.themeMode} onChange={(e) => update("themeMode", e.target.value as BrainSettings["themeMode"])}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>

          <label className="field">
            <span>Density</span>
            <select value={settings.densityMode} onChange={(e) => update("densityMode", e.target.value as BrainSettings["densityMode"])}>
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
              <option value="dense">Dense</option>
            </select>
          </label>

          <label className="field">
            <span>App font size</span>
            <input type="range" min={12} max={18} step={1} value={settings.appFontSize} onChange={(e) => update("appFontSize", Number(e.target.value))} />
          </label>

          <label className="field">
            <span>Editor font size</span>
            <input type="range" min={12} max={18} step={1} value={settings.editorFontSize} onChange={(e) => update("editorFontSize", Number(e.target.value))} />
          </label>

          <label className="field">
            <span>UI scale</span>
            <input type="range" min={0.9} max={1.25} step={0.05} value={settings.uiScale} onChange={(e) => update("uiScale", Number(e.target.value))} />
          </label>

          <label className="field">
            <span>Editor line height</span>
            <input type="range" min={1.35} max={1.9} step={0.05} value={settings.editorLineHeight} onChange={(e) => update("editorLineHeight", Number(e.target.value))} />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Accessibility</p>
        </div>

        <div className="toggle-grid">
          <label className="toggle"><input type="checkbox" checked={settings.highContrast} onChange={(e) => update("highContrast", e.target.checked)} /><span>High contrast</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.reducedMotion} onChange={(e) => update("reducedMotion", e.target.checked)} /><span>Reduced motion</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.largeText} onChange={(e) => update("largeText", e.target.checked)} /><span>Large text</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.visibleFocus} onChange={(e) => update("visibleFocus", e.target.checked)} /><span>Visible focus rings</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.dyslexiaFont} onChange={(e) => update("dyslexiaFont", e.target.checked)} /><span>Dyslexia-friendly font</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.reducedTransparency} onChange={(e) => update("reducedTransparency", e.target.checked)} /><span>Reduced transparency</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.keyboardHints} onChange={(e) => update("keyboardHints", e.target.checked)} /><span>Keyboard hints</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.screenReaderMode} onChange={(e) => update("screenReaderMode", e.target.checked)} /><span>Screen reader mode</span></label>
        </div>
      </section>

      <section className="panel">
        <div className="panel__head">
          <p className="panel__kicker">Privacy + AI</p>
        </div>

        <div className="toggle-grid">
          <label className="toggle"><input type="checkbox" checked={settings.offlineMode} onChange={(e) => update("offlineMode", e.target.checked)} /><span>Offline mode</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.telemetryEnabled} onChange={(e) => update("telemetryEnabled", e.target.checked)} /><span>Telemetry enabled</span></label>
          <label className="toggle"><input type="checkbox" checked={settings.aiDataConsent} onChange={(e) => update("aiDataConsent", e.target.checked)} /><span>AI data consent</span></label>
        </div>
      </section>
    </div>
  );
}
