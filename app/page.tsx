import Link from "next/link";

// ─── Shared style tokens ──────────────────────────────────────────────────────
const C = {
  navy:          "#0A1628",
  navyLight:     "#162440",
  navyMuted:     "#2C3E5D",
  gold:          "#C9A84C",
  goldLight:     "#E8CC7A",
  parchment:     "#F8F7F4",
  parchmentDark: "#EEE9E0",
  ink:           "#1C1C1C",
  inkMuted:      "#4A4A4A",
  inkLight:      "#7A7A7A",
  border:        "#E2DDD6",
  white:         "#ffffff",
};

export default function LandingPage() {
  return (
    <div style={{ backgroundColor: C.parchment, color: C.ink, minHeight: "100vh" }}>

      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav style={{
        backgroundColor: C.navy,
        padding: "0 3rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: "72px",
        borderBottom: `1px solid ${C.navyLight}`,
      }}>
        {/* SVG Logo — Concept 4: Compass/Survey */}
        <img
          src="/logo-primary.svg"
          alt="TitleWyse"
          style={{ height: "48px", width: "auto", display: "block" }}
        />
        <Link href="/review/new" style={{
          color: C.gold,
          border: `1px solid ${C.gold}`,
          padding: "9px 24px",
          textDecoration: "none",
          fontSize: "0.875rem",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          letterSpacing: "0.04em",
        }}>
          Start a Matter →
        </Link>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        backgroundColor: C.navy,
        color: C.white,
        padding: "120px 3rem 140px",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <h1 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(2.5rem, 5.5vw, 4rem)",
            fontWeight: 400,
            lineHeight: 1.2,
            letterSpacing: "-0.01em",
            color: C.white,
            marginBottom: "0",
          }}>
            Title review as it should be done.
          </h1>

          {/* Gold rule */}
          <div style={{
            width: "80px",
            height: "1px",
            backgroundColor: C.gold,
            margin: "2rem auto",
          }} />

          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "1.25rem",
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.80)",
            marginBottom: "3rem",
            maxWidth: "560px",
            margin: "0 auto 3rem",
          }}>
            Texas commercial real estate demands precision.<br />
            TitleWyse delivers it.
          </p>

          <Link href="/review/new" style={{
            display: "inline-block",
            color: C.white,
            border: `1px solid ${C.gold}`,
            padding: "16px 48px",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "1rem",
            letterSpacing: "0.06em",
          }}>
            Start a Matter →
          </Link>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{
        backgroundColor: C.white,
        padding: "100px 3rem",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6875rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.gold,
            textAlign: "center",
            marginBottom: "1rem",
          }}>
            Process
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 400,
            textAlign: "center",
            color: C.navy,
            marginBottom: "0.75rem",
          }}>
            How It Works
          </h2>
          <div style={{
            width: "48px",
            height: "1px",
            backgroundColor: C.gold,
            margin: "1.25rem auto 4rem",
          }} />

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "3rem",
          }}>
            {steps.map((step, i) => (
              <div key={i}>
                <div style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "3.5rem",
                  fontWeight: 300,
                  color: C.gold,
                  lineHeight: 1,
                  marginBottom: "1.5rem",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: C.navy,
                  marginBottom: "1rem",
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.9375rem",
                  lineHeight: 1.75,
                  color: C.inkMuted,
                }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Built for Texas ──────────────────────────────────────────────── */}
      <section style={{
        backgroundColor: C.parchmentDark,
        padding: "100px 3rem",
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6875rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: C.gold,
            textAlign: "center",
            marginBottom: "1rem",
          }}>
            Standards
          </p>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.75rem, 3vw, 2.5rem)",
            fontWeight: 400,
            textAlign: "center",
            color: C.navy,
            marginBottom: "0.75rem",
          }}>
            Built for Texas Real Estate Counsel
          </h2>
          <div style={{
            width: "48px",
            height: "1px",
            backgroundColor: C.gold,
            margin: "1.25rem auto 1.5rem",
          }} />
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "1rem",
            textAlign: "center",
            color: C.inkMuted,
            marginBottom: "4rem",
            maxWidth: "540px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Every output follows TLTA standards and Texas title law.
          </p>

          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "2rem",
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                backgroundColor: C.white,
                border: `1px solid ${C.border}`,
                padding: "2rem 1.75rem",
              }}>
                <h4 style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "0.6875rem",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: C.gold,
                  marginBottom: "1rem",
                }}>
                  {f.tag}
                </h4>
                <p style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  color: C.navy,
                  marginBottom: "0.75rem",
                }}>
                  {f.title}
                </p>
                <p style={{
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 300,
                  fontSize: "0.875rem",
                  lineHeight: 1.7,
                  color: C.inkMuted,
                }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Strip ────────────────────────────────────────────────────── */}
      <section style={{
        backgroundColor: C.navy,
        padding: "100px 3rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "600px", margin: "0 auto" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
            fontWeight: 400,
            color: C.white,
            marginBottom: "1.25rem",
          }}>
            Ready to open a matter?
          </h2>
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "1rem",
            color: "rgba(255,255,255,0.70)",
            marginBottom: "2.5rem",
            lineHeight: 1.7,
          }}>
            Upload your documents and receive a professional analysis in minutes.
          </p>
          <Link href="/review/new" style={{
            display: "inline-block",
            color: C.white,
            border: `1px solid ${C.gold}`,
            padding: "14px 42px",
            textDecoration: "none",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 400,
            fontSize: "0.9375rem",
            letterSpacing: "0.05em",
          }}>
            Open a New Matter →
          </Link>
        </div>
      </section>

      {/* ── Footer / Disclaimer ──────────────────────────────────────────── */}
      <footer style={{
        backgroundColor: C.navy,
        borderTop: `1px solid ${C.navyLight}`,
        padding: "3rem 3rem",
        textAlign: "center",
      }}>
        <div style={{ maxWidth: "700px", margin: "0 auto" }}>
          {/* Footer logo — smaller, centered */}
          <img
            src="/logo-primary.svg"
            alt="TitleWyse"
            style={{ height: "36px", width: "auto", display: "inline-block", opacity: 0.85 }}
          />
          <p style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 300,
            fontSize: "0.8125rem",
            lineHeight: 1.8,
            color: "rgba(255,255,255,0.45)",
            marginTop: "1.5rem",
          }}>
            TitleWyse is an AI-assisted legal tool. All outputs require review and
            approval by licensed counsel. No attorney-client relationship is formed
            through use of this platform. Results do not constitute legal advice.
          </p>
          <p style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.6875rem",
            color: "rgba(255,255,255,0.25)",
            marginTop: "1.5rem",
            letterSpacing: "0.1em",
          }}>
            © {new Date().getFullYear()} TITLEWYSE · TEXAS TITLE REVIEW
          </p>
        </div>
      </footer>
    </div>
  );
}

