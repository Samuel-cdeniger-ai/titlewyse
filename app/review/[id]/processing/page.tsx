"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:8001";

const STEPS = [
  { key: "uploading", label: "Uploading Documents", icon: "📤", desc: "Transferring files to the analysis engine..." },
  { key: "extracting", label: "Extracting Text", icon: "🔍", desc: "Reading and processing document content..." },
  { key: "analyzing", label: "Analyzing Title", icon: "⚖️", desc: "Applying Texas title law and TLTA standards..." },
  { key: "generating", label: "Generating Documents", icon: "📋", desc: "Producing your objection letter and issues summary..." },
];

type StepStatus = "pending" | "active" | "done" | "error";

interface StepState {
  key: string;
  status: StepStatus;
  startTime?: number;
  endTime?: number;
}

function getStepStates(currentStep: number): StepState[] {
  return STEPS.map((s, i) => ({
    key: s.key,
    status:
      i < currentStep ? "done" : i === currentStep ? "active" : "pending",
  }));
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return "almost done";
  if (seconds < 60) return `~${seconds}s remaining`;
  return `~${Math.ceil(seconds / 60)}m remaining`;
}

export default function ProcessingPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;

  const [currentStep, setCurrentStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState("");
  const [pollCount, setPollCount] = useState(0);

  // Estimated total time in seconds
  const estimatedTotal = 45;

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Progress step simulation & actual polling
  useEffect(() => {
    // Simulate step progression while polling
    const stepTimings = [3, 8, 20, 35]; // seconds to advance to each step

    if (elapsed >= stepTimings[3] && currentStep < 3) setCurrentStep(3);
    else if (elapsed >= stepTimings[2] && currentStep < 2) setCurrentStep(2);
    else if (elapsed >= stepTimings[1] && currentStep < 1) setCurrentStep(1);
    else if (elapsed >= stepTimings[0] && currentStep < 0) setCurrentStep(0);
  }, [elapsed, currentStep]);

  // Poll backend for status
  useEffect(() => {
    let active = true;

    const poll = async () => {
      try {
        // First, get the review info from sessionStorage
        const stored =
          typeof window !== "undefined"
            ? sessionStorage.getItem(`review_${reviewId}`)
            : null;

        if (!stored) {
          // If no stored data, try to generate directly
          await triggerGenerate();
          return;
        }

        const info = JSON.parse(stored);

        // Check if analysis is done by trying to poll /documents/{id}
        // The backend may not have a combined status endpoint, so we try /generate
        if (elapsed > 5 && pollCount === 0) {
          setPollCount(1);
          await triggerGenerate(info);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };

    const triggerGenerate = async (info?: {
      buyerName: string;
      propertyAddress: string;
      intendedUse: string;
      documentIds: string[];
    }) => {
      try {
        setCurrentStep(3);

        const body: Record<string, unknown> = {
          review_id: reviewId,
        };

        if (info) {
          body.buyer_name = info.buyerName;
          body.property_address = info.propertyAddress;
          body.intended_use = info.intendedUse;
          body.document_ids = info.documentIds;
        }

        const res = await fetch(`${API_BASE}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Generation failed: ${errText}`);
        }

        const data = await res.json();

        // Store results for the results page
        if (typeof window !== "undefined") {
          const storedKey = `results_${reviewId}`;
          sessionStorage.setItem(storedKey, JSON.stringify(data));
        }

        if (active) {
          // Small delay so the user sees the "Generating Documents" step complete
          setTimeout(() => {
            router.push(`/review/${reviewId}/results`);
          }, 1200);
        }
      } catch (err) {
        if (active) {
          throw err;
        }
      }
    };

    if (elapsed === 6) {
      poll();
    }

    return () => {
      active = false;
    };
  }, [elapsed, reviewId, pollCount, router]);

  const stepStates = getStepStates(currentStep);
  const remaining = Math.max(0, estimatedTotal - elapsed);
  const progressPct = Math.min(98, (elapsed / estimatedTotal) * 100);

  if (error) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fb" }}>
        <nav style={navStyle}>
          <Link href="/" style={logoStyle}>TitleWyse</Link>
        </nav>
        <div
          style={{
            maxWidth: "540px",
            margin: "4rem auto",
            padding: "2rem",
            backgroundColor: "white",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>⚠️</div>
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "700",
              color: "#991b1b",
              marginBottom: "0.75rem",
            }}
          >
            Analysis Error
          </h2>
          <p
            style={{
              color: "#64748b",
              fontFamily: "sans-serif",
              fontSize: "0.9375rem",
              marginBottom: "1.5rem",
              lineHeight: "1.6",
            }}
          >
            {error}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link
              href="/review/new"
              style={{
                backgroundColor: "#0a1628",
                color: "white",
                padding: "10px 24px",
                borderRadius: "6px",
                textDecoration: "none",
                fontFamily: "sans-serif",
                fontSize: "0.9375rem",
                fontWeight: "600",
              }}
            >
              Try Again
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fb" }}>
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>TitleWyse</Link>
        <span style={{ color: "#94a3b8", fontFamily: "sans-serif", fontSize: "0.875rem" }}>
          Analyzing…
        </span>
      </nav>

      <div
        style={{
          maxWidth: "560px",
          margin: "4rem auto",
          padding: "0 1.5rem",
        }}
      >
        {/* Main card */}
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}
        >
          {/* Spinner */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              border: "4px solid #e2e8f0",
              borderTopColor: "#c9a84c",
              animation: "spin 1s linear infinite",
              margin: "0 auto 1.5rem",
            }}
          />

          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#0a1628",
              marginBottom: "0.5rem",
            }}
          >
            Analyzing Your Title Documents
          </h1>
          <p
            style={{
              color: "#64748b",
              fontFamily: "sans-serif",
              fontSize: "0.9375rem",
              marginBottom: "2rem",
            }}
          >
            {formatTimeRemaining(remaining)}
          </p>

          {/* Progress bar */}
          <div
            style={{
              height: "6px",
              backgroundColor: "#f1f5f9",
              borderRadius: "999px",
              overflow: "hidden",
              marginBottom: "2rem",
            }}
          >
            <div
              style={{
                height: "100%",
                backgroundColor: "#c9a84c",
                borderRadius: "999px",
                width: `${progressPct}%`,
                transition: "width 1s linear",
              }}
            />
          </div>

          {/* Steps */}
          <div style={{ textAlign: "left" }}>
            {STEPS.map((step, i) => {
              const state = stepStates[i];
              return (
                <div
                  key={step.key}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1rem",
                    padding: "0.875rem 0",
                    borderBottom:
                      i < STEPS.length - 1 ? "1px solid #f1f5f9" : "none",
                    opacity: state.status === "pending" ? 0.4 : 1,
                  }}
                >
                  {/* Step indicator */}
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor:
                        state.status === "done"
                          ? "#16a34a"
                          : state.status === "active"
                          ? "#0a1628"
                          : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: "0.9375rem",
                    }}
                  >
                    {state.status === "done" ? (
                      <span style={{ color: "white", fontSize: "0.875rem" }}>✓</span>
                    ) : state.status === "active" ? (
                      <span
                        style={{
                          display: "inline-block",
                          width: "16px",
                          height: "16px",
                          border: "2px solid white",
                          borderTopColor: "#c9a84c",
                          borderRadius: "50%",
                          animation: "spin 0.8s linear infinite",
                        }}
                      />
                    ) : (
                      <span style={{ color: "#94a3b8", fontSize: "0.75rem", fontFamily: "sans-serif" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>

                  <div>
                    <p
                      style={{
                        fontFamily: "sans-serif",
                        fontWeight: "700",
                        fontSize: "0.9375rem",
                        color:
                          state.status === "active"
                            ? "#0a1628"
                            : state.status === "done"
                            ? "#16a34a"
                            : "#94a3b8",
                        marginBottom: "0.125rem",
                      }}
                    >
                      {step.icon} {step.label}
                    </p>
                    {state.status === "active" && (
                      <p
                        style={{
                          fontFamily: "sans-serif",
                          fontSize: "0.8125rem",
                          color: "#64748b",
                        }}
                      >
                        {step.desc}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <p
          style={{
            textAlign: "center",
            color: "#94a3b8",
            fontFamily: "sans-serif",
            fontSize: "0.8125rem",
            marginTop: "1.5rem",
            lineHeight: "1.6",
          }}
        >
          Do not close this page. You will be redirected automatically when your
          documents are ready.
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const navStyle: React.CSSProperties = {
  backgroundColor: "#0a1628",
  borderBottom: "1px solid #1a3a6b",
  padding: "0 2rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "60px",
};

const logoStyle: React.CSSProperties = {
  color: "#c9a84c",
  textDecoration: "none",
  fontSize: "1.25rem",
  fontWeight: "700",
};
