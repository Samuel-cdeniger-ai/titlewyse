"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:8001";

// ─── Pre-loaded files for demo analysis ID ────────────────────────────────────
const DEMO_ANALYSIS_ID = "e5146cbf-3f9f-4550-a929-b6c6091b7440";
const DEMO_FILES = {
  objection_letter_docx: "/download/TitleWyse_ObjectionLetter_TW-2026-0001_20260225_230053.docx",
  objection_letter_pdf:  "/download/TitleWyse_ObjectionLetter_TW-2026-0001_20260225_230053.pdf",
  issues_summary_docx:   "/download/TitleWyse_IssuesSummary_TW-2026-0001_20260225_230053.docx",
  issues_summary_pdf:    "/download/TitleWyse_IssuesSummary_TW-2026-0001_20260225_230053.pdf",
};

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:          "#0A1628",
  navyLight:     "#162440",
  navyMuted:     "#2C3E5D",
  gold:          "#C9A84C",
  parchment:     "#F8F7F4",
  parchmentDark: "#EEE9E0",
  ink:           "#1C1C1C",
  inkMuted:      "#4A4A4A",
  inkLight:      "#7A7A7A",
  border:        "#E2DDD6",
  white:         "#ffffff",
  error:         "#8B2020",
  success:       "#1A4A2E",
  warning:       "#7A5C00",
};

// ─── Risk category config ─────────────────────────────────────────────────────
const RISK_CATEGORIES = [
  "Title Defects",
  "Encumbrances",
  "Easements",
  "Survey Issues",
  "Tax & Assessment",
  "Environmental",
  "Access & Ingress",
  "Deed Restrictions",
];

type RiskLevel = "RED" | "YELLOW" | "GREEN" | "N/A";

interface RiskItem {
  category: string;
  level: RiskLevel;
  note?: string;
}

// Backend exception shape from /analyses/{id}
interface BackendException {
  number?: string | number;
  description?: string;
  doc_type?: string;
  impact?: string;
  objectionable?: string;   // "YES" | "NO" | "CONDITIONAL"
  objection_basis?: string;
  cure_requested?: string;
  endorsement?: string;
  confidence?: string;
  // legacy/alternate fields
  risk?: string;
  objection?: string;
}

// Backend endorsement shape from /analyses/{id}
interface BackendEndorsement {
  endorsement_number?: string;
  name?: string;
  why_warranted?: string;
  protection_provided?: string;
  priority?: string;
  // legacy/alternate fields
  code?: string;
  reason?: string;
}

// Backend survey_issue shape
interface BackendSurveyIssue {
  checkpoint?: string;
  label?: string;
  finding?: string;
  severity?: string;
  action_needed?: string;
}

// Backend open_item shape
interface BackendOpenItem {
  item_number?: number;
  description?: string;
  reason?: string;
  severity?: string;
  action_required?: string;
}

interface ReviewResults {
  analysis_id?: string;
  review_id?: string;
  buyer_name?: string;
  property_address?: string;
  property_description?: string;
  intended_use?: string;
  date?: string;
  analysis_date?: string;
  disclaimer?: string;
  risk_summary?: RiskItem[] | Record<string, string>;
  exceptions?: BackendException[];
  endorsements?: BackendEndorsement[];
  survey_issues?: BackendSurveyIssue[] | string[];
  open_items?: BackendOpenItem[] | string[];
  objection_count?: number;
  endorsement_count?: number;
  output_files?: {
    objection_letter_docx?: string;
    objection_letter_pdf?: string;
    issues_summary_docx?: string;
    issues_summary_pdf?: string;
  };
  files?: {
    objection_letter_docx?: string;
    objection_letter_pdf?: string;
    issues_summary_docx?: string;
    issues_summary_pdf?: string;
  };
  // Nested legacy analysis object
  analysis?: {
    risk_summary?: Array<{ category: string; level: string; notes?: string }>;
    schedule_b2_exceptions?: BackendException[];
    endorsements?: BackendEndorsement[];
    survey_issues?: string[];
    open_items?: string[];
  };
  matter_info?: {
    buyer_name?: string;
    property_address?: string;
    intended_use?: string;
    date?: string;
  };
}

