interface ModeToggleProps {
  isSimpleMode: boolean;
  isPomodoroMode: boolean;
  onSwitchToSimple: () => void;
  onSwitchToPomodoro: () => void;
}

export function ModeToggle({
  isSimpleMode,
  isPomodoroMode,
  onSwitchToSimple,
  onSwitchToPomodoro,
}: ModeToggleProps) {
  return (
    <div
      style={{
        background: "#141528",
        borderRadius: 10,
        padding: 4,
        display: "inline-flex",
        margin: "0 auto 20px",
      }}
    >
      <ModeTab active={isSimpleMode} onClick={onSwitchToSimple}>
        Simple
      </ModeTab>
      <ModeTab active={isPomodoroMode} onClick={onSwitchToPomodoro}>
        Pomodoro
      </ModeTab>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        border: "none",
        borderRadius: 8,
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "inherit",
        background: active ? "#2D2F4E" : "transparent",
        color: active ? "var(--text-primary)" : "var(--text-muted)",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {children}
    </button>
  );
}
