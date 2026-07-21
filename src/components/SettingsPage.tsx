import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";

interface PersistedSettings {
  open_at_login: boolean;
  minimize_to_tray: boolean;
  [key: string]: unknown;
}

interface SettingsPageProps {
  openAtLogin: boolean;
  minimizeToTray: boolean;
  onBack: () => void;
  /** Called immediately when any setting changes so parent state stays in sync */
  onSettingChange: (key: "open_at_login" | "minimize_to_tray", value: boolean) => void;
}

export function SettingsPage({ openAtLogin, minimizeToTray, onBack, onSettingChange }: SettingsPageProps) {
  const [loginEnabled, setLoginEnabled] = useState(openAtLogin);
  const [minimizeEnabled, setMinimizeEnabled] = useState(minimizeToTray);
  const [saving, setSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null);

  // Keep local state in sync if parent props change (e.g. on first load)
  useEffect(() => { setLoginEnabled(openAtLogin); }, [openAtLogin]);
  useEffect(() => { setMinimizeEnabled(minimizeToTray); }, [minimizeToTray]);

  const flashSaved = (key: string) => {
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2000);
  };

  const handleLoginToggle = async () => {
    const next = !loginEnabled;
    setLoginEnabled(next);
    setSaving(true);
    await invoke("set_autostart", { enabled: next });
    const existing = await invoke<PersistedSettings>("load_settings");
    await invoke("save_settings", { settings: { ...existing, open_at_login: next } });
    onSettingChange("open_at_login", next);
    flashSaved("login");
    setSaving(false);
  };

  const handleMinimizeToggle = async () => {
    const next = !minimizeEnabled;
    setMinimizeEnabled(next);
    setSaving(true);
    const existing = await invoke<PersistedSettings>("load_settings");
    await invoke("save_settings", { settings: { ...existing, minimize_to_tray: next } });
    onSettingChange("minimize_to_tray", next);
    flashSaved("minimize");
    setSaving(false);
  };

  function ToggleRow({
    id,
    title,
    description,
    enabled,
    onToggle,
    saved,
  }: {
    id: string;
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
    saved: boolean;
  }) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 12,
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "box-shadow 0.2s",
          boxShadow: saved ? "0 0 0 1.5px var(--accent-success)" : "none",
        }}
      >
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
              {title}
            </p>
            {/* Inline "Saved" badge */}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--accent-success)",
                opacity: saved ? 1 : 0,
                transform: saved ? "translateY(0)" : "translateY(-4px)",
                transition: "opacity 0.25s, transform 0.25s",
                letterSpacing: "0.03em",
              }}
            >
              ✓ Saved
            </span>
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
        <button
          id={id}
          onClick={onToggle}
          disabled={saving}
          aria-pressed={enabled}
          style={{
            width: 44,
            height: 24,
            border: "none",
            borderRadius: 12,
            cursor: "pointer",
            position: "relative",
            flexShrink: 0,
            background: enabled ? "var(--accent-primary)" : "#3a3c5a",
            transition: "background 0.2s",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: 3,
              left: enabled ? 23 : 3,
              transition: "left 0.2s ease, transform 0.15s",
              boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
            }}
          />
        </button>
      </div>
    );
  }

  return (
    <div className="panel-setup">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "var(--text-secondary)",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
        </button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          Settings
        </h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <ToggleRow
          id="toggle-open-at-login"
          title="Open at Login"
          description="Launch PomoPivot automatically when you log in"
          enabled={loginEnabled}
          onToggle={handleLoginToggle}
          saved={savedKey === "login"}
        />

        <ToggleRow
          id="toggle-minimize-to-tray"
          title="Minimize to Tray"
          description="Keep running in the background when minimized"
          enabled={minimizeEnabled}
          onToggle={handleMinimizeToggle}
          saved={savedKey === "minimize"}
        />
      </div>
    </div>
  );
}
