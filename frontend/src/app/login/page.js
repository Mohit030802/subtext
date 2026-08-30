"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Zap, ShieldCheck, FileSearch, AlertTriangle, ArrowRight } from "lucide-react";

const FEATURES = [
  { icon: FileSearch, label: "Contract Analysis",  desc: "AI-powered clause extraction" },
  { icon: AlertTriangle, label: "Risk Detection",   desc: "Catch asymmetric risk clauses" },
  { icon: ShieldCheck,  label: "Obligation Tracking", desc: "Never miss a deadline"      },
];

// Floating document cards shown in the visual panel
const FLOATING_CARDS = [
  {
    top: "8%", left: "6%", rotate: "-4deg", delay: "0s",
    type: "MSA", risk: "HIGH", riskColor: "#f87171", riskBg: "rgba(248,113,113,0.12)",
    title: "Master Services Agreement",
    clause: "Auto-renewal trap detected on page 3",
  },
  {
    top: "38%", left: "55%", rotate: "3deg", delay: "0.2s",
    type: "NDA", risk: "LOW", riskColor: "#34d399", riskBg: "rgba(52,211,153,0.12)",
    title: "Non-Disclosure Agreement",
    clause: "Standard mutual NDA — no red flags",
  },
  {
    top: "65%", left: "10%", rotate: "2deg", delay: "0.4s",
    type: "SOW", risk: "MEDIUM", riskColor: "#fbbf24", riskBg: "rgba(251,191,36,0.12)",
    title: "Statement of Work",
    clause: "Liability cap of $50K — review needed",
  },
];

