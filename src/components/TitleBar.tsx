import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

interface TitleBarProps {
  onMinimizeToTray: () => void;
  onMinimize: () => void;
  onClose?: () => void;
  onOpenSettings: () => void;
}

type Platform = "mac" | "windows" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (ua.includes("Mac OS")) return "mac";
  if (ua.includes("Windows")) return "windows";
  return "other";
}

export function TitleBar({ onMinimizeToTray, onMinimize, onClose, onOpenSettings }: TitleBarProps) {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const appWindow = getCurrentWindow();

  const handleMinimize = () => {
    onMinimize();
  };

  const handleMaximize = async () => {
    if (platform === "mac") {
      const fullscreen = await appWindow.isFullscreen();
      appWindow.setFullscreen(!fullscreen);
    } else {
      appWindow.toggleMaximize();
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else appWindow.close();
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      appWindow.startDragging();
    }
  };

  const buttonStyle: React.CSSProperties = {
    width: 36,
    height: 36,
    border: "none",
    background: "transparent",
    color: "var(--text-secondary)",
    cursor: "pointer",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 14,
  };

  if (platform === "mac") {
    return <MacTitleBar onClose={handleClose} onMinimize={handleMinimize} onMaximize={handleMaximize} onOpenSettings={onOpenSettings} />;
  }

  return (
    <WindowsTitleBar
      onMinimizeToTray={onMinimizeToTray}
      onMinimize={handleMinimize}
      onClose={handleClose}
      onOpenSettings={onOpenSettings}
      onDragStart={handleDragStart}
      buttonStyle={buttonStyle}
    />
  );
}

/* ─── macOS: traffic light buttons on the left ─── */

const trafficBtn: React.CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: "50%",
  border: "none",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const trafficIcon = (d: string) => (
  <svg width="6" height="6" viewBox="0 0 6 6" fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="0.8">
    <path d={d} />
  </svg>
);

function MacTitleBar({
  onClose,
  onMinimize,
  onMaximize,
  onOpenSettings,
}: {
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div
      style={{
        height: 38,
        display: "flex",
        alignItems: "center",
        padding: "0 8px",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <div
        style={{ display: "flex", gap: 8, alignItems: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button style={{ ...trafficBtn, background: "#ff5f5a" }} onClick={onClose} title="Close">
          {trafficIcon("M1 1l4 4M5 1l-4 4")}
        </button>
        <button style={{ ...trafficBtn, background: "#ffbd2e" }} onClick={onMinimize} title="Minimize">
          {trafficIcon("M1 3h4")}
        </button>
        <button style={{ ...trafficBtn, background: "#28c840" }} onClick={onMaximize} title="Zoom">
          {trafficIcon("M1 1h4v4H1z")}
        </button>
      </div>

      <div
        data-tauri-drag-region
        onMouseDown={(e) => {
          if (e.buttons === 1) getCurrentWindow().startDragging();
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          flex: 1,
          height: "100%",
        }}
      >
        <img
          src="/wordmark.png"
          alt="PomoPivot"
          style={{ height: 16, width: "auto", objectFit: "contain", flexShrink: 0 }}
          draggable={false}
        />
      </div>

      <ChromeButton onClick={onOpenSettings} style={{ ...settingsBtnStyle }} tooltip="Settings">
        <SettingsIcon />
      </ChromeButton>
    </div>
  );
}

/* ─── Windows: current style with buttons on the right ─── */

function WindowsTitleBar({
  onMinimizeToTray,
  onMinimize,
  onClose,
  onOpenSettings,
  onDragStart,
  buttonStyle,
}: {
  onMinimizeToTray: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onOpenSettings: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  buttonStyle: React.CSSProperties;
}) {
  return (
    <div
      style={{
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 8px 0 16px",
        userSelect: "none",
        flexShrink: 0,
      }}
    >
      <div
        data-tauri-drag-region
        onMouseDown={onDragStart}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: "100%",
          flex: 1,
        }}
      >
        <img
          src="/wordmark.png"
          alt="PomoPivot"
          style={{ height: 16, width: "auto", objectFit: "contain", flexShrink: 0 }}
          draggable={false}
        />
      </div>

      <div style={{ display: "flex", gap: 2 }}>
        <ChromeButton onClick={onOpenSettings} style={buttonStyle} tooltip="Settings">
          <SettingsIcon />
        </ChromeButton>
        <ChromeButton onClick={onMinimizeToTray} style={buttonStyle} tooltip="Send to System Tray">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 20h16M4 20l4-8m-4 8l-4-8m20 8l-4-8m4 8l4-8M12 4v12m0 0l-4-4m4 4l4-4" />
          </svg>
        </ChromeButton>
        <ChromeButton onClick={onMinimize} style={buttonStyle} tooltip="Minimize">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
          </svg>
        </ChromeButton>
        <ChromeButton onClick={onClose} style={buttonStyle} tooltip="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </ChromeButton>
      </div>
    </div>
  );
}

const settingsBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  border: "none",
  background: "transparent",
  color: "var(--text-secondary)",
  cursor: "pointer",
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
};

function SettingsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ChromeButton({
  onClick,
  style,
  tooltip,
  children,
}: {
  onClick: () => void;
  style: React.CSSProperties;
  tooltip: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={tooltip}
      style={style}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.19)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {children}
    </button>
  );
}
