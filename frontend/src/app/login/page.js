"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ShieldCheck, FileSearch, CalendarClock, HardDrive } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.25fr) minmax(380px, 480px)",
        background: "var(--bg)",
        color: "var(--fg)",
      }}
    >
      {/* ── Left: Editorial Legal Showcase ── */}
      <div
        style={{
          background: "var(--sidebar-bg)",
          borderRight: "1px solid var(--border)",
          padding: "48px 56px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: "32px",
        }}
      >
        {/* Top brand mark */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              background: "var(--primary)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            S
          </div>
          <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--fg)" }}>Subtext</span>
        </div>

        {/* Center Editorial Headline + Real Contract Specimen */}
        <div style={{ maxWidth: "560px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: "14px",
            }}
          >
            Contract Intelligence Platform
          </div>
          <h1
            className="font-serif-editorial"
            style={{
              fontSize: "40px",
              fontWeight: 400,
              color: "var(--fg)",
              lineHeight: 1.12,
              margin: "0 0 16px",
            }}
          >
            Read between the lines before you sign.
          </h1>
          <p
            style={{
              fontSize: "14.5px",
              color: "var(--text-2)",
              lineHeight: 1.6,
              margin: "0 0 32px",
              maxWidth: "480px",
            }}
          >
            Surface uncapped liability traps, silent auto-renewals, and compliance deadlines directly from your Google Drive agreements in seconds.
          </p>

          {/* Editorial Contract Specimen Card */}
          <div
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              padding: "20px 22px",
              boxShadow: "0 8px 28px rgba(24, 24, 27, 0.05)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingBottom: "12px",
                marginBottom: "14px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--fg)" }}>
                Master Services Agreement &mdash; Section 8.2
              </span>
              <span
                className="risk-pill"
                style={{
                  background: "var(--red-dim)",
                  color: "var(--red)",
                  border: "1px solid var(--red-border)",
                }}
              >
                <span className="risk-pill-dot" style={{ background: "var(--red)" }} />
                High Risk &middot; Page 4
              </span>
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                background: "var(--red-dim)",
                borderLeft: "3px solid var(--red)",
                fontSize: "12.5px",
                color: "var(--fg)",
                lineHeight: 1.6,
                marginBottom: "12px",
              }}
            >
              &ldquo;Provider shall indemnify and hold harmless Client from any and all indirect, consequential, or punitive damages without financial limitation.&rdquo;
            </div>

            <div
              style={{
                padding: "10px 12px",
                borderRadius: "6px",
                background: "var(--green-dim)",
                border: "1px solid var(--green-border)",
                fontSize: "12px",
                color: "var(--green)",
                lineHeight: 1.55,
              }}
            >
              <strong style={{ fontSize: "10.5px", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "2px" }}>
                Recommended Redline
              </strong>
              Cap aggregate liability at twelve (12) months of fees paid and expressly exclude consequential damages.
            </div>
          </div>
        </div>

        {/* Bottom Hairline Feature Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            paddingTop: "22px",
            borderTop: "1px solid var(--border)",
          }}
        >
          {[
            { icon: FileSearch, title: "Clause Risk Audit", desc: "Pinpoints high, medium & low traps." },
            { icon: CalendarClock, title: "Deadline Tracking", desc: "Never miss a renewal opt-out." },
            { icon: HardDrive, title: "Google Drive Native", desc: "1-click metadata discovery & import." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <Icon size={15} color="var(--primary)" style={{ marginBottom: "6px" }} />
              <div style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--fg)", marginBottom: "2px" }}>
                {title}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--muted-fg)", lineHeight: 1.45 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Clean Auth Panel ── */}
      <div
        style={{
          background: "var(--card)",
          padding: "48px 44px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div />

        <div style={{ maxWidth: "340px", width: "100%", margin: "0 auto" }}>
          <h2
            className="font-serif-editorial"
            style={{
              fontSize: "28px",
              fontWeight: 400,
              color: "var(--fg)",
              margin: "0 0 8px",
              lineHeight: 1.15,
            }}
          >
            Sign in to Subtext
          </h2>
          <p style={{ fontSize: "13.5px", color: "var(--muted-fg)", margin: "0 0 28px", lineHeight: 1.55 }}>
            Access your client contract portfolio, risk dossiers, and Google Drive workspace.
          </p>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              padding: "11px 16px",
              borderRadius: "8px",
              background: "var(--primary)",
              color: "#ffffff",
              border: "1px solid var(--primary)",
              fontSize: "13.5px",
              fontWeight: 500,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.75 : 1,
              transition: "background 0.12s ease",
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "var(--primary-hover)"; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "var(--primary)"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" style={{ flexShrink: 0, background: "#fff", borderRadius: "50%", padding: "2px" }}>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>{loading ? "Redirecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Privacy Note */}
          <div
            style={{
              marginTop: "24px",
              padding: "14px",
              borderRadius: "8px",
              background: "var(--surface-xs)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "flex-start",
              gap: "10px",
            }}
          >
            <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: "1px" }} />
            <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-fg)", lineHeight: 1.55 }}>
              Passwordless authentication via Google OAuth 2.0. Subtext never reads file contents until you explicitly import a contract.
            </p>
          </div>
        </div>

        <p style={{ fontSize: "11.5px", color: "var(--muted-fg)", textAlign: "center", margin: 0 }}>
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
