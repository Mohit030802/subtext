"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { motion, MotionConfig } from "motion/react";
import { ShieldCheck, Sun, Moon, MoveHorizontal, Loader2 } from "lucide-react";
import { useTheme } from "@/lib/theme";

const EASE_EDITORIAL = [0.22, 1, 0.36, 1];

export default function LoginPage() {
  const { theme, toggle } = useTheme();
  const [loading, setLoading] = useState(false);
  const [curtainPct, setCurtainPct] = useState(46);

  const frameRef = useRef(null);
  const draggingRef = useRef(false);
  const pausedRef = useRef(false);
  const resumeTimerRef = useRef(null);
  const phaseRef = useRef(0);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  const clampPct = (value) => Math.max(8, Math.min(92, value));

  const updateCurtainFromClientX = useCallback((clientX) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    if (rect.width <= 0) return;
    const pct = ((clientX - rect.left) / rect.width) * 100;
    const clamped = clampPct(pct);
    setCurtainPct(clamped);
    // Sync sine phase so when auto-glide resumes it continues smoothly without jumping
    const normalized = Math.max(-1, Math.min(1, (clamped - 50) / 34));
    phaseRef.current = Math.asin(normalized);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, 2800);
  }, []);

  const handlePointerDown = (e) => {
    draggingRef.current = true;
    pausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    updateCurtainFromClientX(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    updateCurtainFromClientX(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    scheduleResume();
  };

  const handleSliderKeyDown = (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      pausedRef.current = true;
      const delta = e.key === "ArrowLeft" ? -4 : 4;
      setCurtainPct((prev) => {
        const next = clampPct(prev + delta);
        const normalized = Math.max(-1, Math.min(1, (next - 50) / 34));
        phaseRef.current = Math.asin(normalized);
        return next;
      });
      scheduleResume();
    }
  };

  // Smooth auto-glide when idle (respects prefers-reduced-motion)
  useEffect(() => {
    const mediaQuery = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (mediaQuery?.matches) return undefined;

    let rafId;
    const tick = () => {
      if (!pausedRef.current && !draggingRef.current) {
        phaseRef.current += 0.012;
        const pct = 50 + Math.sin(phaseRef.current) * 34;
        setCurtainPct(pct);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          color: "var(--fg)",
        }}
      >
        {/* ── Top Editorial Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_EDITORIAL }}
          className="login-xray-header"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "7px",
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

          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span
              style={{
                fontSize: "12px",
                color: "var(--muted-fg)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span className="login-live-dot" />
              Contract Intelligence Platform
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle color theme"
              title={theme === "dark" ? "Switch to warm light theme" : "Switch to charcoal dark theme"}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "var(--surface-xs)",
                color: "var(--text-2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "border-color 0.15s ease, color 0.15s ease",
              }}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </motion.header>

        {/* ── Main Two-Column Editorial Stage ── */}
        <main className="login-xray-main">
          {/* Left: Auth Column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.06, ease: EASE_EDITORIAL }}
            style={{ display: "flex", flexDirection: "column" }}
          >
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--primary)",
                marginBottom: "14px",
              }}
            >
              See What&rsquo;s Hidden In Plain Text
            </div>

            <h1
              className="font-serif-editorial"
              style={{
                fontSize: "clamp(36px, 4vw, 48px)",
                fontWeight: 400,
                lineHeight: 1.06,
                color: "var(--fg)",
                margin: "0 0 14px",
              }}
            >
              Sign in to reveal the subtext.
            </h1>

            <p
              style={{
                fontSize: "14px",
                color: "var(--text-2)",
                lineHeight: 1.65,
                margin: "0 0 28px",
                maxWidth: "390px",
              }}
            >
              Dense legal boilerplate hides uncapped liability and silent auto-renewal traps. Connect Google Drive to turn raw PDFs into redline-ready dossiers.
            </p>

            <div style={{ maxWidth: "340px", width: "100%" }}>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="login-google-btn"
                style={{
                  cursor: loading ? "wait" : "pointer",
                  opacity: loading ? 0.78 : 1,
                }}
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span
                    style={{
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </span>
                )}
                <span>{loading ? "Redirecting to Google..." : "Continue with Google"}</span>
              </button>

              {/* Privacy / Zero-Ingestion Guarantee */}
              <div
                style={{
                  marginTop: "20px",
                  padding: "13px 14px",
                  borderRadius: "9px",
                  background: "var(--surface-xs)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                }}
              >
                <ShieldCheck size={16} color="var(--primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                <p style={{ margin: 0, fontSize: "12px", color: "var(--muted-fg)", lineHeight: 1.55 }}>
                  Passwordless Google OAuth 2.0. Subtext never reads file contents until you explicitly import a contract.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Interactive Auto-Gliding & Draggable X-Ray Curtain */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.14, ease: EASE_EDITORIAL }}
            style={{ position: "relative", userSelect: "none" }}
          >
            {/* Meta strip above lens */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "10px",
                fontSize: "12px",
                gap: "12px",
              }}
            >
              
            </div>

            {/* Dual-Layer X-Ray Frame */}
            <div
              ref={frameRef}
              role="slider"
              tabIndex={0}
              aria-label="Contract audit comparison curtain"
              aria-valuemin={8}
              aria-valuemax={92}
              aria-valuenow={Math.round(curtainPct)}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onKeyDown={handleSliderKeyDown}
              style={{
                position: "relative",
                minHeight: "450px",
                borderRadius: "14px",
                border: "1px solid var(--border)",
                overflow: "hidden",
                boxShadow: "0 24px 54px -22px rgba(24, 24, 27, 0.16), 0 2px 8px rgba(24, 24, 27, 0.04)",
                cursor: "ew-resize",
                background: "var(--card)",
                touchAction: "none",
                outline: "none",
              }}
            >
              {/* Floating Corner Labels */}
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "16px",
                  zIndex: 8,
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 9px",
                  borderRadius: "6px",
                  background: "var(--surface-sm)",
                  color: "var(--text-2)",
                  border: "1px solid var(--border)",
                  pointerEvents: "none",
                }}
              >
                Raw Contract
              </div>

              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  right: "16px",
                  zIndex: 8,
                  fontSize: "10px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "4px 9px",
                  borderRadius: "6px",
                  background: "var(--green-dim)",
                  color: "var(--green)",
                  border: "1px solid var(--green-border)",
                  pointerEvents: "none",
                }}
              >
                Subtext Audited
              </div>

              {/* Layer 1: Raw Unannotated Legal Document */}
              <div
                style={{
                  position: "relative",
                  padding: "56px 34px 26px",
                  minHeight: "450px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "var(--sidebar-bg)",
                  color: "var(--text-2)",
                  fontSize: "13px",
                  lineHeight: 1.8,
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "12px",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "11px",
                    color: "var(--muted-fg)",
                  }}
                >
                  <span>MASTER SERVICES AGREEMENT</span>
                  <span>PAGE 4 OF 18</span>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 14px" }}>
                    <strong style={{ color: "var(--fg)" }}>8.2 Indemnification &amp; Liability.</strong>{" "}
                    Provider shall defend, indemnify, and hold harmless Client from any and all indirect, consequential, or punitive damages without financial limitation arising out of this Agreement.
                  </p>
                  <p style={{ margin: "0 0 14px" }}>
                    <strong style={{ color: "var(--fg)" }}>4.1 Term &amp; Renewal.</strong>{" "}
                    Following the Initial Term, this Agreement shall automatically renew for successive 24-month periods unless written notice is given 90 days prior to expiration.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong style={{ color: "var(--fg)" }}>6.3 Intellectual Property.</strong>{" "}
                    All deliverables and pre-existing tools utilized during the engagement shall be deemed work-made-for-hire owned exclusively by Client.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    paddingTop: "16px",
                    marginTop: "18px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "var(--surface-sm)",
                      color: "var(--muted-fg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Plain PDF &mdash; 0 annotations
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "var(--surface-sm)",
                      color: "var(--muted-fg)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    Manual review: ~45 mins
                  </span>
                </div>
              </div>

              {/* Layer 2: Subtext Audited View (Clipped by X-Ray Curtain) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  inset: 0,
                  padding: "56px 34px 26px",
                  minHeight: "450px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  background: "var(--card)",
                  color: "var(--fg)",
                  fontSize: "13px",
                  lineHeight: 1.8,
                  clipPath: `inset(0 0 0 ${curtainPct}%)`,
                  pointerEvents: "none",
                }}
              >
                <div
                  className="font-mono"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingBottom: "12px",
                    marginBottom: "16px",
                    borderBottom: "1px solid var(--border)",
                    fontSize: "11px",
                    color: "var(--primary)",
                    fontWeight: 600,
                  }}
                >
                  <span>SUBTEXT AUDIT &middot; 3 FLAGS DETECTED</span>
                  <span>1.2s ANALYSIS</span>
                </div>

                <div style={{ flex: 1 }}>
                  <p style={{ margin: "0 0 14px" }}>
                    <strong>8.2 Indemnification &amp; Liability.</strong>{" "}
                    Provider shall defend, indemnify, and hold harmless Client from{" "}
                    <span
                      style={{
                        background: "var(--red-dim)",
                        color: "var(--red)",
                        borderBottom: "2px solid var(--red)",
                        padding: "1px 3px",
                        borderRadius: "3px",
                        fontWeight: 500,
                      }}
                    >
                      any and all indirect, consequential, or punitive damages without financial limitation
                    </span>{" "}
                    arising out of this Agreement.
                  </p>
                  <p style={{ margin: "0 0 14px" }}>
                    <strong>4.1 Term &amp; Renewal.</strong>{" "}
                    Following the Initial Term, this Agreement shall{" "}
                    <span
                      style={{
                        background: "var(--amber-dim)",
                        color: "var(--amber)",
                        borderBottom: "2px solid var(--amber)",
                        padding: "1px 3px",
                        borderRadius: "3px",
                        fontWeight: 500,
                      }}
                    >
                      automatically renew for successive 24-month periods unless written notice is given 90 days prior
                    </span>{" "}
                    to expiration.
                  </p>
                  <p style={{ margin: 0 }}>
                    <strong>6.3 Intellectual Property.</strong>{" "}
                    All deliverables and{" "}
                    <span
                      style={{
                        background: "var(--red-dim)",
                        color: "var(--red)",
                        borderBottom: "2px solid var(--red)",
                        padding: "1px 3px",
                        borderRadius: "3px",
                        fontWeight: 500,
                      }}
                    >
                      pre-existing tools utilized during the engagement
                    </span>{" "}
                    shall be deemed work-made-for-hire owned exclusively by Client.
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    paddingTop: "16px",
                    marginTop: "18px",
                    borderTop: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "var(--red-dim)",
                      color: "var(--red)",
                      border: "1px solid var(--red-border)",
                    }}
                  >
                    ● 2 High Risk Traps
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "var(--amber-dim)",
                      color: "var(--amber)",
                      border: "1px solid var(--amber-border)",
                    }}
                  >
                    ● 1 Renewal Deadline (Nov 30)
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      padding: "5px 10px",
                      borderRadius: "7px",
                      background: "var(--green-dim)",
                      color: "var(--green)",
                      border: "1px solid var(--green-border)",
                    }}
                  >
                    ✓ 3 Redlines Ready
                  </span>
                </div>
              </div>

              {/* Vertical Emerald Curtain Divider & Draggable Knob */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: `${curtainPct}%`,
                  width: "2px",
                  background: "var(--primary)",
                  boxShadow: "0 0 18px rgba(15, 81, 50, 0.45)",
                  zIndex: 10,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "2.5px solid var(--card)",
                    boxShadow: "0 4px 14px rgba(15, 81, 50, 0.38)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MoveHorizontal size={15} />
                </div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* ── Subtle Legal Footer ── */}
        <footer
          style={{
            padding: "16px 24px",
            textAlign: "center",
            fontSize: "11.5px",
            color: "var(--muted-fg)",
            borderTop: "1px solid var(--border)",
          }}
        >
          By continuing, you agree to the Terms of Service and Privacy Policy.
        </footer>
      </div>
    </MotionConfig>
  );
}
