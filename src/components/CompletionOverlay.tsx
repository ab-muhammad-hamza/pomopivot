import { useEffect, useRef, useState } from "react";

interface CompletionOverlayProps {
  title: string;
  subtitle: string;
  phaseBadge: string | null;
  completedCycles: number;
  continueText: string;
  showContinue: boolean;
  onContinue: () => void;
  onDismiss: () => void;
}

export function CompletionOverlay({
  title,
  subtitle,
  phaseBadge,
  completedCycles,
  continueText,
  showContinue,
  onContinue,
  onDismiss,
}: CompletionOverlayProps) {
  const [animating, setAnimating] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const starCanvasRef = useRef<HTMLDivElement>(null);
  const buttonPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => setAnimating(false), 3500);
    createStarfield();

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset confirming when animation ends
  useEffect(() => {
    if (!animating) setConfirming(false);
  }, [animating]);

  function handleKeyDown(e: KeyboardEvent) {
    if (animating) return;
    if (e.key === "Escape") {
      if (confirming) {
        setConfirming(false);
      } else {
        setConfirming(true);
      }
    }
  }

  function handleClickOutside(e: React.MouseEvent) {
    if (animating) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    if (confirming) {
      setConfirming(false);
    } else {
      setConfirming(true);
    }
  }

  function createStarfield() {
    if (!starCanvasRef.current) return;
    const canvas = starCanvasRef.current;
    canvas.innerHTML = "";
    const starCount = 80;

    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      const size = Math.random() * 2.5 + 0.5;
      star.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(255,255,255,${Math.random() * 0.3 + 0.1});
        border-radius: 50%;
        left: ${Math.random() * 100}%;
        top: ${Math.random() * 100}%;
        animation: twinkle ${Math.random() * 3 + 1}s ease-in-out infinite alternate;
        animation-delay: ${Math.random() * 2}s;
      `;
      canvas.appendChild(star);
    }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleClickOutside}
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        ref={starCanvasRef}
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0,
          animation: "starFadeIn 1.5s ease-out forwards",
        }}
      />

      <div
        ref={contentRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: 40,
          opacity: 0,
          transform: "scale(0.7)",
          animation: "contentEntry 2.5s cubic-bezier(0.22, 1, 0.36, 1) 0.8s forwards",
          maxWidth: 600,
        }}
      >
        {phaseBadge && (
          <div
            style={{
              background: "rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "8px 20px",
              marginBottom: 30,
              opacity: 0,
              animation: "fadeInUp 1s ease-out 1.5s forwards",
            }}
          >
            <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
              {phaseBadge}
            </span>
          </div>
        )}

        <h1
          style={{
            fontSize: 72,
            fontWeight: "bold",
            color: "var(--accent-primary)",
            textShadow: "0 0 30px rgba(108,99,255,0.4)",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {title}
        </h1>

        {subtitle && (
          <p
            style={{
              fontSize: 24,
              fontWeight: 300,
              color: "rgba(176,179,214,0.67)",
              marginTop: 20,
              marginBottom: 0,
              maxWidth: 600,
              lineHeight: 1.4,
            }}
          >
            {subtitle}
          </p>
        )}

        {completedCycles > 0 && (
          <p
            style={{
              fontSize: 15,
              color: "rgba(107,110,138,0.31)",
              marginTop: 16,
              marginBottom: 0,
            }}
          >
            Cycle {completedCycles} completed
          </p>
        )}

        <div
          ref={buttonPanelRef}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 50,
            opacity: 0,
            animation: "fadeInUp 1s ease-out 2.5s forwards",
          }}
        >
          {confirming ? (
            <>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>
                Dismiss this session?
              </span>
              <div style={{ display: "flex", gap: 16 }}>
                <button
                  onClick={onDismiss}
                  style={{
                    padding: "12px 28px",
                    border: "none",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.2)",
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Yes, Dismiss
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  style={{
                    padding: "12px 28px",
                    border: "none",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: 16 }}>
              {showContinue && (
                <button
                  onClick={() => { setConfirming(false); onContinue(); }}
                  style={{
                    padding: "16px 36px",
                    border: "none",
                    borderRadius: 14,
                    background: "var(--accent-primary)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "transform 0.15s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                >
                  {continueText}
                </button>
              )}
              <button
                onClick={() => setConfirming(true)}
                style={{
                  padding: "16px 36px",
                  border: "none",
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.8)",
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "transform 0.15s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        <p
          style={{
            fontSize: 12,
            color: "rgba(255,255,255,0.19)",
            marginTop: 30,
            opacity: 0,
            animation: "fadeInUp 0.8s ease-out 3.5s forwards",
          }}
        >
          Use the buttons above to continue or dismiss
        </p>
      </div>
    </div>
  );
}
