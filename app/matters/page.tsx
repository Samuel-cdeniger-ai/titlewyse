"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listMatters, deleteMatter, Matter } from "@/lib/api";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:      "#0D1B2A",
  gold:      "#B8922A",
  parchment: "#F5F0E8",
  white:     "#FFFFFF",
  ink:       "#2C2C2C",
  inkLight:  "#6B6B6B",
  error:     "#8B2020",
  green:     "#1A5C2A",
  border:    "#DDD5C4",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(raw: string): string {
  if (!raw) return "—";
  // Try ISO date strings
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function truncate(str: string, max: number): string {
  if (!str) return "—";
  return str.length > max ? str.slice(0, max) + "…" : str;
}

function propertyLabel(m: Matter): string {
  const legal = m.schedule_a?.legal_description || m.property_description;
  if (legal && legal.trim()) return truncate(legal.trim(), 60);
  if (m.buyer_name && m.buyer_name.trim()) return m.buyer_name.trim();
  return "—";
}

function RiskBadge({ risk }: { risk: string }) {
  const styles: Record<string, { bg: string; label: string }> = {
    RED:     { bg: C.error, label: "HIGH" },
    YELLOW:  { bg: C.gold, label: "MED" },
    GREEN:   { bg: C.green, label: "LOW" },
    UNKNOWN: { bg: C.inkLight, label: "—" },
  };
  const s = styles[risk?.toUpperCase()] ?? styles.UNKNOWN;
  return (
    <span style={{
      display: "inline-block",
      backgroundColor: s.bg,
      color: C.white,
      fontSize: "0.7rem",
      fontWeight: 700,
      letterSpacing: "0.08em",
      padding: "3px 10px",
      borderRadius: "999px",
      fontFamily: "'Inter', sans-serif",
      textTransform: "uppercase",
    }}>
      {s.label}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "80px 0" }}>
      <div style={{
        width: 40,
        height: 40,
        border: `3px solid ${C.border}`,
        borderTop: `3px solid ${C.gold}`,
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Desktop Table Row ────────────────────────────────────────────────────────
function TableRow({
  matter,
  onDelete,
  deleting,
}: {
  matter: Matter;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={tdStyle}>{formatDate(matter.analysis_date)}</td>
      <td style={tdStyle}>{matter.matter_ref || "—"}</td>
      <td style={{ ...tdStyle, maxWidth: 280 }}>{propertyLabel(matter)}</td>
      <td style={tdStyle}><RiskBadge risk={matter.overall_risk} /></td>
      <td style={{ ...tdStyle, textAlign: "center" }}>{matter.objection_count ?? 0}</td>
      <td style={{ ...tdStyle, whiteSpace: "nowrap" }}>
        <Link
          href={`/review/${matter.analysis_id}/results`}
          style={{
            display: "inline-block",
            color: C.gold,
            border: `1px solid ${C.gold}`,
            padding: "5px 14px",
            textDecoration: "none",
            fontSize: "0.8rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
            letterSpacing: "0.03em",
            marginRight: 8,
          }}
        >
          View Results
        </Link>
        <button
          onClick={() => onDelete(matter.analysis_id)}
          disabled={deleting}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            color: C.inkLight,
            padding: "5px 10px",
            fontSize: "0.75rem",
            fontFamily: "'Inter', sans-serif",
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

const tdStyle: React.CSSProperties = {
  padding: "14px 16px",
  fontSize: "0.875rem",
  fontFamily: "'Inter', sans-serif",
  color: C.ink,
  verticalAlign: "middle",
};

const thStyle: React.CSSProperties = {
  padding: "10px 16px",
  fontSize: "0.7rem",
  fontFamily: "'Inter', sans-serif",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: C.inkLight,
  textAlign: "left",
  borderBottom: `2px solid ${C.border}`,
  backgroundColor: C.parchment,
};

// ─── Mobile Card ──────────────────────────────────────────────────────────────
function MatterCard({
  matter,
  onDelete,
  deleting,
}: {
  matter: Matter;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div style={{
      backgroundColor: C.white,
      border: `1px solid ${C.border}`,
      borderRadius: 4,
      padding: "20px",
      marginBottom: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontSize: "0.8rem", color: C.inkLight, fontFamily: "'Inter', sans-serif" }}>
          {formatDate(matter.analysis_date)}
        </span>
        <RiskBadge risk={matter.overall_risk} />
      </div>
      <div style={{ fontSize: "0.95rem", fontWeight: 600, color: C.ink, fontFamily: "'Merriweather', Georgia, serif", marginBottom: 4 }}>
        {propertyLabel(matter)}
      </div>
      {matter.matter_ref && (
        <div style={{ fontSize: "0.8rem", color: C.inkLight, fontFamily: "'Inter', sans-serif", marginBottom: 4 }}>
          Ref: {matter.matter_ref}
        </div>
      )}
      <div style={{ fontSize: "0.8rem", color: C.inkLight, fontFamily: "'Inter', sans-serif", marginBottom: 16 }}>
        {matter.objection_count ?? 0} objection{(matter.objection_count ?? 0) !== 1 ? "s" : ""}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Link
          href={`/review/${matter.analysis_id}/results`}
          style={{
            flex: 1,
            display: "block",
            textAlign: "center",
            color: C.gold,
            border: `1px solid ${C.gold}`,
            padding: "8px 0",
            textDecoration: "none",
            fontSize: "0.85rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}
        >
          View Results
        </Link>
        <button
          onClick={() => onDelete(matter.analysis_id)}
          disabled={deleting}
          style={{
            background: "none",
            border: `1px solid ${C.border}`,
            color: C.inkLight,
            padding: "8px 16px",
            fontSize: "0.8rem",
            fontFamily: "'Inter', sans-serif",
            cursor: deleting ? "not-allowed" : "pointer",
            opacity: deleting ? 0.5 : 1,
          }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listMatters();
      setMatters(data.matters);
    } catch (e) {
      setError((e as Error).message || "Failed to load matters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (analysisId: string) => {
    if (!confirm("Delete this matter? This cannot be undone.")) return;
    setDeletingId(analysisId);
    try {
      await deleteMatter(analysisId);
      setMatters(prev => prev.filter(m => m.analysis_id !== analysisId));
    } catch (e) {
      alert((e as Error).message || "Failed to delete matter");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ backgroundColor: C.parchment, color: C.ink, minHeight: "100vh" }}>

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav style={{
        backgroundColor: C.navy,
        padding: "0 2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px",
        borderBottom: `1px solid rgba(255,255,255,0.08)`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img
              src="/logo-primary.svg"
              alt="TitleWyse"
              style={{ height: "44px", width: "auto", display: "block" }}
            />
          </Link>
          <Link href="/matters" style={{
            color: C.gold,
            textDecoration: "none",
            fontSize: "0.85rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            letterSpacing: "0.02em",
            borderBottom: `2px solid ${C.gold}`,
            paddingBottom: "2px",
          }}>
            All Matters
          </Link>
        </div>
        <Link href="/review/new" style={{
          color: C.gold,
          border: `1px solid ${C.gold}`,
          padding: "9px 22px",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          letterSpacing: "0.04em",
        }}>
          New Matter →
        </Link>
      </nav>

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: C.navy,
        padding: "48px 2rem 52px",
        borderBottom: `1px solid rgba(255,255,255,0.06)`,
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            fontSize: "0.7rem",
            fontFamily: "'Inter', sans-serif",
            color: C.gold,
            fontWeight: 700,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}>
            Admin
          </div>
          <h1 style={{
            margin: 0,
            fontFamily: "'Merriweather', Georgia, serif",
            fontSize: "2rem",
            fontWeight: 700,
            color: C.white,
            letterSpacing: "-0.01em",
          }}>
            All Matters
          </h1>
          <p style={{
            margin: "10px 0 0",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.55)",
          }}>
            Browse and reopen past title analyses.
          </p>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 2rem 80px" }}>

        {loading && <Spinner />}

        {error && (
          <div style={{
            backgroundColor: "rgba(139,32,32,0.08)",
            border: `1px solid ${C.error}`,
            color: C.error,
            padding: "16px 20px",
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.875rem",
            borderRadius: 2,
            marginBottom: 24,
          }}>
            {error}
            <button
              onClick={load}
              style={{
                marginLeft: 16,
                background: "none",
                border: "none",
                color: C.error,
                textDecoration: "underline",
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.875rem",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && matters.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{
              fontSize: "2.5rem",
              marginBottom: 20,
              opacity: 0.3,
            }}>
              📂
            </div>
            <div style={{
              fontFamily: "'Merriweather', Georgia, serif",
              fontSize: "1.2rem",
              color: C.ink,
              marginBottom: 12,
            }}>
              No matters yet.
            </div>
            <Link href="/review/new" style={{
              color: C.gold,
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.9rem",
              fontWeight: 500,
            }}>
              Start your first analysis →
            </Link>
          </div>
        )}

        {!loading && matters.length > 0 && (
          <>
            {/* ── Desktop table (hidden on mobile) ── */}
            <div className="matters-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{
                width: "100%",
                borderCollapse: "collapse",
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
              }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date</th>
                    <th style={thStyle}>Matter Ref</th>
                    <th style={thStyle}>Property</th>
                    <th style={thStyle}>Risk</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Objections</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {matters.map(m => (
                    <TableRow
                      key={m.analysis_id}
                      matter={m}
                      onDelete={handleDelete}
                      deleting={deletingId === m.analysis_id}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards (hidden on desktop) ── */}
            <div className="matters-cards-wrap">
              {matters.map(m => (
                <MatterCard
                  key={m.analysis_id}
                  matter={m}
                  onDelete={handleDelete}
                  deleting={deletingId === m.analysis_id}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        .matters-table-wrap { display: block; }
        .matters-cards-wrap  { display: none; }
        @media (max-width: 700px) {
          .matters-table-wrap { display: none; }
          .matters-cards-wrap  { display: block; }
        }
      `}</style>
    </div>
  );
}