// ─── Risk style helpers ────────────────────────────────────────────────────────
const riskPillStyle: Record<RiskLevel, React.CSSProperties> = {
  RED:    { backgroundColor: C.error,   color: C.white,   fontWeight: 500 },
  YELLOW: { backgroundColor: C.warning, color: C.white,   fontWeight: 500 },
  GREEN:  { backgroundColor: C.success, color: C.white,   fontWeight: 500 },
  "N/A":  { backgroundColor: "transparent", color: C.inkLight, border: `1px solid ${C.border}` },
};

const riskCardBorder: Record<RiskLevel, string> = {
  RED:    C.error,
  YELLOW: C.warning,
  GREEN:  C.success,
  "N/A":  C.border,
};

function parseRiskLevel(val: string | undefined): RiskLevel {
  if (!val) return "N/A";
  const v = val.toUpperCase();
  if (v === "RED" || v === "HIGH") return "RED";
  if (v === "YELLOW" || v === "MEDIUM") return "YELLOW";
  if (v === "GREEN" || v === "LOW") return "GREEN";
  if (v === "UNKNOWN") return "N/A";
  return "N/A";
}

function RiskPill({ level }: { level: RiskLevel }) {
  return (
    <span style={{
      fontFamily: "'DM Mono', monospace",
      fontSize: "0.5625rem",
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      padding: "3px 8px",
      display: "inline-block",
      ...riskPillStyle[level],
    }}>
      {level === "N/A" ? "Unknown" : level}
    </span>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────────
function CollapsibleSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{
      border: `1px solid ${C.border}`,
      marginBottom: "1rem",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.25rem 1.75rem",
          backgroundColor: open ? C.navy : C.white,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1rem",
            fontWeight: 400,
            color: open ? C.white : C.navy,
          }}>
            {title}
          </span>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.5625rem",
            letterSpacing: "0.14em",
            color: open ? "rgba(255,255,255,0.45)" : C.inkLight,
            border: `1px solid ${open ? "rgba(255,255,255,0.2)" : C.border}`,
            padding: "2px 7px",
          }}>
            {count}
          </span>
        </div>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.75rem",
          color: open ? C.gold : C.inkLight,
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease",
        }}>
          ▾
        </span>
      </button>

      {open && (
        <div style={{
          padding: "2rem 1.75rem",
          backgroundColor: C.white,
          borderTop: `1px solid ${C.border}`,
        }}>
          {children}
        </div>
      )}
    </div>
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

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const params = useParams();
  const reviewId = params?.id as string;

  const [results, setResults] = useState<ReviewResults | null>(null);
  const [matterInfo, setMatterInfo] = useState<{
    buyerName?: string;
    propertyAddress?: string;
    intendedUse?: string;
    matterRef?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [outputFiles, setOutputFiles] = useState<{
    objection_letter_docx?: string;
    objection_letter_pdf?: string;
    issues_summary_docx?: string;
    issues_summary_pdf?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      try {
        // 1. Load session storage as baseline
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(`results_${reviewId}`);
          if (stored) {
            try { setResults(JSON.parse(stored)); } catch { /* ignore */ }
          }
          const matterStored = sessionStorage.getItem(`review_${reviewId}`);
          if (matterStored) {
            try { setMatterInfo(JSON.parse(matterStored)); } catch { /* ignore */ }
          }
        }

        // 2. Pre-load demo files for the known demo analysis ID
        if (reviewId === DEMO_ANALYSIS_ID) {
          setOutputFiles(DEMO_FILES);
        }

        // 3. Try the primary analyses endpoint (real data)
        const analysesRes = await fetch(`${API_BASE}/analyses/${reviewId}`);
        if (analysesRes.ok) {
          const data = await analysesRes.json();
          setResults((prev) => ({ ...(prev || {}), ...data }));
          setNotFound(false);

          // 4. Try to call /generate to get document file paths
          // (non-fatal if it fails — demo files are already pre-loaded above)
          try {
            const genRes = await fetch(`${API_BASE}/generate`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ analysis_id: reviewId }),
            });
            if (genRes.ok) {
              const genData = await genRes.json();
              // genData may have { files: { objection_letter_docx: "/download/...", ... } }
              const files = genData?.files || genData?.output_files || {};
              if (Object.keys(files).length > 0) {
                setOutputFiles(files);
              }
            }
          } catch { /* non-fatal — use pre-loaded demo files */ }

        } else if (analysesRes.status === 404) {
          // Fallback: try the documents endpoint
          try {
            const docRes = await fetch(`${API_BASE}/documents/${reviewId}`);
            if (docRes.ok) {
              const data = await docRes.json();
              setResults((prev) => ({ ...(prev || {}), ...data }));
              setNotFound(false);
            } else {
              const hasSessionData =
                typeof window !== "undefined" &&
                (sessionStorage.getItem(`results_${reviewId}`) || sessionStorage.getItem(`review_${reviewId}`));
              if (!hasSessionData) setNotFound(true);
            }
          } catch {
            const hasSessionData =
              typeof window !== "undefined" &&
              (sessionStorage.getItem(`results_${reviewId}`) || sessionStorage.getItem(`review_${reviewId}`));
            if (!hasSessionData) setNotFound(true);
          }
        }
      } catch {
        // non-fatal — we may have session storage data
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reviewId]);

  // ── Not Found ───────────────────────────────────────────────────────────────
  if (!loading && notFound) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.parchment }}>
        <nav style={navStyle}><Wordmark /></nav>
        <div style={{
          maxWidth: "480px",
          margin: "8rem auto",
          padding: "3rem",
          backgroundColor: C.white,
          border: `1px solid ${C.border}`,
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.5625rem",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: C.gold,
            marginBottom: "1rem",
          }}>
            Matter Not Found
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "1.5rem",
            fontWeight: 400,
            color: C.navy,
            marginBottom: "1rem",
          }}>
            This matter does not exist
          </h2>
          <div style={{ width: "48px", height: "1px", backgroundColor: C.gold, margin: "0 auto 1.5rem" }} />
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "0.9375rem",
            color: C.inkMuted,
            lineHeight: 1.7,
            marginBottom: "2rem",
          }}>
            The analysis ID <span style={{ fontFamily: "'DM Mono', monospace", color: C.inkLight }}>{reviewId}</span> could not be found. It may have expired or the ID is incorrect.
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
            Open New Matter
          </Link>
        </div>
      </div>
    );
  }

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: C.parchment }}>
        <nav style={navStyle}><Wordmark /></nav>
        <div style={{ textAlign: "center", padding: "8rem 2rem" }}>
          <div style={{
            width: "40px", height: "40px",
            borderRadius: "50%",
            border: `2px solid ${C.border}`,
            borderTopColor: C.gold,
            animation: "spin 1s linear infinite",
            margin: "0 auto 1.5rem",
          }} />
          <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 300, color: C.inkLight, fontSize: "0.875rem" }}>
            Loading matter results…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Data extraction ─────────────────────────────────────────────────────────
  const analysis = results?.analysis || {};

  const propertyAddress =
    results?.property_address ||
    results?.property_description ||
    results?.matter_info?.property_address ||
    matterInfo?.propertyAddress ||
    null;

  const buyerName =
    results?.buyer_name ||
    results?.matter_info?.buyer_name ||
    matterInfo?.buyerName ||
    null;

  const rawDate = results?.date || results?.analysis_date || results?.matter_info?.date;
  const date = rawDate
    ? new Date(rawDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const intendedUse = results?.intended_use || results?.matter_info?.intended_use || matterInfo?.intendedUse;
  const displayMatterRef = matterInfo?.matterRef || results?.analysis_id || reviewId;

  // ── Risk grid ───────────────────────────────────────────────────────────────
  const rawRisk = results?.risk_summary || analysis?.risk_summary;

  const RISK_KEY_MAP: Record<string, string[]> = {
    "Title Defects":     ["chain_of_title", "title"],
    "Encumbrances":      ["easements_encumbrances", "encumbrance"],
    "Easements":         ["easement"],
    "Survey Issues":     ["survey_boundary", "survey"],
    "Tax & Assessment":  ["tax_assessment", "tax"],
    "Environmental":     ["environmental"],
    "Access & Ingress":  ["access"],
    "Deed Restrictions": ["restrictions_ccrs", "restriction", "ccr"],
  };

  const riskGrid: RiskItem[] = RISK_CATEGORIES.map((cat) => {
    if (!rawRisk) return { category: cat, level: "N/A" };

    if (Array.isArray(rawRisk)) {
      const found = (rawRisk as RiskItem[]).find((r) =>
        r?.category?.toLowerCase().includes(cat.toLowerCase().split(" ")[0])
      );
      return {
        category: cat,
        level: found ? parseRiskLevel(found.level) : "N/A",
        note: found?.note || (found as unknown as Record<string,string>)?.notes,
      };
    }

    // Dict format from the API — e.g. { chain_of_title: "UNKNOWN", easements_encumbrances: "RED", ... }
    const dictRisk = rawRisk as Record<string, string>;
    const matchKeys = RISK_KEY_MAP[cat] || [];
    const matchedKey = Object.keys(dictRisk).find((k) =>
      matchKeys.some((mk) => k.toLowerCase().includes(mk))
    );
    return {
      category: cat,
      level: matchedKey ? parseRiskLevel(dictRisk[matchedKey]) : "N/A",
    };
  });

  // Overall: use explicit overall key from API dict, or compute from grid
  const overallFromApi =
    rawRisk && !Array.isArray(rawRisk)
      ? parseRiskLevel((rawRisk as Record<string, string>)["overall"])
      : null;

  const overallLevel: RiskLevel =
    overallFromApi && overallFromApi !== "N/A" ? overallFromApi :
    riskGrid.some((r) => r.level === "RED") ? "RED" :
    riskGrid.some((r) => r.level === "YELLOW") ? "YELLOW" :
    riskGrid.some((r) => r.level === "GREEN") ? "GREEN" : "N/A";

  // ── Exceptions ──────────────────────────────────────────────────────────────
  // Backend: { number, description, doc_type, impact, objectionable, objection_basis, ... }
  const rawExceptions: BackendException[] = (results?.exceptions || analysis?.schedule_b2_exceptions || []) as BackendException[];

  // ── Endorsements ────────────────────────────────────────────────────────────
  // Backend: { endorsement_number, name, why_warranted, protection_provided, priority }
  const rawEndorsements: BackendEndorsement[] = (results?.endorsements || analysis?.endorsements || []) as BackendEndorsement[];

  // ── Survey issues ────────────────────────────────────────────────────────────
  // Backend: array of { checkpoint, label, finding, severity, action_needed }
  // OR legacy: array of strings
  const rawSurveyIssues = results?.survey_issues || analysis?.survey_issues || [];

  // ── Open items ───────────────────────────────────────────────────────────────
  // Backend: array of { item_number, description, reason, severity, action_required }
  // OR legacy: array of strings
  const rawOpenItems = results?.open_items || analysis?.open_items || [];

  // ── Download URLs ────────────────────────────────────────────────────────────
  const makeDownloadUrl = (filePath?: string) => {
    if (!filePath) return undefined;
    // If already a full URL, return as-is
    if (filePath.startsWith("http")) return filePath;
    // Extract filename from path like "/download/filename.docx"
    const filename = filePath.split("/").pop() || filePath;
    return `${API_BASE}/download/${encodeURIComponent(filename)}`;
  };

  const hasOutputFiles = Object.values(outputFiles).some(Boolean);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.parchment }}>

      {/* Nav */}
      <nav style={navStyle}>
        <Wordmark />
        <Link href="/review/new" style={{
          color: C.gold,
          border: `1px solid ${C.gold}`,
          padding: "8px 20px",
          textDecoration: "none",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: "0.8125rem",
          letterSpacing: "0.04em",
        }}>
          + New Matter
        </Link>
      </nav>

      {/* ── Matter Header Band ────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.navy, padding: "3.5rem 3rem" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-start", gap: "2rem" }}>
            <div>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6875rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.gold,
                marginBottom: "0.875rem",
              }}>
                {displayMatterRef} · Analysis Complete
              </p>

              <h1 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
                fontWeight: 400,
                color: propertyAddress ? C.white : "rgba(255,255,255,0.35)",
                fontStyle: propertyAddress ? "normal" : "italic",
                lineHeight: 1.25,
                marginBottom: "1.25rem",
                maxWidth: "600px",
              }}>
                {propertyAddress || "Property address not available"}
              </h1>

              <div style={{ display: "flex", flexWrap: "wrap", gap: "2.5rem" }}>
                <div>
                  <span style={metaLabelStyle}>Purchaser</span>
                  <p style={metaValueStyle}>{buyerName || "—"}</p>
                </div>
                {intendedUse && (
                  <div>
                    <span style={metaLabelStyle}>Intended Use</span>
                    <p style={metaValueStyle}>{intendedUse}</p>
                  </div>
                )}
                <div>
                  <span style={metaLabelStyle}>Date</span>
                  <p style={metaValueStyle}>{date}</p>
                </div>
              </div>
            </div>

            {/* Overall risk badge */}
            <div style={{
              backgroundColor: C.navyLight,
              border: `1px solid ${C.navyMuted}`,
              padding: "1.75rem 2rem",
              minWidth: "180px",
              textAlign: "center",
            }}>
              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.5625rem",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.4)",
                marginBottom: "0.875rem",
              }}>
                Overall Risk
              </p>
              <RiskPill level={overallLevel} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "3rem 2rem 6rem" }}>

        {/* ── Risk Summary Grid ─────────────────────────────────────────── */}
        <div style={{ marginBottom: "3rem" }}>
          <SectionHeader>Risk Summary</SectionHeader>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
          }}>
            {riskGrid.map((item) => (
              <div key={item.category} style={{
                backgroundColor: C.white,
                border: `1px solid ${riskCardBorder[item.level]}`,
                padding: "1.25rem 1.5rem",
              }}>
                <p style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.5625rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: C.inkMuted,
                  marginBottom: "0.75rem",
                }}>
                  {item.category}
                </p>
                <RiskPill level={item.level} />
                {item.note && (
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    fontSize: "0.75rem",
                    color: C.inkLight,
                    lineHeight: 1.6,
                    marginTop: "0.625rem",
                  }}>
                    {item.note}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Download Cards ────────────────────────────────────────────── */}
        <div style={{ marginBottom: "3rem" }}>
          <SectionHeader>Documents</SectionHeader>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "1.5rem",
            marginTop: "1.75rem",
          }}>
            <DownloadCard
              title="Title Objection Letter"
              subtitle="Formal objection letter addressing all title defects and required curative actions."
              matterRef={displayMatterRef}
              docxUrl={makeDownloadUrl(outputFiles?.objection_letter_docx)}
              pdfUrl={makeDownloadUrl(outputFiles?.objection_letter_pdf)}
            />
            <DownloadCard
              title="Issues Summary Memo"
              subtitle="Client memo summarizing all schedule exceptions, survey issues, endorsements, and risk ratings."
              matterRef={displayMatterRef}
              docxUrl={makeDownloadUrl(outputFiles?.issues_summary_docx)}
              pdfUrl={makeDownloadUrl(outputFiles?.issues_summary_pdf)}
            />
          </div>

          {!hasOutputFiles && (
            <div style={{
              backgroundColor: "rgba(122,92,0,0.06)",
              border: `1px solid ${C.warning}`,
              padding: "1rem 1.25rem",
              marginTop: "1.25rem",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.875rem",
              color: C.warning,
            }}>
              Document generation is still processing. Refresh this page in a moment.
            </div>
          )}
        </div>

        {/* ── Collapsible Detail Sections ───────────────────────────────── */}
        <div style={{ marginBottom: "3rem" }}>
          <SectionHeader>Detailed Analysis</SectionHeader>
          <div style={{ marginTop: "1.75rem" }}>

            {/* Exceptions */}
            <CollapsibleSection
              title="Schedule B-II Exceptions"
              count={rawExceptions?.length || 0}
              defaultOpen={(rawExceptions?.length || 0) > 0}
            >
              {(rawExceptions?.length || 0) === 0 ? (
                <EmptyState>No exceptions data available.</EmptyState>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: C.parchment }}>
                        {["#", "Description", "Objectionable", "Impact / Objection Basis"].map((h) => (
                          <th key={h} style={thStyle}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(rawExceptions || []).map((ex, i) => {
                        // Map objectionable string to risk level for color
                        const obj = ex?.objectionable?.toUpperCase() || "";
                        const risk: RiskLevel =
                          obj === "YES" ? "RED" :
                          obj === "CONDITIONAL" ? "YELLOW" :
                          obj === "NO" ? "GREEN" : "N/A";
                        const displayObj = obj || "—";
                        const displayImpact = ex?.objection_basis || ex?.impact || ex?.objection || "—";
                        return (
                          <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.parchment }}>
                            <td style={{ ...tdStyle, fontFamily: "'DM Mono', monospace", fontSize: "0.75rem", color: C.inkLight }}>
                              {ex?.number ?? i + 1}
                            </td>
                            <td style={{ ...tdStyle, maxWidth: "300px" }}>
                              {ex?.description || "—"}
                            </td>
                            <td style={tdStyle}>
                              <RiskPill level={risk} />
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: C.inkLight, display: "block", marginTop: "3px" }}>
                                {displayObj}
                              </span>
                            </td>
                            <td style={{ ...tdStyle, maxWidth: "260px", color: C.inkMuted }}>
                              {displayImpact}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CollapsibleSection>

            {/* Endorsements */}
            <CollapsibleSection
              title="Recommended Endorsements"
              count={rawEndorsements?.length || 0}
              defaultOpen={false}
            >
              {(rawEndorsements?.length || 0) === 0 ? (
                <EmptyState>No endorsements data available.</EmptyState>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ backgroundColor: C.parchment }}>
                      {["Endorsement", "Name", "Why Warranted"].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(rawEndorsements || []).map((e, i) => {
                      // Support both backend shape (endorsement_number) and legacy (code)
                      const code = e?.endorsement_number || e?.code || "—";
                      const name = e?.name || "—";
                      const reason = e?.why_warranted || e?.reason || "—";
                      return (
                        <tr key={i} style={{ backgroundColor: i % 2 === 0 ? C.white : C.parchment }}>
                          <td style={tdStyle}>
                            <span style={{
                              fontFamily: "'DM Mono', monospace",
                              fontSize: "0.6875rem",
                              letterSpacing: "0.08em",
                              backgroundColor: C.parchmentDark,
                              color: C.navy,
                              padding: "3px 8px",
                              border: `1px solid ${C.border}`,
                            }}>
                              {code}
                            </span>
                          </td>
                          <td style={tdStyle}>{name}</td>
                          <td style={{ ...tdStyle, color: C.inkMuted }}>{reason}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CollapsibleSection>

            {/* Survey Issues */}
            <CollapsibleSection
              title="Survey Issues"
              count={rawSurveyIssues?.length || 0}
              defaultOpen={(rawSurveyIssues?.length || 0) > 0}
            >
              {(rawSurveyIssues?.length || 0) === 0 ? (
                <EmptyState>No survey issues identified.</EmptyState>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(rawSurveyIssues || []).map((issue, i) => {
                    // Handle both object format and plain string
                    if (typeof issue === "string") {
                      return (
                        <div key={i} style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 300,
                          fontSize: "0.9375rem",
                          lineHeight: 1.75,
                          color: C.inkMuted,
                          paddingLeft: "1rem",
                          borderLeft: `2px solid ${C.border}`,
                        }}>
                          {issue}
                        </div>
                      );
                    }
                    const si = issue as BackendSurveyIssue;
                    const severity = si?.severity?.toUpperCase() || "";
                    const sevLevel: RiskLevel =
                      severity === "CRITICAL" || severity === "HIGH" ? "RED" :
                      severity === "MEDIUM" || severity === "MODERATE" ? "YELLOW" :
                      severity === "LOW" || severity === "NOT_APPLICABLE" ? "GREEN" : "N/A";
                    return (
                      <div key={i} style={{
                        backgroundColor: C.parchment,
                        border: `1px solid ${C.border}`,
                        padding: "1rem 1.25rem",
                        borderLeft: `3px solid ${riskCardBorder[sevLevel]}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.6rem",
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: C.inkLight,
                          }}>
                            {si?.label || si?.checkpoint || `Issue ${i + 1}`}
                          </span>
                          {si?.severity && <RiskPill level={sevLevel} />}
                        </div>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 300,
                          fontSize: "0.875rem",
                          color: C.inkMuted,
                          lineHeight: 1.65,
                          marginBottom: si?.action_needed ? "0.5rem" : 0,
                        }}>
                          {si?.finding || "—"}
                        </p>
                        {si?.action_needed && (
                          <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: "0.8125rem",
                            color: C.ink,
                            lineHeight: 1.6,
                            borderTop: `1px solid ${C.border}`,
                            paddingTop: "0.5rem",
                            marginTop: "0.5rem",
                          }}>
                            <strong>Action:</strong> {si.action_needed}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

            {/* Open Items */}
            <CollapsibleSection
              title="Open Items"
              count={rawOpenItems?.length || 0}
              defaultOpen={(rawOpenItems?.length || 0) > 0}
            >
              {(rawOpenItems?.length || 0) === 0 ? (
                <EmptyState>No open items.</EmptyState>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {(rawOpenItems || []).map((item, i) => {
                    // Handle both object format and plain string
                    if (typeof item === "string") {
                      return (
                        <div key={i} style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 300,
                          fontSize: "0.9375rem",
                          lineHeight: 1.75,
                          color: C.inkMuted,
                          paddingLeft: "1rem",
                          borderLeft: `2px solid ${C.border}`,
                        }}>
                          {item}
                        </div>
                      );
                    }
                    const oi = item as BackendOpenItem;
                    const severity = oi?.severity?.toUpperCase() || "";
                    const sevLevel: RiskLevel =
                      severity === "BLOCKING" || severity === "HIGH" ? "RED" :
                      severity === "MEDIUM" ? "YELLOW" :
                      severity === "LOW" ? "GREEN" : "N/A";
                    return (
                      <div key={i} style={{
                        backgroundColor: C.parchment,
                        border: `1px solid ${C.border}`,
                        padding: "1rem 1.25rem",
                        borderLeft: `3px solid ${riskCardBorder[sevLevel]}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
                          <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: "0.6rem",
                            letterSpacing: "0.12em",
                            color: C.inkLight,
                          }}>
                            Item {oi?.item_number ?? i + 1}
                          </span>
                          {oi?.severity && <RiskPill level={sevLevel} />}
                        </div>
                        <p style={{
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 400,
                          fontSize: "0.9rem",
                          color: C.ink,
                          lineHeight: 1.65,
                          marginBottom: "0.375rem",
                        }}>
                          {oi?.description || "—"}
                        </p>
                        {oi?.reason && (
                          <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 300,
                            fontSize: "0.8125rem",
                            color: C.inkMuted,
                            lineHeight: 1.6,
                          }}>
                            {oi.reason}
                          </p>
                        )}
                        {oi?.action_required && (
                          <p style={{
                            fontFamily: "'Inter', sans-serif",
                            fontWeight: 400,
                            fontSize: "0.8125rem",
                            color: C.ink,
                            lineHeight: 1.6,
                            borderTop: `1px solid ${C.border}`,
                            paddingTop: "0.5rem",
                            marginTop: "0.5rem",
                          }}>
                            <strong>Action:</strong> {oi.action_required}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CollapsibleSection>

          </div>
        </div>

        {/* ── Footer CTA ───────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", paddingTop: "2rem", borderTop: `1px solid ${C.border}` }}>
          <Link href="/review/new" style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "0.9375rem",
            color: C.gold,
            textDecoration: "none",
            letterSpacing: "0.04em",
            borderBottom: `1px solid rgba(201,168,76,0.4)`,
            paddingBottom: "2px",
          }}>
            Open Another Matter →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: C.navy,
        borderTop: `1px solid ${C.navyLight}`,
        padding: "2rem 3rem",
        textAlign: "center",
        fontFamily: "'Inter', sans-serif",
        fontWeight: 300,
        fontSize: "0.8125rem",
        color: "rgba(255,255,255,0.35)",
      }}>
        TitleWyse is an AI-assisted legal tool. All outputs require review by licensed counsel.
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Download Card ────────────────────────────────────────────────────────────
function DownloadCard({
  title,
  subtitle,
  matterRef,
  docxUrl,
  pdfUrl,
}: {
  title: string;
  subtitle: string;
  matterRef: string;
  docxUrl?: string;
  pdfUrl?: string;
}) {
  return (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${C.border}`,
      padding: "2rem",
    }}>
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: "1.125rem",
        fontWeight: 700,
        color: C.navy,
        marginBottom: "0.5rem",
        lineHeight: 1.3,
      }}>
        {title}
      </h3>
      <p style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.5625rem",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: C.gold,
        marginBottom: "0.875rem",
      }}>
        TITLEWYSE · {matterRef}
      </p>
      <p style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 300,
        fontSize: "0.8125rem",
        color: C.inkLight,
        lineHeight: 1.65,
        marginBottom: "1.75rem",
      }}>
        {subtitle}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
        {docxUrl ? (
          <a href={docxUrl} target="_blank" rel="noreferrer" style={dlBtnActiveStyle}>
            ↓ Download DOCX
          </a>
        ) : (
          <span style={dlBtnDisabledStyle}>↓ Download DOCX</span>
        )}
        {pdfUrl ? (
          <a href={pdfUrl} target="_blank" rel="noreferrer" style={dlBtnActiveStyle}>
            ↓ Download PDF
          </a>
        ) : (
          <span style={dlBtnDisabledStyle}>↓ Download PDF</span>
        )}
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.5625rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: C.inkLight,
        display: "block",
      }}>
        {children}
      </span>
      <div style={{ width: "32px", height: "1px", backgroundColor: C.gold, marginTop: "6px" }} />
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontFamily: "'Inter', sans-serif",
      fontWeight: 300,
      fontStyle: "italic",
      fontSize: "0.9375rem",
      color: C.inkLight,
    }}>
      {children}
    </p>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const navStyle: React.CSSProperties = {
  backgroundColor: "#0A1628",
  padding: "0 3rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  height: "72px",
  borderBottom: "1px solid #162440",
};

const metaLabelStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.5rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.4)",
  display: "block",
  marginBottom: "3px",
};

const metaValueStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontWeight: 300,
  fontSize: "0.9375rem",
  color: "rgba(255,255,255,0.75)",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 14px",
  fontFamily: "'DM Mono', monospace",
  fontWeight: 400,
  fontSize: "0.5625rem",
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "#7A7A7A",
  borderBottom: "1px solid #E2DDD6",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 14px",
  verticalAlign: "top",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 300,
  fontSize: "0.875rem",
  color: "#4A4A4A",
  borderBottom: "1px solid #E2DDD6",
};

const dlBtnActiveStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 16px",
  border: "1px solid #C9A84C",
  color: "#0A1628",
  backgroundColor: "transparent",
  textDecoration: "none",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
  fontSize: "0.8125rem",
  letterSpacing: "0.04em",
  textAlign: "center",
};

const dlBtnDisabledStyle: React.CSSProperties = {
  display: "block",
  padding: "10px 16px",
  border: "1px solid #E2DDD6",
  color: "#7A7A7A",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 300,
  fontSize: "0.8125rem",
  textAlign: "center",
  cursor: "default",
};
