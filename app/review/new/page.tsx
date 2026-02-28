"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { uploadDocument, startAnalysis } from "@/lib/api";

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  navy:          "#0A1628",
  navyLight:     "#162440",
  gold:          "#C9A84C",
  goldLight:     "#E8CC7A",
  gold40:        "rgba(201,168,76,0.40)",
  parchment:     "#F8F7F4",
  parchmentDark: "#EEE9E0",
  ink:           "#1C1C1C",
  inkMuted:      "#4A4A4A",
  inkLight:      "#7A7A7A",
  border:        "#E2DDD6",
  white:         "#ffffff",
  error:         "#8B2020",
  errorBg:       "rgba(139,32,32,0.06)",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type DocType = "COMMITMENT" | "EXCEPTION" | "SURVEY" | "PLAT" | "OTHER";

interface UploadedFile {
  id: string;
  file: File;
  docType: DocType;
  uploadedId?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
}

function classifyFile(name: string): DocType {
  const lower = name.toLowerCase();
  if (lower.includes("commitment") || lower.includes("commit") || lower.includes("title")) return "COMMITMENT";
  if (lower.includes("exception") || lower.includes("schedule") || lower.includes("b-ii") || lower.includes("bii")) return "EXCEPTION";
  if (lower.includes("plat")) return "PLAT";
  if (lower.includes("survey") || lower.includes("metes")) return "SURVEY";
  return "OTHER";
}

// DocType → API value mapping
const docTypeApiMap: Record<DocType, string> = {
  COMMITMENT: "Commitment",
  EXCEPTION: "Exception",
  SURVEY: "Survey",
  PLAT: "Survey",
  OTHER: "Other",
};

