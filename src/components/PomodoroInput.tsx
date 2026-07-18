interface PomodoroInputProps {
  workMinutesInput: string;
  workSecondsInput: string;
  breakMinutesInput: string;
  breakSecondsInput: string;
  startingCycleInput: string;
  isStartingWithWork: boolean;
  isStartingWithBreak: boolean;
  onWorkMinutesChange: (v: string) => void;
  onWorkSecondsChange: (v: string) => void;
  onBreakMinutesChange: (v: string) => void;
  onBreakSecondsChange: (v: string) => void;
  onStartingCycleChange: (v: string) => void;
  onStartWithWork: () => void;
  onStartWithBreak: () => void;
  onEditWorkMessage: () => void;
  onEditBreakMessage: () => void;
}

export function PomodoroInput(props: PomodoroInputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
      <DurationCard
        label="WORK DURATION"
        labelColor="var(--accent-success)"
        minutes={props.workMinutesInput}
        seconds={props.workSecondsInput}
        onMinutesChange={props.onWorkMinutesChange}
        onSecondsChange={props.onWorkSecondsChange}
        onEdit={props.onEditWorkMessage}
        editTooltip="Set work completion message"
      />
      <DurationCard
        label="BREAK DURATION"
        labelColor="var(--accent-warning)"
        minutes={props.breakMinutesInput}
        seconds={props.breakSecondsInput}
        onMinutesChange={props.onBreakMinutesChange}
        onSecondsChange={props.onBreakSecondsChange}
        onEdit={props.onEditBreakMessage}
        editTooltip="Set break completion message"
      />
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "12px 16px",
          display: "grid",
          gridTemplateColumns: "1fr 80px",
          alignItems: "center",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            STARTING CYCLE
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
            Continue from a previous session
          </div>
        </div>
        <input
          type="text"
          value={props.startingCycleInput}
          onChange={(e) => props.onStartingCycleChange(e.target.value)}
          maxLength={4}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px",
            border: "1.5px solid #363858",
            borderRadius: 10,
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: 16,
            fontWeight: "bold",
            textAlign: "center",
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#363858"; }}
        />
      </div>
      <div
        style={{
          background: "rgba(255,255,255,0.06)",
          borderRadius: 12,
          padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
          START WITH
        </div>
        <div
          style={{
            background: "#141528",
            borderRadius: 8,
            padding: 3,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
          }}
        >
          <PhaseButton active={props.isStartingWithWork} onClick={props.onStartWithWork}>
            Work
          </PhaseButton>
          <PhaseButton active={props.isStartingWithBreak} onClick={props.onStartWithBreak}>
            Break
          </PhaseButton>
        </div>
      </div>
    </div>
  );
}

function DurationCard({
  label,
  labelColor,
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  onEdit,
  editTooltip,
}: {
  label: string;
  labelColor: string;
  minutes: string;
  seconds: string;
  onMinutesChange: (v: string) => void;
  onSecondsChange: (v: string) => void;
  onEdit: () => void;
  editTooltip: string;
}) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        borderRadius: 12,
        padding: "12px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: labelColor,
            fontFamily: "inherit",
          }}
        >
          {label}
        </span>
        <button
          onClick={onEdit}
          title={editTooltip}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: "4px 6px",
            borderRadius: 6,
            color: "var(--text-muted)",
            display: "flex",
            alignItems: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr" }}>
        <input
          type="text"
          value={minutes}
          onChange={(e) => onMinutesChange(e.target.value)}
          maxLength={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 14px",
            border: "1.5px solid #363858",
            borderRadius: 10,
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center",
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#363858"; }}
        />
        <span
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "var(--text-muted)",
            alignSelf: "center",
            padding: "0 8px",
          }}
        >
          :
        </span>
        <input
          type="text"
          value={seconds}
          onChange={(e) => onSecondsChange(e.target.value)}
          maxLength={2}
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "10px 14px",
            border: "1.5px solid #363858",
            borderRadius: 10,
            background: "var(--bg-input)",
            color: "var(--text-primary)",
            fontSize: 18,
            fontWeight: "bold",
            textAlign: "center",
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#363858"; }}
        />
      </div>
    </div>
  );
}

function PhaseButton({
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
        padding: "8px",
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
