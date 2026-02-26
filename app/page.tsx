import Link from "next/link";

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
      {/* Nav */}
      <nav
        style={{
          backgroundColor: "#0a1628",
          borderBottom: "1px solid #1a3a6b",
          padding: "0 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            style={{
              color: "#c9a84c",
              fontSize: "1.5rem",
              fontWeight: "700",
              letterSpacing: "-0.02em",
            }}
          >
            TitleWyse
          </span>
          <span
            style={{
              color: "#94a3b8",
              fontSize: "0.75rem",
              fontFamily: "sans-serif",
              marginTop: "4px",
            }}
          >
            TEXAS TITLE REVIEW
          </span>
        </div>
        <Link
          href="/review/new"
          style={{
            backgroundColor: "#c9a84c",
            color: "#0a1628",
            padding: "8px 20px",
            borderRadius: "4px",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontFamily: "sans-serif",
            fontWeight: "600",
          }}
        >
          Start a Review
        </Link>
      </nav>

      {/* Hero */}
      <section
        style={{
          backgroundColor: "#0a1628",
          color: "white",
          padding: "80px 2rem 100px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div
            style={{
              display: "inline-block",
              backgroundColor: "#112240",
              border: "1px solid #1a3a6b",
              color: "#c9a84c",
              fontSize: "0.75rem",
              letterSpacing: "0.12em",
              fontFamily: "sans-serif",
              padding: "6px 16px",
              borderRadius: "2px",
              marginBottom: "2rem",
            }}
          >
            POWERED BY AI · BUILT FOR TEXAS REAL ESTATE
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: "700",
              lineHeight: "1.15",
              marginBottom: "1.5rem",
              letterSpacing: "-0.02em",
            }}
          >
            AI-Powered Title Review.{" "}
            <span style={{ color: "#c9a84c" }}>Texas-Grade Precision.</span>
          </h1>

          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: "1.75",
              color: "#94a3b8",
              fontFamily: "sans-serif",
              marginBottom: "2.5rem",
              maxWidth: "600px",
              margin: "0 auto 2.5rem",
            }}
          >
            Upload your title commitment, exception documents, and survey. Get a
            professional objection letter and issues summary in minutes.
          </p>

          <Link
            href="/review/new"
            style={{
              display: "inline-block",
              backgroundColor: "#c9a84c",
              color: "#0a1628",
              padding: "16px 40px",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "1.0625rem",
              fontFamily: "sans-serif",
              fontWeight: "700",
              letterSpacing: "0.01em",
            }}
          >
            Start a Review →
          </Link>

          <p
            style={{
              color: "#64748b",
              fontSize: "0.8125rem",
              fontFamily: "sans-serif",
              marginTop: "1rem",
            }}
          >
            Commercial, Residential & Investment Properties
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section
        style={{
          backgroundColor: "#f8f9fb",
          padding: "80px 2rem",
          borderTop: "1px solid #e2e8f0",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "#0a1628",
              marginBottom: "0.75rem",
            }}
          >
            How It Works
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#64748b",
              fontFamily: "sans-serif",
              fontSize: "0.9375rem",
              marginBottom: "3.5rem",
            }}
          >
            Three steps from raw documents to a polished attorney-ready letter.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "2rem",
            }}
          >
            {steps.map((step, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "2rem",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    backgroundColor: "#0a1628",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "1.25rem",
                  }}
                >
                  <span
                    style={{
                      color: "#c9a84c",
                      fontSize: "1.25rem",
                    }}
                  >
                    {step.icon}
                  </span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "2rem",
                    right: "2rem",
                    width: "28px",
                    height: "28px",
                    backgroundColor: "#f5e6b8",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8125rem",
                    fontWeight: "700",
                    color: "#0a1628",
                    fontFamily: "sans-serif",
                  }}
                >
                  {i + 1}
                </div>
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    color: "#0a1628",
                    marginBottom: "0.75rem",
                  }}
                >
                  {step.title}
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    fontSize: "0.9375rem",
                    lineHeight: "1.65",
                    fontFamily: "sans-serif",
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why TitleWyse */}
      <section style={{ backgroundColor: "#0a1628", padding: "80px 2rem" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2
            style={{
              textAlign: "center",
              fontSize: "1.875rem",
              fontWeight: "700",
              color: "white",
              marginBottom: "0.75rem",
            }}
          >
            Built for Texas Real Estate Professionals
          </h2>
          <p
            style={{
              textAlign: "center",
              color: "#94a3b8",
              fontFamily: "sans-serif",
              fontSize: "0.9375rem",
              marginBottom: "3rem",
            }}
          >
            Every output follows TLTA standards and Texas title law.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {features.map((f, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: "#112240",
                  border: "1px solid #1a3a6b",
                  borderRadius: "8px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <span style={{ fontSize: "1.5rem" }}>{f.icon}</span>
                <h4
                  style={{
                    color: "#c9a84c",
                    fontSize: "0.9375rem",
                    fontWeight: "700",
                  }}
                >
                  {f.title}
                </h4>
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: "0.875rem",
                    lineHeight: "1.6",
                    fontFamily: "sans-serif",
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Strip */}
      <section
        style={{
          backgroundColor: "#c9a84c",
          padding: "60px 2rem",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "#0a1628",
              marginBottom: "1rem",
            }}
          >
            Ready to review your title?
          </h2>
          <p
            style={{
              color: "#1a3a6b",
              fontFamily: "sans-serif",
              marginBottom: "2rem",
            }}
          >
            Upload your documents and receive a professional analysis in minutes.
          </p>
          <Link
            href="/review/new"
            style={{
              display: "inline-block",
              backgroundColor: "#0a1628",
              color: "white",
              padding: "14px 36px",
              borderRadius: "4px",
              textDecoration: "none",
              fontSize: "1rem",
              fontFamily: "sans-serif",
              fontWeight: "700",
            }}
          >
            Start a Review →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          backgroundColor: "#060e1a",
          color: "#64748b",
          padding: "2rem",
          textAlign: "center",
          fontFamily: "sans-serif",
          fontSize: "0.8125rem",
        }}
      >
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          <div
            style={{ color: "#c9a84c", fontWeight: "700", marginBottom: "0.75rem", fontSize: "1rem", fontFamily: "Georgia, serif" }}
          >
            TitleWyse
          </div>
          <p style={{ lineHeight: "1.7", color: "#64748b" }}>
            TitleWyse is an AI-assisted legal tool. All outputs require review by licensed counsel.
          </p>
          <p style={{ marginTop: "0.5rem", color: "#475569" }}>
            © {new Date().getFullYear()} TitleWyse. Texas Real Estate Title Review.
          </p>
        </div>
      </footer>
    </div>
  );
}

