"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:8001";

// Risk category labels
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

interface Exception {
  number: string;
  description: string;
  risk?: RiskLevel;
  objection?: string;
}

interface Endorsement {
  code: string;
  name: string;
  reason?: string;
}

interface ReviewResults {
  review_id?: string;
  property_address?: string;
  buyer_name?: string;
  intended_use?: string;
  date?: string;
  risk_summary?: RiskItem[];
  exceptions?: Exception[];
  endorsements?: Endorsement[];
  survey_issues?: string[];
  open_items?: string[];
  output_files?: {
    objection_letter_docx?: string;
    objection_letter_pdf?: string;
    issues_summary_docx?: string;
    issues_summary_pdf?: string;
  };
  // Nested format from SA-2 analyzer
  analysis?: {
    risk_summary?: Array<{ category: string; level: string; notes?: string }>;
    schedule_b2_exceptions?: Exception[];
    endorsements?: Endorsement[];
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

const riskColors: Record<RiskLevel, { bg: string; text: string; dot: string }> =
  {
    RED: { bg: "#fef2f2", text: "#991b1b", dot: "🔴" },
    YELLOW: { bg: "#fffbeb", text: "#92400e", dot: "🟡" },
    GREEN: { bg: "#f0fdf4", text: "#065f46", dot: "🟢" },
    "N/A": { bg: "#f8fafc", text: "#64748b", dot: "⚪" },
  };

function parseRiskLevel(val: string | undefined): RiskLevel {
  if (!val) return "N/A";
  const v = val.toUpperCase();
  if (v === "RED" || v === "HIGH") return "RED";
  if (v === "YELLOW" || v === "MEDIUM") return "YELLOW";
  if (v === "GREEN" || v === "LOW") return "GREEN";
  return "N/A";
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "1rem",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1.125rem 1.5rem",
          backgroundColor: open ? "#0a1628" : "white",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span
          style={{
            fontFamily: "sans-serif",
            fontWeight: "700",
            fontSize: "0.9375rem",
            color: open ? "#c9a84c" : "#0a1628",
          }}
        >
          {title}
        </span>
        <span
          style={{
            color: open ? "#c9a84c" : "#64748b",
            fontSize: "1rem",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </button>
      {open && (
        <div
          style={{
            padding: "1.5rem",
            backgroundColor: "white",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const params = useParams();
  const reviewId = params.id as string;

  const [results, setResults] = useState<ReviewResults | null>(null);
  const [matterInfo, setMatterInfo] = useState<{
    buyerName?: string;
    propertyAddress?: string;
    intendedUse?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        // Check session storage first
        if (typeof window !== "undefined") {
          const stored = sessionStorage.getItem(`results_${reviewId}`);
          if (stored) {
            setResults(JSON.parse(stored));
          }

          const matterStored = sessionStorage.getItem(`review_${reviewId}`);
          if (matterStored) {
            setMatterInfo(JSON.parse(matterStored));
          }
        }

        // Try fetching from backend
        const res = await fetch(`${API_BASE}/documents/${reviewId}`);
        if (res.ok) {
          const data = await res.json();
          setResults((prev) => ({ ...(prev || {}), ...data }));
        }
      } catch (err) {
        // Not a fatal error — we may have data from session storage
        console.warn("Could not fetch from backend:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reviewId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fb" }}>
        <nav style={navStyle}>
          <Link href="/" style={logoStyle}>TitleWyse</Link>
        </nav>
        <div style={{ textAlign: "center", padding: "6rem 2rem" }}>
          <div style={spinnerStyle} />
          <p style={{ fontFamily: "sans-serif", color: "#64748b", marginTop: "1rem" }}>
            Loading results…
          </p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Extract data with fallbacks
  const analysis = results?.analysis || {};
  const propertyAddress =
    results?.property_address ||
    results?.matter_info?.property_address ||
    matterInfo?.propertyAddress ||
    "Unknown Property";
  const buyerName =
    results?.buyer_name ||
    results?.matter_info?.buyer_name ||
    matterInfo?.buyerName ||
    "Unknown Buyer";
  const date =
    results?.date ||
    results?.matter_info?.date ||
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  const intendedUse =
    results?.intended_use ||
    results?.matter_info?.intended_use ||
    matterInfo?.intendedUse;

  // Risk summary — build from data or show placeholder grid
  const rawRisk = results?.risk_summary || analysis?.risk_summary || [];
  const riskGrid: RiskItem[] = RISK_CATEGORIES.map((cat) => {
    const found = rawRisk.find(
      (r) => r.category?.toLowerCase().includes(cat.toLowerCase().split(" ")[0])
    );
    return {
      category: cat,
      level: found ? parseRiskLevel(found.level) : "N/A",
      note: found?.note || found?.notes,
    };
  });

  const exceptions = results?.exceptions || analysis?.schedule_b2_exceptions || [];
  const endorsements = results?.endorsements || analysis?.endorsements || [];
  const surveyIssues = results?.survey_issues || analysis?.survey_issues || [];
  const openItems = results?.open_items || analysis?.open_items || [];
  const outputFiles = results?.output_files || {};

  const hasOutputFiles = Object.values(outputFiles).some(Boolean);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fb" }}>
      {/* Nav */}
      <nav style={navStyle}>
        <Link href="/" style={logoStyle}>TitleWyse</Link>
        <Link
          href="/review/new"
          style={{
            backgroundColor: "#c9a84c",
            color: "#0a1628",
            padding: "7px 18px",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontFamily: "sans-serif",
            fontWeight: "700",
          }}
        >
          + New Review
        </Link>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {/* Summary Header */}
        <div
          style={{
            backgroundColor: "#0a1628",
            borderRadius: "10px",
            padding: "2rem",
            marginBottom: "1.5rem",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
          }}
        >
          <div>
            <div
              style={{
                color: "#c9a84c",
                fontFamily: "sans-serif",
                fontSize: "0.75rem",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: "0.375rem",
              }}
            >
              Title Review Complete
            </div>
            <h1
              style={{
                color: "white",
                fontSize: "1.5rem",
                fontWeight: "700",
                marginBottom: "0.375rem",
              }}
            >
              {propertyAddress}
            </h1>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.25rem",
                marginTop: "0.75rem",
              }}
            >
              <div>
                <span
                  style={{
                    color: "#94a3b8",
                    fontFamily: "sans-serif",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Buyer
                </span>
                <p
                  style={{
                    color: "white",
                    fontFamily: "sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: "600",
                    marginTop: "2px",
                  }}
                >
                  {buyerName}
                </p>
              </div>
              {intendedUse && (
                <div>
                  <span
                    style={{
                      color: "#94a3b8",
                      fontFamily: "sans-serif",
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                    }}
                  >
                    Use
                  </span>
                  <p
                    style={{
                      color: "white",
                      fontFamily: "sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: "600",
                      marginTop: "2px",
                    }}
                  >
                    {intendedUse}
                  </p>
                </div>
              )}
              <div>
                <span
                  style={{
                    color: "#94a3b8",
                    fontFamily: "sans-serif",
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                  }}
                >
                  Date
                </span>
                <p
                  style={{
                    color: "white",
                    fontFamily: "sans-serif",
                    fontSize: "0.9375rem",
                    fontWeight: "600",
                    marginTop: "2px",
                  }}
                >
                  {date}
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#112240",
              border: "1px solid #1a3a6b",
              borderRadius: "8px",
              padding: "1rem 1.25rem",
              minWidth: "160px",
            }}
          >
            <p
              style={{
                color: "#94a3b8",
                fontFamily: "sans-serif",
                fontSize: "0.75rem",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                marginBottom: "0.375rem",
              }}
            >
              Review ID
            </p>
            <p
              style={{
                color: "#c9a84c",
                fontFamily: "monospace",
                fontSize: "0.875rem",
              }}
            >
              {reviewId}
            </p>
          </div>
        </div>

        {/* Risk Summary Grid */}
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={sectionHeadingStyle}>Risk Summary</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
              gap: "0.875rem",
              marginTop: "1.25rem",
            }}
          >
            {riskGrid.map((item) => {
              const colors = riskColors[item.level];
              return (
                <div
                  key={item.category}
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${
                      item.level === "RED"
                        ? "#fecaca"
                        : item.level === "YELLOW"
                        ? "#fde68a"
                        : item.level === "GREEN"
                        ? "#bbf7d0"
                        : "#e2e8f0"
                    }`,
                    borderRadius: "6px",
                    padding: "0.875rem 1rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.25rem",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "0.8125rem",
                        fontWeight: "700",
                        color: colors.text,
                      }}
                    >
                      {item.category}
                    </span>
                    <span style={{ fontSize: "1rem" }}>{colors.dot}</span>
                  </div>
                  {item.note && (
                    <p
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "0.75rem",
                        color: colors.text,
                        opacity: 0.8,
                        lineHeight: "1.5",
                        marginTop: "0.25rem",
                      }}
                    >
                      {item.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Download Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <DownloadCard
            title="Title Objection Letter"
            description="Formal attorney-style objection letter addressing all title defects and required curative actions."
            icon="📜"
            docxUrl={outputFiles.objection_letter_docx}
            pdfUrl={outputFiles.objection_letter_pdf}
          />
          <DownloadCard
            title="Title & Survey Issues Summary"
            description="Client memo summarizing all schedule exceptions, survey issues, endorsements, and risk ratings."
            icon="📋"
            docxUrl={outputFiles.issues_summary_docx}
            pdfUrl={outputFiles.issues_summary_pdf}
          />
        </div>

        {!hasOutputFiles && (
          <div
            style={{
              backgroundColor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "6px",
              padding: "0.875rem 1rem",
              marginBottom: "1.5rem",
              fontFamily: "sans-serif",
              fontSize: "0.875rem",
              color: "#92400e",
            }}
          >
            ⚠ Document generation is still processing or output files are not yet available. Refresh this page in a moment.
          </div>
        )}

        {/* Collapsible Detail Sections */}
        <div style={{ marginTop: "1.5rem" }}>
          <h2 style={{ ...sectionHeadingStyle, marginBottom: "1.25rem" }}>
            Detailed Analysis
          </h2>

          <CollapsibleSection
            title={`Schedule B-II Exceptions (${exceptions.length})`}
            defaultOpen={exceptions.length > 0}
          >
            {exceptions.length === 0 ? (
              <p style={emptyStyle}>No exceptions data available.</p>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "sans-serif", fontSize: "0.875rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Description</th>
                      <th style={thStyle}>Risk</th>
                      <th style={thStyle}>Objection</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exceptions.map((ex, i) => {
                      const risk = parseRiskLevel(ex.risk);
                      const rc = riskColors[risk];
                      return (
                        <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tdStyle}>{ex.number || i + 1}</td>
                          <td style={{ ...tdStyle, maxWidth: "320px" }}>{ex.description}</td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                backgroundColor: rc.bg,
                                color: rc.text,
                                padding: "2px 8px",
                                borderRadius: "4px",
                                fontSize: "0.75rem",
                                fontWeight: "700",
                              }}
                            >
                              {rc.dot} {risk}
                            </span>
                          </td>
                          <td style={{ ...tdStyle, maxWidth: "220px", color: "#64748b" }}>
                            {ex.objection || "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title={`Recommended Endorsements (${endorsements.length})`}
            defaultOpen={false}
          >
            {endorsements.length === 0 ? (
              <p style={emptyStyle}>No endorsements data available.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "sans-serif", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    <th style={thStyle}>Code</th>
                    <th style={thStyle}>Endorsement</th>
                    <th style={thStyle}>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {endorsements.map((e, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={tdStyle}>
                        <span
                          style={{
                            backgroundColor: "#f5e6b8",
                            color: "#0a1628",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            fontWeight: "700",
                            fontFamily: "monospace",
                          }}
                        >
                          {e.code}
                        </span>
                      </td>
                      <td style={tdStyle}>{e.name}</td>
                      <td style={{ ...tdStyle, color: "#64748b" }}>{e.reason || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title={`Survey Issues (${surveyIssues.length})`}
            defaultOpen={surveyIssues.length > 0}
          >
            {surveyIssues.length === 0 ? (
              <p style={emptyStyle}>No survey issues identified.</p>
            ) : (
              <ul style={{ margin: 0, padding: "0 0 0 1.25rem", fontFamily: "sans-serif", fontSize: "0.9375rem", lineHeight: "1.75" }}>
                {surveyIssues.map((issue, i) => (
                  <li key={i} style={{ color: "#374151", marginBottom: "0.375rem" }}>
                    {issue}
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSection>

          <CollapsibleSection
            title={`Open Items (${openItems.length})`}
            defaultOpen={openItems.length > 0}
          >
            {openItems.length === 0 ? (
              <p style={emptyStyle}>No open items.</p>
            ) : (
              <ol style={{ margin: 0, padding: "0 0 0 1.25rem", fontFamily: "sans-serif", fontSize: "0.9375rem", lineHeight: "1.75" }}>
                {openItems.map((item, i) => (
                  <li key={i} style={{ color: "#374151", marginBottom: "0.375rem" }}>
                    {item}
                  </li>
                ))}
              </ol>
            )}
          </CollapsibleSection>
        </div>

        {/* Bottom CTA */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
          <Link
            href="/review/new"
            style={{
              backgroundColor: "#0a1628",
              color: "white",
              padding: "12px 32px",
              borderRadius: "6px",
              textDecoration: "none",
              fontFamily: "sans-serif",
              fontWeight: "700",
              fontSize: "0.9375rem",
            }}
          >
            Start New Review →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#060e1a",
          color: "#64748b",
          padding: "1.5rem 2rem",
          textAlign: "center",
          fontFamily: "sans-serif",
          fontSize: "0.8125rem",
        }}
      >
        TitleWyse is an AI-assisted legal tool. All outputs require review by licensed counsel.
      </footer>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function DownloadCard({
  title,
  description,
  icon,
  docxUrl,
  pdfUrl,
}: {
  title: string;
  description: string;
  icon: string;
  docxUrl?: string;
  pdfUrl?: string;
}) {
  return (
    <div
      style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "1.5rem",
      }}
    >
      <div style={{ display: "flex", gap: "0.875rem", marginBottom: "0.875rem" }}>
        <span style={{ fontSize: "1.75rem" }}>{icon}</span>
        <div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: "700",
              color: "#0a1628",
              marginBottom: "0.25rem",
            }}
          >
            {title}
          </h3>
          <p
            style={{
              color: "#64748b",
              fontFamily: "sans-serif",
              fontSize: "0.8125rem",
              lineHeight: "1.55",
            }}
          >
            {description}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap" }}>
        {docxUrl ? (
          <a
            href={docxUrl}
            download
            style={downloadBtnStyle("#0a1628", "white")}
          >
            ⬇ DOCX
          </a>
        ) : (
          <span style={disabledBtnStyle}>⬇ DOCX</span>
        )}
        {pdfUrl ? (
          <a
            href={pdfUrl}
            download
            style={downloadBtnStyle("#c9a84c", "#0a1628")}
          >
            ⬇ PDF
          </a>
        ) : (
          <span style={disabledBtnStyle}>⬇ PDF</span>
        )}
      </div>
    </div>
  );
}

const downloadBtnStyle = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-block",
  backgroundColor: bg,
  color: color,
  padding: "8px 20px",
  borderRadius: "5px",
  textDecoration: "none",
  fontFamily: "sans-serif",
  fontSize: "0.875rem",
  fontWeight: "700",
});

const disabledBtnStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#f1f5f9",
  color: "#94a3b8",
  padding: "8px 20px",
  borderRadius: "5px",
  fontFamily: "sans-serif",
  fontSize: "0.875rem",
  fontWeight: "700",
};

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

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "sans-serif",
  textTransform: "uppercase" as const,
  letterSpacing: "0.06em",
  fontSize: "0.8125rem",
  fontWeight: "700",
  color: "#0a1628",
  borderBottom: "2px solid #c9a84c",
  paddingBottom: "0.5rem",
  display: "inline-block",
};

const spinnerStyle: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  border: "4px solid #e2e8f0",
  borderTopColor: "#c9a84c",
  animation: "spin 1s linear infinite",
  margin: "0 auto",
};

const emptyStyle: React.CSSProperties = {
  fontFamily: "sans-serif",
  color: "#94a3b8",
  fontSize: "0.9375rem",
  fontStyle: "italic",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: "700",
  fontSize: "0.75rem",
  color: "#374151",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  borderBottom: "2px solid #e2e8f0",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  verticalAlign: "top",
  color: "#0f172a",
};
