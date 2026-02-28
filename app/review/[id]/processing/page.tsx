"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getJobStatus, getAnalysis, generateDocuments, API_BASE } from "@/lib/api";

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

// ─── Step definitions ─────────────────────────────────────────────────────────
// Maps backend status values → ordered display steps
const STEPS = [
  { key: "extracting",  label: "Extracting Text from PDFs",    desc: "Reading and processing document content." },
  { key: "classifying", label: "Classifying Document Types",   desc: "Identifying commitment, exceptions, and survey." },
  { key: "analyzing",   label: "Running AI Title Analysis",    desc: "Applying Texas title law and TLTA standards." },
  { key: "generating",  label: "Generating Output Documents",  desc: "Producing objection letter and issues summary." },
];

const STATUS_ORDER = ["queued", "extracting", "classifying", "analyzing", "generating", "complete", "error"];

function getStepIndex(status: string): number {
  const map: Record<string, number> = {
    queued: 0,
    extracting: 0,
    classifying: 1,
    analyzing: 2,
    generating: 3,
    complete: 4,
    error: -1,
  };
  return map[status] ?? 0;
}

type StepStatus = "pending" | "active" | "done" | "error";

function getStepStates(activeIndex: number, isError: boolean): StepStatus[] {
  return STEPS.map((_, i) => {
    if (isError) return i < activeIndex ? "done" : "pending";
    if (i < activeIndex) return "done";
    if (i === activeIndex) return "active";
    return "pending";
  });
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

function formatElapsed(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [jobStatus, setJobStatus] = useState<string>("queued");
  const [jobStage, setJobStage] = useState<string>("Queued for analysis");
  const [jobPct, setJobPct] = useState<number>(5);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [elapsed, setElapsed] = useState(0);
  const [matterRef, setMatterRef] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  const cancelledRef = useRef(false);

  // Load matter ref from session storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem(`review_${jobId}`);
      if (stored) {
        try {
          const info = JSON.parse(stored);
          if (info.matterRef) setMatterRef(info.matterRef);
          // If backend was legacy sync and already gave us analysisId, check immediately
          if (info.analysisId) {
            setJobStatus("complete");
            setJobStage("Analysis complete");
            setJobPct(100);
          }
        } catch { /* ignore */ }
      }
    }
  }, [jobId]);

  // Elapsed timer
  useEffect(() => {
    const timer = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll /jobs/{jobId} every 2 seconds for real status
  useEffect(() => {
    if (redirecting || errorMsg) return;
    cancelledRef.current = false;

    const pollJob = async () => {
      try {
        const data = await getJobStatus(jobId);
        if (cancelledRef.current) return;

        setJobStatus(data.status);
        setJobStage(data.stage || data.status);
        setJobPct(data.pct ?? 0);

        if (data.status === "complete" && data.analysis_id) {
          await handleComplete(data.analysis_id, data);
        } else if (data.status === "error") {
          setErrorMsg(data.error || data.stage || "Analysis failed. Please try again.");
        }
      } catch (err: unknown) {
        // 404 = job not found, try legacy analysis endpoint
        if (err instanceof Error && err.message.includes("not found")) {
          await pollLegacy();
        }
        // other errors: keep retrying silently
      }
    };

    const pollLegacy = async () => {
      try {
        const data = await getAnalysis(jobId);
        const hasResults = data.analysis_id || data.output_files || data.analysis || data.risk_summary;
        if (hasResults && !cancelledRef.current) {
          await handleComplete(jobId, data);
        }
      } catch { /* non-fatal */ }
    };

    const handleComplete = async (analysisId: string, resultData: any) => {
      if (cancelledRef.current) return;
      setRedirecting(true);
      setJobStatus("complete");
      setJobStage("Analysis complete");
      setJobPct(100);

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`results_${analysisId}`, JSON.stringify(resultData));
        // Update session storage with resolved analysis_id
        const reviewData = sessionStorage.getItem(`review_${jobId}`);
        if (reviewData) {
          try {
            const parsed = JSON.parse(reviewData);
            parsed.analysisId = analysisId;
            sessionStorage.setItem(`review_${analysisId}`, JSON.stringify(parsed));
          } catch { /* ignore */ }
        }
      }

      // If output files not yet generated, trigger generation
      if (!resultData.output_files || !Object.values(resultData.output_files || {}).some(Boolean)) {
        try {
          const genData = await generateDocuments(analysisId);
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`results_${analysisId}`, JSON.stringify(genData));
          }
        } catch { /* non-fatal */ }
      }

      setTimeout(() => {
        if (!cancelledRef.current) router.push(`/review/${analysisId}/results`);
      }, 800);
    };

    // Poll immediately then every 2 seconds
    pollJob();
    const interval = setInterval(pollJob, 2000);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [jobId, router, redirecting, errorMsg]);

  const stepIndex = getStepIndex(jobStatus);
  const stepStates = getStepStates(stepIndex, jobStatus === "error");

  // Progress bar: use real pct from backend, cap at 97 until complete
  const progressPct = jobStatus === "complete" ? 100 : Math.min(97, jobPct);

  const displayId = matterRef || jobId.slice(0, 8).toUpperCase();
  const showReassurance = elapsed >= 30 && jobStatus !== "complete" && jobStatus !== "error";
  const showTimeout = elapsed >= 180 && jobStatus !== "complete" && jobStatus !== "error";

  // ── Error state ────────────────────────────────────────────────────────────
  if (errorMsg) {
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
            {errorMsg}
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

        {/* Elapsed timer */}
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.6875rem",
          letterSpacing: "0.14em",
          color: C.inkLight,
          marginBottom: "1.5rem",
        }}>
          Elapsed: {formatElapsed(elapsed)}
        </p>

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
            // Use the real backend stage label for the active step
            const label = (status === "active") ? jobStage : step.label;
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
                    {label}
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

        {/* Timeout message (3+ minutes) */}
        {showTimeout && (
          <div style={{
            marginTop: "2.5rem",
            padding: "1.25rem 1.5rem",
            border: `1px solid ${C.border}`,
            backgroundColor: C.white,
            textAlign: "left",
          }}>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 400,
              fontSize: "0.875rem",
              color: C.inkMuted,
              lineHeight: 1.7,
              marginBottom: "0.75rem",
            }}>
              Taking longer than expected. The analysis is still running — you can wait or come back later.
            </p>
            <p style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.625rem",
              letterSpacing: "0.1em",
              color: C.inkLight,
              textTransform: "uppercase",
            }}>
              Job ID: {jobId}
            </p>
          </div>
        )}

        {/* Reassurance message (30s–3min) */}
        {showReassurance && !showTimeout && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "0.8125rem",
            color: C.inkLight,
            marginTop: "2.5rem",
            lineHeight: 1.7,
            padding: "0 1rem",
          }}>
            This is normal for large documents — Claude is reading every exception carefully.
          </p>
        )}

        {/* Standard note (under 30s) */}
        {!showReassurance && !showTimeout && (
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontStyle: "italic",
            fontSize: "0.8125rem",
            color: C.inkLight,
            marginTop: "3rem",
            lineHeight: 1.7,
          }}>
            Title analysis typically completes in 30–90 seconds.<br />
            Do not close this page.
          </p>
        )}
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
