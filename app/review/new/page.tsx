"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = "http://localhost:8001";

type DocType = "Commitment" | "Exception" | "Survey" | "Other";

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
  if (lower.includes("commitment") || lower.includes("commit") || lower.includes("title")) return "Commitment";
  if (lower.includes("exception") || lower.includes("schedule") || lower.includes("b-ii") || lower.includes("bii")) return "Exception";
  if (lower.includes("survey") || lower.includes("plat") || lower.includes("metes")) return "Survey";
  return "Other";
}

const docTypeBadgeColors: Record<DocType, { bg: string; text: string }> = {
  Commitment: { bg: "#dbeafe", text: "#1e40af" },
  Exception: { bg: "#fef3c7", text: "#92400e" },
  Survey: { bg: "#d1fae5", text: "#065f46" },
  Other: { bg: "#f3f4f6", text: "#374151" },
};

export default function NewReviewPage() {
  const router = useRouter();
  const [buyerName, setBuyerName] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [intendedUse, setIntendedUse] = useState("Residential");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles);
    const toAdd: UploadedFile[] = arr
      .filter((f) => files.length + arr.indexOf(f) < 50)
      .map((f) => ({
        id: `${f.name}-${Date.now()}-${Math.random()}`,
        file: f,
        docType: classifyFile(f.name),
        status: "pending",
      }));
    setFiles((prev) => [...prev, ...toAdd]);
  }, [files.length]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const updateDocType = (id: string, docType: DocType) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, docType } : f)));
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (!buyerName.trim() || !propertyAddress.trim() || files.length === 0) return;
    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Upload all files
      const uploadedIds: string[] = [];

      for (const uf of files) {
        const formData = new FormData();
        formData.append("file", uf.file);
        formData.append("doc_type_hint", uf.docType.toLowerCase());

        setFiles((prev) =>
          prev.map((f) => (f.id === uf.id ? { ...f, status: "uploading" } : f))
        );

        const res = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.text();
          setFiles((prev) =>
            prev.map((f) =>
              f.id === uf.id ? { ...f, status: "error", error: err } : f
            )
          );
          throw new Error(`Upload failed for ${uf.file.name}: ${err}`);
        }

        const data = await res.json();
        uploadedIds.push(data.document_id || data.id || data.document?.id);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uf.id
              ? { ...f, status: "done", uploadedId: data.document_id || data.id }
              : f
          )
        );
      }

      // Start analysis
      const analyzeRes = await fetch(`${API_BASE}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_ids: uploadedIds.filter(Boolean),
          buyer_name: buyerName,
          property_address: propertyAddress,
          intended_use: intendedUse,
        }),
      });

      if (!analyzeRes.ok) {
        throw new Error(`Analysis request failed: ${analyzeRes.statusText}`);
      }

      const analyzeData = await analyzeRes.json();
      const reviewId =
        analyzeData.review_id ||
        analyzeData.id ||
        analyzeData.job_id ||
        uploadedIds[0];

      // Store matter info for results page
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          `review_${reviewId}`,
          JSON.stringify({
            buyerName,
            propertyAddress,
            intendedUse,
            documentIds: uploadedIds.filter(Boolean),
          })
        );
      }

      router.push(`/review/${reviewId}/processing`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    buyerName.trim().length > 0 &&
    propertyAddress.trim().length > 0 &&
    files.length > 0 &&
    !isSubmitting;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8f9fb" }}>
      {/* Nav */}
      <nav
        style={{
          backgroundColor: "#0a1628",
          borderBottom: "1px solid #1a3a6b",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "60px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#c9a84c",
            textDecoration: "none",
            fontSize: "1.25rem",
            fontWeight: "700",
          }}
        >
          TitleWyse
        </Link>
        <span
          style={{
            color: "#94a3b8",
            fontSize: "0.875rem",
            fontFamily: "sans-serif",
          }}
        >
          New Title Review
        </span>
      </nav>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "2rem 1.5rem 4rem" }}>
        {/* Header */}
        <div style={{ marginBottom: "2rem" }}>
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: "700",
              color: "#0a1628",
              marginBottom: "0.5rem",
            }}
          >
            New Title Review
          </h1>
          <p
            style={{
              color: "#64748b",
              fontFamily: "sans-serif",
              fontSize: "0.9375rem",
            }}
          >
            Enter matter details and upload your title documents below.
          </p>
        </div>

        {/* Matter Info Card */}
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1rem",
              fontWeight: "700",
              color: "#0a1628",
              marginBottom: "1.25rem",
              fontFamily: "sans-serif",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              fontSize: "0.8125rem",
              borderBottom: "2px solid #c9a84c",
              paddingBottom: "0.5rem",
              display: "inline-block",
            }}
          >
            Matter Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1.25rem",
            }}
          >
            <div>
              <label style={labelStyle}>Buyer Name *</label>
              <input
                type="text"
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="e.g. Acme Holdings, LLC"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Property Address *</label>
              <input
                type="text"
                value={propertyAddress}
                onChange={(e) => setPropertyAddress(e.target.value)}
                placeholder="123 Main St, Dallas, TX 75201"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Intended Use</label>
              <select
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}
              >
                <option>Commercial</option>
                <option>Residential</option>
                <option>Mixed-Use</option>
                <option>Investment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div
          style={{
            backgroundColor: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              ...sectionHeadingStyle,
              marginBottom: "1.25rem",
            }}
          >
            Documents
          </h2>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${isDragging ? "#c9a84c" : "#cbd5e1"}`,
              borderRadius: "8px",
              padding: "2.5rem 2rem",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: isDragging ? "#fffbeb" : "#f8fafc",
              marginBottom: files.length > 0 ? "1.5rem" : "0",
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>📁</div>
            <p
              style={{
                color: "#0a1628",
                fontFamily: "sans-serif",
                fontSize: "0.9375rem",
                fontWeight: "600",
                marginBottom: "0.375rem",
              }}
            >
              Drag & drop files here, or click to browse
            </p>
            <p
              style={{
                color: "#94a3b8",
                fontFamily: "sans-serif",
                fontSize: "0.8125rem",
              }}
            >
              Accepts PDF, JPEG, PNG, TIFF · Up to 50 files
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
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "0.75rem",
                  alignItems: "center",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #e2e8f0",
                  marginBottom: "0.5rem",
                }}
              >
                <span style={colHeaderStyle}>File</span>
                <span style={colHeaderStyle}>Size</span>
                <span style={colHeaderStyle}>Type</span>
                <span style={colHeaderStyle}>Status</span>
              </div>

              {files.map((uf) => {
                const badge = docTypeBadgeColors[uf.docType];
                return (
                  <div
                    key={uf.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto auto auto",
                      gap: "0.75rem",
                      alignItems: "center",
                      padding: "0.625rem 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        overflow: "hidden",
                      }}
                    >
                      <span style={{ fontSize: "1rem" }}>
                        {uf.file.name.endsWith(".pdf") ? "📄" : "🖼️"}
                      </span>
                      <span
                        style={{
                          fontFamily: "sans-serif",
                          fontSize: "0.875rem",
                          color: "#0f172a",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {uf.file.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontFamily: "sans-serif",
                        fontSize: "0.8125rem",
                        color: "#64748b",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(uf.file.size / 1024).toFixed(0)} KB
                    </span>

                    <select
                      value={uf.docType}
                      onChange={(e) => updateDocType(uf.id, e.target.value as DocType)}
                      style={{
                        backgroundColor: badge.bg,
                        color: badge.text,
                        border: "none",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "0.75rem",
                        fontFamily: "sans-serif",
                        fontWeight: "600",
                        cursor: "pointer",
                      }}
                    >
                      <option>Commitment</option>
                      <option>Exception</option>
                      <option>Survey</option>
                      <option>Other</option>
                    </select>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {uf.status === "uploading" && (
                        <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontFamily: "sans-serif" }}>
                          ↑ uploading
                        </span>
                      )}
                      {uf.status === "done" && (
                        <span style={{ fontSize: "0.875rem" }}>✅</span>
                      )}
                      {uf.status === "error" && (
                        <span style={{ fontSize: "0.75rem", color: "#dc2626", fontFamily: "sans-serif" }}>
                          ⚠ {uf.error?.slice(0, 30)}
                        </span>
                      )}
                      {uf.status === "pending" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(uf.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#94a3b8",
                            fontSize: "1rem",
                            padding: "2px",
                          }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}

              <p
                style={{
                  fontFamily: "sans-serif",
                  fontSize: "0.8125rem",
                  color: "#94a3b8",
                  marginTop: "0.75rem",
                }}
              >
                {files.length} file{files.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          )}
        </div>

        {/* Error */}
        {submitError && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "6px",
              padding: "0.875rem 1rem",
              marginBottom: "1.25rem",
              fontFamily: "sans-serif",
              fontSize: "0.875rem",
              color: "#991b1b",
            }}
          >
            ⚠ {submitError}
          </div>
        )}

        {/* Submit */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? "#0a1628" : "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: "6px",
              padding: "14px 36px",
              fontSize: "1rem",
              fontFamily: "sans-serif",
              fontWeight: "700",
              cursor: canSubmit ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "16px",
                    height: "16px",
                    border: "2px solid white",
                    borderTopColor: "transparent",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                Processing…
              </>
            ) : (
              "Run Analysis →"
            )}
          </button>
        </div>

        {!canSubmit && !isSubmitting && (
          <p
            style={{
              textAlign: "right",
              fontFamily: "sans-serif",
              fontSize: "0.8125rem",
              color: "#94a3b8",
              marginTop: "0.5rem",
            }}
          >
            {files.length === 0
              ? "Upload at least one document to continue."
              : "Enter buyer name and property address to continue."}
          </p>
        )}
      </div>

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
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8125rem",
  fontFamily: "sans-serif",
  fontWeight: "600",
  color: "#374151",
  marginBottom: "0.375rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "6px",
  fontSize: "0.9375rem",
  fontFamily: "sans-serif",
  color: "#0f172a",
  backgroundColor: "white",
  outline: "none",
};

const sectionHeadingStyle: React.CSSProperties = {
  fontFamily: "sans-serif",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  fontSize: "0.8125rem",
  fontWeight: "700",
  color: "#0a1628",
  borderBottom: "2px solid #c9a84c",
  paddingBottom: "0.5rem",
  display: "inline-block",
};

const colHeaderStyle: React.CSSProperties = {
  fontFamily: "sans-serif",
  fontSize: "0.75rem",
  fontWeight: "700",
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