// ─── Matter reference generator ───────────────────────────────────────────────
function generateMatterRef(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `TW-${year}-${num}`;
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

export default function NewMatterPage() {
  const router = useRouter();
  const [matterRef] = useState(generateMatterRef);
  const [buyerName, setBuyerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [intendedUse, setIntendedUse] = useState("Commercial");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const toAdd: UploadedFile[] = arr
      .filter((_, idx) => files.length + idx < 50)
      .map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        docType: classifyFile(f.name),
        status: "pending",
      }));
    setFiles((prev) => [...prev, ...toAdd]);
  }, [files.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const updateDocType = (id: string, docType: DocType) =>
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, docType } : f)));

  const removeFile = (id: string) =>
    setFiles((prev) => prev.filter((f) => f.id !== id));

  const handleSubmit = async () => {
    if (!buyerName.trim() || !propertyAddress.trim() || files.length === 0) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const uploadedIds: string[] = [];

      for (const uf of files) {
        const formData = new FormData();
        formData.append("file", uf.file);
        formData.append("doc_type_hint", docTypeApiMap[uf.docType].toLowerCase());

        setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, status: "uploading" } : f)));

        try {
          const data = await uploadDocument(uf.file, docTypeApiMap[uf.docType]);
          uploadedIds.push(data.document_id);
          setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, status: "done", uploadedId: data.document_id } : f)));
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, status: "error", error: msg } : f)));
          throw err;
        }
      }

      const analyzeData = await startAnalysis({
        document_ids: uploadedIds.filter(Boolean),
        buyer_name: buyerName,
        property_address: propertyAddress,
        intended_use: intendedUse,
        matter_ref: matterRef,
      });

      const jobId = analyzeData.job_id;

      if (typeof window !== "undefined") {
        sessionStorage.setItem(`review_${jobId}`, JSON.stringify({
          buyerName,
          propertyAddress,
          intendedUse,
          matterRef,
          documentIds: uploadedIds.filter(Boolean),
          // If backend returned analysis_id synchronously (legacy), store it
          analysisId: null,
        }));
      }

      router.push(`/review/${jobId}/processing`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  const canSubmit = buyerName.trim().length > 0 && propertyAddress.trim().length > 0 && files.length > 0 && !isSubmitting;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.parchment, color: C.ink }}>

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav style={{
        backgroundColor: C.navy,
        padding: "0 3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px",
        borderBottom: `1px solid ${C.navyLight}`,
      }}>
        <Wordmark />
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <Link href="/matters" style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.8rem",
            letterSpacing: "0.02em",
            color: "rgba(201,168,76,0.7)",
            textDecoration: "none",
          }}>
            All Matters
          </Link>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6875rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "rgba(201,168,76,0.55)",
          }}>
            New Matter
          </span>
        </div>
      </nav>

      <div style={{ maxWidth: "820px", margin: "0 auto", padding: "4rem 2rem 6rem" }}>

        {/* ── Page Header ──────────────────────────────────────────────── */}
        <div style={{ marginBottom: "3rem" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "2.5rem",
            fontWeight: 400,
            color: C.navy,
            marginBottom: "0.875rem",
            lineHeight: 1.2,
          }}>
            Open a New Matter
          </h1>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "1rem",
            color: C.inkMuted,
            lineHeight: 1.7,
          }}>
            Upload your title commitment, exception documents, and survey for AI-assisted review.
          </p>
        </div>

        {/* ── Matter Information ───────────────────────────────────────── */}
        <div style={cardStyle}>
          <SectionLabel>Matter Information</SectionLabel>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1.75rem",
            marginTop: "1.75rem",
          }}>
            {/* Matter Reference — read-only */}
            <div>
              <FieldLabel>Matter Reference</FieldLabel>
              <div style={{
                padding: "10px 14px",
                backgroundColor: C.parchmentDark,
                border: `1px solid ${C.border}`,
                color: C.gold,
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.9375rem",
                letterSpacing: "0.06em",
              }}>
                {matterRef}
              </div>
            </div>

            {/* Buyer Name */}
            <div>
              <FieldLabel>Purchaser / Buyer *</FieldLabel>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Acme Holdings, LLC"
                style={inputStyle}
              />
            </div>

            {/* Property Address */}
            <div style={{ gridColumn: "1 / -1" }}>
              <FieldLabel>Property Address *</FieldLabel>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="123 Main Street, Dallas, TX 75201"
                style={inputStyle}
              />
            </div>

            {/* Intended Use */}
            <div>
              <FieldLabel>Intended Use</FieldLabel>
              <select
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option>Commercial</option>
                <option>Residential</option>
                <option>Mixed-Use</option>
                <option>Investment</option>
                <option>Industrial</option>
                <option>Agricultural</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── Document Upload ──────────────────────────────────────────── */}
        <div style={{ ...cardStyle, marginTop: "2rem" }}>
          <SectionLabel>Documents</SectionLabel>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? C.gold : C.gold40}`,
              padding: "3.5rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: isDragging ? C.parchmentDark : C.parchment,
              marginTop: "1.75rem",
              marginBottom: files.length > 0 ? "2rem" : "0",
              transition: "border-color 160ms ease, background-color 160ms ease",
            }}
          >
            {/* Upload SVG */}
            <svg
              width="32" height="32"
              viewBox="0 0 24 24" fill="none"
              stroke={C.gold} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ margin: "0 auto 1.25rem", display: "block" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>

            <p style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontStyle: "italic",
              fontSize: "1.125rem",
              fontWeight: 400,
              color: C.navy,
              marginBottom: "0.5rem",
            }}>
              Drop documents here
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.8125rem",
              color: C.inkLight,
            }}>
              PDF, JPEG, PNG, TIFF — up to 50 files
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.tif,.tiff"
            style={{ display: "none" }}
            onChange={handleFileInputChange}
          />

          {/* File list */}
          {files.length > 0 && (
            <div>
              {/* Column headers */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 140px 60px",
                gap: "0.75rem",
                padding: "0.5rem 0",
                borderBottom: `1px solid ${C.border}`,
                marginBottom: "0.25rem",
              }}>
                {["Document", "Size", "Type", ""].map((h) => (
                  <span key={h} style={colHeaderStyle}>{h}</span>
                ))}
              </div>

              {files.map((uf) => (
                <FileRow
                  key={uf.id}
                  uf={uf}
                  onTypeChange={updateDocType}
                  onRemove={removeFile}
                />
              ))}

              <p style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.6875rem",
                letterSpacing: "0.08em",
                color: C.inkLight,
                marginTop: "1rem",
              }}>
                {files.length} {files.length === 1 ? "document" : "documents"} queued
              </p>
            </div>
          )}
        </div>

        {/* ── Error ────────────────────────────────────────────────────── */}
        {submitError && (
          <div style={{
            backgroundColor: C.errorBg,
            border: `1px solid ${C.error}`,
            padding: "1rem 1.25rem",
            marginTop: "1.5rem",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "0.875rem",
            color: C.error,
          }}>
            {submitError}
          </div>
        )}

        {/* ── Submit ───────────────────────────────────────────────────── */}
        <div style={{ marginTop: "2.5rem" }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: "100%",
              backgroundColor: canSubmit ? C.navy : C.inkLight,
              color: canSubmit ? C.white : "rgba(255,255,255,0.5)",
              border: "none",
              padding: "18px 36px",
              fontSize: "1rem",
              fontFamily: "'Playfair Display', Georgia, serif",
              fontWeight: 400,
              fontStyle: canSubmit ? "normal" : "italic",
              letterSpacing: "0.04em",
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
            }}
          >
            {isSubmitting ? (
              <>
                <span style={{
                  display: "inline-block",
                  width: "16px",
                  height: "16px",
                  border: `2px solid rgba(255,255,255,0.3)`,
                  borderTopColor: C.gold,
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }} />
                Processing Matter…
              </>
            ) : (
              "Begin Analysis →"
            )}
          </button>

          {!canSubmit && !isSubmitting && (
            <p style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 300,
              fontSize: "0.8125rem",
              color: C.inkLight,
              textAlign: "center",
              marginTop: "0.875rem",
            }}>
              {files.length === 0
                ? "Upload at least one document to continue."
                : "Enter purchaser name and property address to continue."}
            </p>
          )}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
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

// ─── FileRow ──────────────────────────────────────────────────────────────────
function FileRow({
  uf,
  onTypeChange,
  onRemove,
}: {
  uf: UploadedFile;
  onTypeChange: (id: string, t: DocType) => void;
  onRemove: (id: string) => void;
}) {
  const badgeColor: Record<DocType, string> = {
    COMMITMENT: C.navy,
    EXCEPTION: "#4A2E00",
    SURVEY: "#1A3A2A",
    PLAT: "#2C1A4A",
    OTHER: C.inkMuted,
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 80px 140px 60px",
      gap: "0.75rem",
      alignItems: "center",
      padding: "0.75rem 0",
      borderBottom: `1px solid ${C.parchmentDark}`,
    }}>
      {/* Filename */}
      <div style={{ overflow: "hidden", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6875rem", color: C.gold, flexShrink: 0 }}>
          {uf.file.name.toLowerCase().endsWith(".pdf") ? "PDF" : "IMG"}
        </span>
        <span style={{
          fontFamily: "'Inter', sans-serif",
          fontWeight: 400,
          fontSize: "0.875rem",
          color: C.ink,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {uf.file.name}
        </span>
      </div>

      {/* Size */}
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.6875rem",
        color: C.inkLight,
        letterSpacing: "0.04em",
      }}>
        {(uf.file.size / 1024).toFixed(0)} KB
      </span>

      {/* Type selector */}
      <select
        value={uf.docType}
        onChange={(e) => onTypeChange(uf.id, e.target.value as DocType)}
        style={{
          backgroundColor: badgeColor[uf.docType],
          color: C.white,
          border: "none",
          padding: "4px 8px",
          fontSize: "0.6875rem",
          fontFamily: "'DM Mono', monospace",
          letterSpacing: "0.08em",
          cursor: "pointer",
          width: "100%",
        }}
      >
        <option value="COMMITMENT">COMMITMENT</option>
        <option value="EXCEPTION">EXCEPTION</option>
        <option value="SURVEY">SURVEY</option>
        <option value="PLAT">PLAT</option>
        <option value="OTHER">OTHER</option>
      </select>

      {/* Status / Remove */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {uf.status === "uploading" && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.6rem", color: C.gold, letterSpacing: "0.06em" }}>↑</span>
        )}
        {uf.status === "done" && (
          <span style={{ color: "#1A4A2E", fontSize: "0.875rem" }}>✓</span>
        )}
        {uf.status === "error" && (
          <span style={{ color: C.error, fontSize: "0.75rem" }}>✕</span>
        )}
        {uf.status === "pending" && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(uf.id); }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: C.inkLight,
              fontSize: "0.875rem",
              padding: "2px 6px",
              lineHeight: 1,
            }}
            title="Remove"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helper components ────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "0.625rem",
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: "block",
      fontFamily: "'DM Mono', monospace",
      fontSize: "0.5625rem",
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: C.inkLight,
      marginBottom: "0.5rem",
    }}>
      {children}
    </label>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  backgroundColor: C.white,
  border: `1px solid ${C.border}`,
  padding: "2.5rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  border: `1px solid ${C.border}`,
  backgroundColor: C.parchment,
  color: C.ink,
  fontFamily: "'Inter', sans-serif",
  fontWeight: 400,
  fontSize: "0.9375rem",
  outline: "none",
};

const colHeaderStyle: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.5rem",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: C.inkLight,
};