const steps = [
  {
    icon: "📄",
    title: "1. Upload",
    desc: "Upload your title commitment, Schedule B exceptions, survey, and any supporting documents. We accept PDF, JPEG, PNG, and TIFF.",
  },
  {
    icon: "🔍",
    title: "2. Analyze",
    desc: "Our AI engine extracts text, classifies documents, and applies Texas title law and TLTA standards to surface every risk.",
  },
  {
    icon: "📋",
    title: "3. Download",
    desc: "Receive a fully formatted Title Objection Letter and Title & Survey Issues Summary — both as DOCX and PDF.",
  },
];

const features = [
  {
    icon: "⚖️",
    title: "TLTA Standards",
    desc: "Every objection follows Texas Land Title Association guidelines and Texas Insurance Code.",
  },
  {
    icon: "🔴",
    title: "Risk Scoring",
    desc: "8-category risk grid with Red / Yellow / Green ratings. Know what needs attention at a glance.",
  },
  {
    icon: "📑",
    title: "Schedule B Analysis",
    desc: "Full B-I requirements review and B-II exception analysis with recommended TLTA endorsements.",
  },
  {
    icon: "🗺️",
    title: "Survey Review",
    desc: "Identifies encroachments, easements, flood zones, and discrepancies from your survey documents.",
  },
];
