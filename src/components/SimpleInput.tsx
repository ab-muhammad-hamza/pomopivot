interface SimpleInputProps {
  minutesInput: string;
  secondsInput: string;
  onMinutesChange: (v: string) => void;
  onSecondsChange: (v: string) => void;
}

export function SimpleInput({
  minutesInput,
  secondsInput,
  onMinutesChange,
  onSecondsChange,
}: SimpleInputProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 0, marginBottom: 16 }}>
      <StackLabel label="MINUTES">
        <ModernInput
          value={minutesInput}
          onChange={onMinutesChange}
          maxLength={3}
        />
      </StackLabel>
      <span
        style={{
          fontSize: 28,
          fontWeight: "bold",
          color: "var(--text-muted)",
          alignSelf: "end",
          padding: "0 12px",
          marginBottom: 10,
        }}
      >
        :
      </span>
      <StackLabel label="SECONDS">
        <ModernInput
          value={secondsInput}
          onChange={onSecondsChange}
          maxLength={2}
        />
      </StackLabel>
    </div>
  );
}

function StackLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span
        style={{
          fontSize: 13,
          color: "var(--text-secondary)",
          marginBottom: 6,
          fontFamily: "inherit",
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

function ModernInput({
  value,
  onChange,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={maxLength}
      style={{
        width: "100%",
        boxSizing: "border-box",
        padding: "10px 14px",
        border: "1.5px solid #363858",
        borderRadius: 10,
        background: "var(--bg-input)",
        color: "var(--text-primary)",
        fontSize: 22,
        fontWeight: "bold",
        textAlign: "center",
        fontFamily: "inherit",
        outline: "none",
        transition: "border-color 0.15s",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = "var(--accent-primary)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#363858";
      }}
      onMouseEnter={(e) => {
        if (e.currentTarget !== document.activeElement) {
          e.currentTarget.style.borderColor = "#4A4D70";
        }
      }}
      onMouseLeave={(e) => {
        if (e.currentTarget !== document.activeElement) {
          e.currentTarget.style.borderColor = "#363858";
        }
      }}
    />
  );
}