// ─── Wordmark Component ───────────────────────────────────────────────────────
function Wordmark({ color, small }: { color: "gold" | "white"; small?: boolean }) {
  const textColor = color === "gold" ? "#C9A84C" : "#ffffff";
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: small ? "1rem" : "1.375rem",
          fontWeight: 700,
          color: textColor,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}>
          Title
        </span>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: small ? "1rem" : "1.375rem",
          fontWeight: 400,
          color: textColor,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}>
          Wyse
        </span>
      </div>
      <div style={{
        width: "100%",
        height: "1px",
        backgroundColor: "#C9A84C",
        marginTop: "3px",
        marginBottom: "3px",
      }} />
      <span style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: small ? "0.5rem" : "0.5625rem",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "rgba(201,168,76,0.70)",
      }}>
        AI-Assisted Title Review
      </span>
    </div>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const steps = [
  {
    title: "Open a Matter",
    desc: "Upload your title commitment, Schedule B exceptions, survey, and supporting documents. We accept PDF, JPEG, PNG, and TIFF — up to 50 files per matter.",
  },
  {
    title: "Automated Analysis",
    desc: "Our analysis engine extracts text, classifies documents, and applies Texas title law and TLTA standards to surface every material risk and exception.",
  },
  {
    title: "Download Documents",
    desc: "Receive a fully formatted Title Objection Letter and Title & Survey Issues Summary — both in DOCX and PDF, ready for counsel review.",
  },
];

const features = [
  {
    tag: "Standards",
    title: "TLTA Compliance",
    desc: "Every objection follows Texas Land Title Association guidelines and the Texas Insurance Code.",
  },
  {
    tag: "Risk",
    title: "8-Category Risk Grid",
    desc: "Red, Yellow, Green ratings across eight risk categories. Know exactly what requires attention.",
  },
  {
    tag: "Exceptions",
    title: "Schedule B Analysis",
    desc: "Full B-I requirements review and B-II exception analysis with recommended TLTA endorsements.",
  },
  {
    tag: "Survey",
    title: "Survey Review",
    desc: "Identifies encroachments, easements, flood exposure, and discrepancies from your survey documents.",
  },
];