function FloatingCard({ card }) {
  return (
    <div
      style={{
        position: "absolute",
        top: card.top,
        left: card.left,
        transform: `rotate(${card.rotate})`,
        width: "220px",
        background: "rgba(24,24,27,0.85)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "10px",
        padding: "14px",
        backdropFilter: "blur(12px)",
        animation: `floatCard 6s ease-in-out infinite`,
        animationDelay: card.delay,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "4px",
          fontFamily: "var(--font-mono), monospace",
          background: "rgba(255,255,255,0.06)", color: "#71717a",
        }}>{card.type}</span>
        <span style={{
          fontSize: "10px", fontWeight: 700, padding: "2px 8px", borderRadius: "99px",
          background: card.riskBg, color: card.riskColor,
        }}>{card.risk}</span>
      </div>
      <div style={{ fontSize: "12px", fontWeight: 600, color: "#e4e4e7", marginBottom: "6px", lineHeight: 1.3 }}>
        {card.title}
      </div>
      <div style={{ fontSize: "11px", color: "#71717a", lineHeight: 1.5 }}>{card.clause}</div>
    </div>
  );
}

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <>
      <style>{`
        @keyframes floatCard {
          0%, 100% { transform: translateY(0px) rotate(var(--r, 0deg)); }
          50%       { transform: translateY(-10px) rotate(var(--r, 0deg)); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .fade-1 { animation: fadeUp 0.5s ease both 0.1s; }
        .fade-2 { animation: fadeUp 0.5s ease both 0.2s; }
        .fade-3 { animation: fadeUp 0.5s ease both 0.35s; }
        .fade-4 { animation: fadeUp 0.5s ease both 0.5s; }
        .fade-5 { animation: fadeUp 0.5s ease both 0.65s; }
      `}</style>

      <div style={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: "1fr 480px",
        background: "#09090b",
        fontFamily: "var(--font-inter), system-ui, sans-serif",
      }}>

        {/* ── Left: Visual Panel ── */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "48px",
          background: "linear-gradient(135deg, #0d0d14 0%, #09090b 60%, #0f0a1a 100%)",
        }}>
          {/* Grid pattern */}
          <div style={{
            position: "absolute", inset: 0, opacity: 0.25,
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.15) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.15) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }} />

          {/* Radial glow */}
          <div style={{
            position: "absolute", top: "20%", left: "30%",
            width: "500px", height: "500px",
            background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: "10%", right: "10%",
            width: "300px", height: "300px",
            background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 65%)",
            pointerEvents: "none",
          }} />

          {/* Floating doc cards */}
          {FLOATING_CARDS.map((card, i) => (
            <FloatingCard key={i} card={card} />
          ))}

          {/* Bottom copy */}
          <div style={{ position: "relative", zIndex: 10 }}>
            <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
              {FEATURES.map(({ icon: Icon, label, desc }) => (
                <div key={label} style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  padding: "14px",
                }}>
                  <Icon size={16} color="#7c3aed" style={{ marginBottom: "8px" }} />
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#e4e4e7", marginBottom: "3px" }}>{label}</div>
                  <div style={{ fontSize: "11px", color: "#52525b" }}>{desc}</div>
                </div>
              ))}
            </div>

            <p style={{
              fontSize: "13px", color: "#3f3f46",
              borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "20px",
            }}>
              Trusted for contract intelligence. Zero data sold, ever.
            </p>
          </div>
        </div>

        {/* ── Right: Auth Panel ── */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "56px 48px",
          background: "#111113",
          borderLeft: "1px solid rgba(255,255,255,0.06)",
        }}>

          {/* Logo */}
          <div className="fade-1" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "52px" }}>
            <div style={{
              position: "relative",
              width: "36px", height: "36px", borderRadius: "9px",
              background: "#7c3aed",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                position: "absolute", inset: 0, borderRadius: "9px",
                animation: "pulse-ring 2.5s ease-out infinite",
                border: "2px solid #7c3aed",
              }} />
              <Zap size={18} color="#fff" fill="#fff" />
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.03em" }}>Subtext</div>
              <div style={{ fontSize: "11px", color: "#52525b", marginTop: "1px" }}>Read between the lines</div>
            </div>
          </div>

          {/* Heading */}
          <div className="fade-2" style={{ marginBottom: "36px" }}>
            <h1 style={{
              fontSize: "28px", fontWeight: 800, color: "#fafafa",
              letterSpacing: "-0.04em", lineHeight: 1.15, marginBottom: "10px",
            }}>
              Welcome back.
            </h1>
            <p style={{ fontSize: "14px", color: "#71717a", lineHeight: 1.6 }}>
              Sign in to your workspace to analyze contracts,<br />
              detect risks, and track obligations.
            </p>
          </div>

          {/* Google Sign-In Button */}
          <div className="fade-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: loading
                  ? "rgba(255,255,255,0.03)"
                  : "rgba(255,255,255,0.05)",
                color: loading ? "#52525b" : "#e4e4e7",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.18s ease",
                fontFamily: "var(--font-inter), system-ui, sans-serif",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }
              }}
            >
              {/* Shimmer on hover */}
              {!loading && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
                  backgroundSize: "200% auto",
                  animation: "shimmer 3s linear infinite",
                  pointerEvents: "none",
                }} />
              )}

              {/* Google SVG icon */}
              {loading ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                  <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
                  <circle cx="12" cy="12" r="10" stroke="#3f3f46" strokeWidth="2" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              )}

              {loading ? "Signing in…" : "Continue with Google"}

              {!loading && <ArrowRight size={16} style={{ marginLeft: "auto", opacity: 0.4 }} />}
            </button>
          </div>

          {/* Divider with note */}
          <div className="fade-4" style={{
            display: "flex", alignItems: "center", gap: "12px",
            margin: "24px 0",
          }}>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
            <span style={{ fontSize: "11px", color: "#3f3f46" }}>Single sign-on</span>
            <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
          </div>

          {/* Security note */}
          <div className="fade-4" style={{
            display: "flex", alignItems: "flex-start", gap: "10px",
            padding: "14px", borderRadius: "8px",
            background: "rgba(124,58,237,0.06)",
            border: "1px solid rgba(124,58,237,0.12)",
          }}>
            <ShieldCheck size={15} color="#7c3aed" style={{ flexShrink: 0, marginTop: "1px" }} />
            <p style={{ fontSize: "12px", color: "#71717a", lineHeight: 1.6, margin: 0 }}>
              We use Google OAuth 2.0 for secure, passwordless authentication.
              Your credentials are never stored on our servers.
            </p>
          </div>

          {/* Footer */}
          <div className="fade-5" style={{ marginTop: "auto", paddingTop: "48px" }}>
            <p style={{ fontSize: "11px", color: "#3f3f46", textAlign: "center" }}>
              By signing in you agree to the{" "}
              <span style={{ color: "#52525b", cursor: "pointer" }}>Terms of Service</span>
              {" "}and{" "}
              <span style={{ color: "#52525b", cursor: "pointer" }}>Privacy Policy</span>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
