"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import { triggerProcessing } from "@/lib/actions";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

const STATUS_META = {
  PENDING:    { label: "Not yet analyzed",       color: "#71717a" },
  FAILED:     { label: "Analysis failed",         color: "#f87171" },
  PROCESSING: { label: "Analyzing with Gemini…",  color: "#fbbf24" },
};

export default function ProcessDocumentPanel({ documentId, initialStatus }) {
  const router = useRouter();
  const [phase, setPhase] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const tokenClientRef = useRef(null);
  const pollRef = useRef(null);

  // Sync with server-side status whenever the parent re-renders
  // (triggered by router.refresh() polling)
  useEffect(() => {
    setPhase(initialStatus);
    // If server now says it's done processing, stop polling
    if (initialStatus === "ANALYZED" || initialStatus === "FAILED") {
      clearInterval(pollRef.current);
    }
  }, [initialStatus]);

  // If we land on the page while already processing, start polling immediately
  useEffect(() => {
    if (initialStatus === "PROCESSING") startPolling();
    return () => clearInterval(pollRef.current);
  }, []);

  // Load GIS script once
  useEffect(() => {
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  const startPolling = () => {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      // Trigger Next.js to re-run the server component (re-fetches doc from API)
      router.refresh();
    }, 6000);
    // Stop polling after 3 min as a safety net
    setTimeout(() => clearInterval(pollRef.current), 3 * 60 * 1000);
  };

  const getGISToken = () =>
    new Promise((resolve, reject) => {
      const init = () => {
        if (!window.google?.accounts?.oauth2) {
          setTimeout(init, 300);
          return;
        }
        if (!tokenClientRef.current) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: DRIVE_SCOPE,
            callback: (res) => {
              if (res.error) reject(new Error(res.error));
              else resolve(res.access_token);
            },
          });
        }
        tokenClientRef.current.requestAccessToken({ prompt: "" });
      };
      init();
    });

  const handleProcess = async () => {
    if (loading || phase === "PROCESSING") return;
    setLoading(true);
    try {
      const token = await getGISToken();
      await triggerProcessing(documentId, token);
      setPhase("PROCESSING");
      startPolling();
    } catch (err) {
      console.error("Process trigger failed:", err);
      alert(`Failed to start processing: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isProcessing = phase === "PROCESSING";
  const isFailed = phase === "FAILED";

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      height: "100%", padding: "40px 32px", textAlign: "center", gap: "0",
    }}>
      {/* Icon */}
      <div style={{
        width: "56px", height: "56px", borderRadius: "14px", marginBottom: "20px",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isProcessing
          ? "rgba(251,191,36,0.1)"
          : isFailed
          ? "rgba(248,113,113,0.1)"
          : "rgba(124,58,237,0.12)",
        border: `1px solid ${isProcessing ? "rgba(251,191,36,0.2)" : isFailed ? "rgba(248,113,113,0.2)" : "rgba(124,58,237,0.25)"}`,
      }}>
        {isProcessing
          ? <Loader2 size={24} color="#fbbf24" style={{ animation: "spin 1.2s linear infinite" }} />
          : isFailed
          ? <AlertTriangle size={24} color="#f87171" />
          : <Zap size={24} color="#7c3aed" />
        }
      </div>

      {/* Headline */}
      <div style={{ fontSize: "15px", fontWeight: 700, color: "#e4e4e7", marginBottom: "8px" }}>
        {isProcessing ? "Analyzing document…" : isFailed ? "Analysis failed" : "Ready to analyze"}
      </div>

      {/* Sub-text */}
      <div style={{ fontSize: "13px", color: "#71717a", lineHeight: 1.6, maxWidth: "280px", marginBottom: "28px" }}>
        {isProcessing
          ? "Gemini AI is reading through the contract. This takes 20–40 seconds. The page will refresh automatically."
          : isFailed
          ? "Something went wrong during analysis. You can retry — it uses a fresh Drive download."
          : "Gemini AI will scan this document for risky clauses, obligations, and redline suggestions."
        }
      </div>

      {/* Feature bullets — only when PENDING */}
      {!isProcessing && !isFailed && (
        <div style={{
          display: "flex", flexDirection: "column", gap: "8px",
          marginBottom: "28px", textAlign: "left",
        }}>
          {[
            "Identify HIGH / MEDIUM / LOW risk clauses",
            "Extract obligations with due dates",
            "Suggest redline rewrites",
            "Build a contract summary",
          ].map((feat) => (
            <div key={feat} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#a1a1aa" }}>
              <CheckCircle2 size={13} color="#34d399" style={{ flexShrink: 0 }} />
              {feat}
            </div>
          ))}
        </div>
      )}

      {/* CTA Button */}
      {!isProcessing && (
        <button
          onClick={handleProcess}
          disabled={loading}
          style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "10px 22px", borderRadius: "9px", border: "none", cursor: loading ? "not-allowed" : "pointer",
            background: isFailed ? "#7c3aed" : "#7c3aed",
            color: "#fff", fontSize: "13px", fontWeight: 700,
            opacity: loading ? 0.7 : 1, transition: "opacity 0.15s",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = loading ? "0.7" : "1"; }}
        >
          {loading
            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
            : isFailed
            ? <RotateCcw size={14} />
            : <Zap size={14} />
          }
          {loading ? "Connecting to Drive…" : isFailed ? "Retry Analysis" : "Process with Gemini AI"}
        </button>
      )}

      {/* Manual refresh when processing */}
      {isProcessing && (
        <button
          onClick={() => router.refresh()}
          style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "8px 16px", borderRadius: "8px", fontSize: "12px",
            background: "transparent", border: "1px solid rgba(255,255,255,0.08)",
            color: "#71717a", cursor: "pointer", fontFamily: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.color = "#a1a1aa"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.color = "#71717a"; }}
        >
          <RotateCcw size={12} />
          Refresh now
        </button>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
