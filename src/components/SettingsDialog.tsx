import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

interface SettingsDialogProps {
  openAtLogin: boolean;
  onSave: (openAtLogin: boolean) => void;
  onCancel: () => void;
}

export function SettingsDialog({ openAtLogin, onSave, onCancel }: SettingsDialogProps) {
  const [enabled, setEnabled] = useState(openAtLogin);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await invoke("set_autostart", { enabled });
    onSave(enabled);
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          borderRadius: 16,
          padding: 28,
          width: 340,
          display: "flex",
          flexDirection: "column",
          gap: 24,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
          Settings
        </h2>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
              Open at Login
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>
              Launch PomoPivot automatically when you log in
            </p>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            style={{
              width: 44,
              height: 24,
              border: "none",
              borderRadius: 12,
              cursor: "pointer",
              position: "relative",
              background: enabled ? "var(--accent-primary)" : "#3a3c5a",
              transition: "background 0.15s",
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
                transition: "left 0.15s",
              }}
            />
          </button>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: 10,
              background: "rgba(255,255,255,0.1)",
              color: "var(--text-secondary)",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "10px 24px",
              border: "none",
              borderRadius: 10,
              background: "var(--accent-primary)",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              fontFamily: "inherit",
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
