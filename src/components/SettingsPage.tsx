import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface PersistedSettings {
  open_at_login: boolean;
  minimize_to_tray: boolean;
  [key: string]: unknown;
}

interface SettingsPageProps {
  openAtLogin: boolean;
  minimizeToTray: boolean;
  onBack: () => void;
}

export function SettingsPage({ openAtLogin, minimizeToTray, onBack }: SettingsPageProps) {
  const [loginEnabled, setLoginEnabled] = useState(openAtLogin);
  const [minimizeEnabled, setMinimizeEnabled] = useState(minimizeToTray);
  const [saving, setSaving] = useState(false);

  const handleLoginToggle = async () => {
    const next = !loginEnabled;
    setLoginEnabled(next);
    setSaving(true);
    await invoke("set_autostart", { enabled: next });
    const existing = await invoke<PersistedSettings>("load_settings");
    await invoke("save_settings", { settings: { ...existing, open_at_login: next } });
    setSaving(false);
  };

  const handleMinimizeToggle = async () => {
    const next = !minimizeEnabled;
    setMinimizeEnabled(next);
    setSaving(true);
    const existing = await invoke<PersistedSettings>("load_settings");
    await invoke("save_settings", { settings: { ...existing, minimize_to_tray: next } });
    setSaving(false);
  };

  function ToggleRow({
    title,
    description,
    enabled,
    onToggle,
  }: {
    title: string;
    description: string;
    enabled: boolean;
    onToggle: () => void;
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
        }}
      >
        <div style={{ flex: 1, minWidth: 0, paddingRight: 16 }}>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            {title}
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--text-muted)", lineHeight: 1.4 }}>
            {description}
          </p>
        </div>
        <button
          onClick={onToggle}
          disabled={saving}
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
          title="Open at Login"
          description="Launch PomoPivot automatically when you log in"
          enabled={loginEnabled}
          onToggle={handleLoginToggle}
        />

        <ToggleRow
          title="Minimize to Tray"
          description="Keep running in the background when minimized"
          enabled={minimizeEnabled}
          onToggle={handleMinimizeToggle}
        />
      </div>
    </div>
  );
}
