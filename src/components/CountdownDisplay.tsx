import { PomodoroPhase } from "../types";

interface CountdownDisplayProps {
  countdownDisplay: string;
  progress: number;
  isPomodoroMode: boolean;
  phase: PomodoroPhase;
  phaseLabel: string;
  completedCycles: number;
  customMessage: string;
}

export function CountdownDisplay({
  countdownDisplay,
  progress,
  isPomodoroMode,
  phase,
  phaseLabel,
  completedCycles,
  customMessage,
}: CountdownDisplayProps) {
  const circumference = 2 * Math.PI * 106;
  const dashOffset = circumference - progress * circumference;
  const gradientId = "progressGradient";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
        padding: "10px 20px",
      }}
    >
      {isPomodoroMode && (
        <div
          style={{
            background: "rgba(255,255,255,0.12)",
            borderRadius: 16,
            padding: "6px 16px",
            marginBottom: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <svg width="8" height="8" viewBox="0 0 8 8">
            <circle
              cx="4"
              cy="4"
              r="4"
              fill={phase === PomodoroPhase.Work ? "var(--accent-success)" : "var(--accent-warning)"}
            />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
            {phaseLabel}
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            · Cycle {completedCycles}
          </span>
        </div>
      )}

      <div
        style={{
          width: 220,
          height: 220,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "10px 0",
        }}
      >
        <svg width="220" height="220" viewBox="0 0 220 220">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-secondary)" />
            </linearGradient>
          </defs>
          <circle
            cx="110"
            cy="110"
            r="106"
            fill="none"
            stroke="#2A2D4A"
            strokeWidth="8"
          />
          <circle
            cx="110"
            cy="110"
            r="106"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90, 110, 110)"
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "var(--accent-primary)",
            opacity: 0.06,
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontSize: 44,
              fontWeight: "bold",
              color: "var(--text-primary)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {countdownDisplay}
          </span>
          <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            remaining
          </span>
        </div>
      </div>

      {customMessage && (
        <p
          style={{
            fontSize: 14,
            fontStyle: "italic",
            color: "var(--text-muted)",
            textAlign: "center",
            maxWidth: 300,
            margin: "8px 0 20px",
            lineHeight: 1.4,
          }}
        >
          {customMessage}
        </p>
      )}
    </div>
  );
}
