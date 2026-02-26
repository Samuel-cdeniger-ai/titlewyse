"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:8001";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:          "#0A1628",
  navyLight:     "#162440",
  gold:          "#C9A84C",
  parchment:     "#F8F7F4",
  parchmentDark: "#EEE9E0",
  ink:           "#1C1C1C",
  inkMuted:      "#4A4A4A",
  inkLight:      "#7A7A7A",
  border:        "#E2DDD6",
  white:         "#ffffff",
  success:       "#1A4A2E",
  error:         "#8B2020",
  errorBg:       "rgba(139,32,32,0.06)",
};

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = [
  { key: "uploading",   label: "Uploading Documents",    desc: "Transferring files to the analysis engine." },
  { key: "extracting",  label: "Extracting Text",         desc: "Reading and processing document content." },
  { key: "analyzing",   label: "Running Title Analysis",  desc: "Applying Texas title law and TLTA standards." },
  { key: "generating",  label: "Generating Documents",    desc: "Producing objection letter and issues summary." },
];

type StepStatus = "pending" | "active" | "done" | "error";

function getStepStates(currentStep: number): StepStatus[] {
  return STEPS.map((_, i) =>
    i < currentStep ? "done" : i === currentStep ? "active" : "pending"
  );
}

// ─── Wordmark ─────────────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <Link href="/" style={{ textDecoration: "none", display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.25rem", fontWeight: 700, color: C.gold, letterSpacing: "0.14em", textTransform: "uppercase" }}>Title</span>
        <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.25rem", fontWeight: 400, color: C.gold, letterSpacing: "0.14em", textTransform: "uppercase" }}>Wyse</span>
      </div>
      <div style={{ width: "100%", height: "1px", backgroundColor: C.gold, marginTop: "2px", marginBottom: "2px" }} />
      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,168,76,0.65)" }}>AI-Assisted Title Review</span>
    </Link>
  );
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [matterRef, setMatterRef] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const estimatedTotal = 45;

  useEffect(() => {
    // Load matter ref from session storage
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`review_${reviewId}`);
      if (stored) {
        const info = JSON.parse(stored);
        if (info.matterRef) setMatterRef(info.matterRef);
      }
    }
  }, [reviewId]);

  // Elapsed timer — drives visual step progression
  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Visual step advancement based on elapsed time
  useEffect(() => {
    if (redirecting) return;
    const stepTimings = [0, 5, 12, 22];
    if (elapsed >= stepTimings[3] && currentStep < 3) setCurrentStep(3);
    else if (elapsed >= stepTimings[2] && currentStep < 2) setCurrentStep(2);
    else if (elapsed >= stepTimings[1] && currentStep < 1) setCurrentStep(1);
  }, [elapsed, currentStep, redirecting]);

  // Poll backend every 3 seconds for analysis status
  useEffect(() => {
    if (redirecting) return;
    let cancelled = false;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/analyses/${reviewId}`);
        if (res.ok) {
          const data = await res.json();
          // Analysis complete — check if it has output files / full data
          const hasResults =
            data.analysis_id || data.output_files || data.analysis || data.risk_summary;
          if (hasResults && !cancelled) {
            setRedirecting(true);
            setCurrentStep(STEPS.length - 1);
            // Store results in session storage for the results page
            if (typeof window !== "undefined") {
              sessionStorage.setItem(`results_${reviewId}`, JSON.stringify(data));
            }
            // If output files not yet generated, trigger generation
            if (!data.output_files || !Object.values(data.output_files).some(Boolean)) {
              try {
                const genRes = await fetch(`${API_BASE}/generate`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ analysis_id: reviewId }),
                });
                if (genRes.ok) {
                  const genData = await genRes.json();
                  if (typeof window !== "undefined") {
                    sessionStorage.setItem(`results_${reviewId}`, JSON.stringify(genData));
                  }
                }
              } catch { /* non-fatal — results page will handle missing files */ }
            }
            setTimeout(() => {
              if (!cancelled) router.push(`/review/${reviewId}/results`);
            }, 800);
          }
        }
        // 404 = still processing — visual progression handles it
      } catch { /* non-fatal polling error */ }
    };

    const interval = setInterval(checkStatus, 3000);
    // Also check immediately on mount
    checkStatus();

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [reviewId, router, redirecting]);

  const stepStates = getStepStates(currentStep);
  const progressPct = Math.min(97, (elapsed / estimatedTotal) * 100);
  const displayId = matterRef || reviewId;

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.parchment }}>
        <nav style={navStyle}><Wordmark /></nav>
        <div style={{
          maxWidth: "540px",
          margin: "6rem auto",
          padding: "3rem",
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          textAlign: "center",
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 400,
            color: C.error,
            marginBottom: "1rem",
          }}>
            Analysis Error
          </h2>
          <div style={{ width: "48px", height: "1px", backgroundColor: C.error, margin: "0 auto 1.5rem" }} />
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "0.9375rem",
            color: C.inkMuted,
            marginBottom: "2rem",
            lineHeight: 1.7,
          }}>
            {error}
          </p>
          <Link href="/review/new" style={{
            display: "inline-block",
            backgroundColor: C.navy,
            color: C.white,
            padding: "12px 28px",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            fontSize: "0.9375rem",
          }}>
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  // ── Main processing view ───────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.parchment }}>
      <nav style={navStyle}>
        <Wordmark />
        <span style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6875rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(201,168,76,0.55)",
        }}>
          Analyzing
        </span>
      </nav>

      <div style={{
        maxWidth: "560px",
        margin: "0 auto",
        padding: "8rem 2rem",
        textAlign: "center",
      }}>
        {/* Matter reference */}
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6875rem",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: C.gold,
          marginBottom: "1.25rem",
        }}>
          {displayId}
        </p>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: "2rem",
          fontWeight: 400,
          color: C.navy,
          lineHeight: 1.25,
          marginBottom: "0",
        }}>
          Analyzing Matter
        </h1>

        {/* Gold rule */}
        <div style={{
          width: "60px",
          height: "1px",
          backgroundColor: C.gold,
          margin: "1.75rem auto",
        }} />

        {/* Progress bar */}
        <div style={{
          height: "2px",
          backgroundColor: C.border,
          marginBottom: "3.5rem",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%",
            backgroundColor: C.gold,
            width: `${progressPct}%`,
            transition: "width 1s linear",
          }} />
        </div>

        {/* Steps */}
        <div style={{ textAlign: "left" }}>
          {STEPS.map((step, i) => {
            const status = stepStates[i];
            return (
              <div
                key={step.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "1.25rem",
                  padding: "1rem 0",
                  borderBottom: i < STEPS.length - 1 ? `1px solid ${C.parchmentDark}` : "none",
                  opacity: status === "pending" ? 0.38 : 1,
                  transition: "opacity 400ms ease",
                }}
              >
                {/* Status indicator */}
                <div style={{ flexShrink: 0, width: "18px", display: "flex", justifyContent: "center" }}>
                  {status === "done" && (
                    <span style={{ color: C.gold, fontSize: "0.875rem", fontWeight: 700 }}>✓</span>
                  )}
                  {status === "active" && (
                    <div style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: C.gold,
                      animation: "pulse-gold 2s ease-in-out infinite",
                    }} />
                  )}
                  {status === "pending" && (
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      border: `1px solid ${C.inkLight}`,
                    }} />
                  )}
                </div>

                {/* Label */}
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    color: status === "done" ? C.gold : status === "active" ? C.navy : C.inkLight,
                    fontWeight: status === "active" ? 500 : 300,
                  }}>
                    {step.label}
                  </span>
                </div>

                {/* Status text */}
                <div style={{ flexShrink: 0, minWidth: "100px", textAlign: "right" }}>
                  {status === "done" && (
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.625rem",
                      letterSpacing: "0.1em",
                      color: C.gold,
                      textTransform: "uppercase",
                    }}>
                      Complete
                    </span>
                  )}
                  {status === "active" && (
                    <span style={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 300,
                      fontStyle: "italic",
                      fontSize: "0.75rem",
                      color: C.inkMuted,
                    }}>
                      In progress…
                    </span>
                  )}
                  {status === "pending" && (
                    <span style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "0.625rem",
                      letterSpacing: "0.1em",
                      color: C.inkLight,
                      textTransform: "uppercase",
                    }}>
                      Pending
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimated time note */}
        <p style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: "0.8125rem",
          color: C.inkLight,
          marginTop: "3rem",
          lineHeight: 1.7,
        }}>
          Title analysis typically completes in 30–60 seconds.<br />
          Do not close this page.
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-gold {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(201,168,76,0.4); }
          50% { opacity: 0.85; box-shadow: 0 0 0 6px rgba(201,168,76,0); }
        }
      `}</style>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  backgroundColor: "#0A1628",
  padding: "0 3rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "72px",
  borderBottom: "1px solid #162440",
};
