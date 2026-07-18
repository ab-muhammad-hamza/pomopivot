import { useState, useRef, useEffect } from "react";

interface MessageEditorDialogProps {
  title: string;
  subtitle: string;
  currentMessage: string;
  onSave: (message: string) => void;
  onCancel: () => void;
}

export function MessageEditorDialog({
  title,
  subtitle,
  currentMessage,
  onSave,
  onCancel,
}: MessageEditorDialogProps) {
  const [message, setMessage] = useState(currentMessage);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
      }}
    >
      <div
        style={{
          width: 380,
          background: "var(--bg-dark)",
          borderRadius: 14,
          border: "1.5px solid #363858",
          padding: "20px 24px",
          boxShadow: "0 0 16px rgba(0,0,0,0.6)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "#fff",
              marginBottom: 4,
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {subtitle}
          </div>
        </div>

        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={200}
          rows={4}
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1.5px solid #363858",
            borderRadius: 10,
            background: "var(--bg-input)",
            color: "#fff",
            fontSize: 14,
            fontFamily: "inherit",
            resize: "none",
            outline: "none",
            transition: "border-color 0.15s",
            lineHeight: 1.4,
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent-primary)"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#363858"; }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 14,
          }}
        >
          <DialogButton onClick={onCancel} variant="ghost">
            Cancel
          </DialogButton>
          <DialogButton onClick={() => onSave(message)} variant="primary">
            Save
          </DialogButton>
        </div>
      </div>
    </div>
  );
}

function DialogButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "primary" | "ghost";
  children: React.ReactNode;
}) {
  const bg = variant === "primary" ? "var(--accent-primary)" : "#2D2F4E";
  const hoverBg = variant === "primary" ? "#5A52E0" : "#3A3D60";
  const color = variant === "primary" ? "#fff" : "var(--text-secondary)";

  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 20px",
        border: "none",
        borderRadius: 10,
        background: bg,
        color,
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = bg; }}
    >
      {children}
    </button>
  );
}
