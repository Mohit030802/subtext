"use client";

import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Coffee, Lightbulb, Bug, Hand, Mail, Check, Copy, ArrowUpRight, ExternalLink, Minus, Plus } from "lucide-react";

const GMAIL = "mohitom2002@gmail.com";
const GITHUB_USER = "Mohit030802";
const REPO = `${GITHUB_USER}/subtext`;

const CUP_PRICE = 150; // price of one coffee
const CURRENCY = "₹";
const CUP_PRESETS = [
  { cups: 1, label: "Espresso" },
  { cups: 3, label: "Flat white" },
  { cups: 5, label: "Cold brew" },
  { cups: 10, label: "Pour-over" },
];

function CupIcon({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13h17v6a7 7 0 0 1-7 7h-3a7 7 0 0 1-7-7v-6Z" fill="currentColor" fillOpacity="0.15" />
      <path d="M23 15h2a3 3 0 0 1 0 6h-2" />
      <path d="M11 5c0 1.5 1.5 1.5 1.5 3M16 5c0 1.5 1.5 1.5 1.5 3" />
    </svg>
  );
}

const INTENTS = [
  { id: "coffee",  label: "Buy a coffee", icon: Coffee,    accent: "#fbbf24", subject: "Coffee for Subtext",   placeholder: "Tell me what Subtext helped you catch…" },
  { id: "feature", label: "Feature idea", icon: Lightbulb, accent: "#a78bfa", subject: "Subtext feature idea", placeholder: "Describe the feature you wish existed…" },
  { id: "bug",     label: "Report a bug", icon: Bug,       accent: "#f87171", subject: "Subtext bug report",   placeholder: "What happened, and what did you expect?" },
  { id: "hi",      label: "Just say hi",  icon: Hand,      accent: "#34d399", subject: "Hello from a Subtext user", placeholder: "Anything on your mind…" },
];

function HandleRow({ label, value, href, icon, copied, onCopy }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: "12px",
        padding: "14px 16px", borderRadius: "12px",
        background: "var(--card)", border: "1px solid var(--border)",
      }}
    >
      <div style={{
        width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
        background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-2)",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: "var(--muted-fg)", marginBottom: "2px" }}>{label}</div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-1)", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        title="Copy"
        style={{
          width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--border)",
          background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          color: copied ? "#34d399" : "var(--muted-fg)", transition: "all 0.12s",
        }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title="Open"
        style={{
          width: "30px", height: "30px", borderRadius: "8px", border: "1px solid var(--border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--muted-fg)", textDecoration: "none", transition: "all 0.12s",
        }}
      >
        <ArrowUpRight size={14} />
      </a>
    </div>
  );
}

export default function ContactSupportPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";
  const userName = session?.user?.name || "";

  const [intentId, setIntentId] = useState("coffee");
  const [cups, setCups] = useState(1);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  // Automatically pre-fill the name with the logged-in user
  useEffect(() => {
    if (userName && !name) {
      setName(userName);
    }
  }, [userName, name]);

  const intent = INTENTS.find((i) => i.id === intentId);

  const draft = useMemo(() => {
    const lines = [];
    lines.push(`Hi Mohit,`);
    lines.push("");
    if (intentId === "coffee") {
      lines.push(`I'd like to buy you ${cups} coffee${cups > 1 ? "s" : ""} for Subtext (${cups} x ${CURRENCY}${CUP_PRICE} = ${CURRENCY}${cups * CUP_PRICE}).`);
      if (message.trim()) { lines.push(""); lines.push(message.trim()); }
      lines.push("");
      lines.push("Let me know the best way to send it over.");
    } else {
      lines.push(message.trim() || "…");
    }
    lines.push("");
    const senderName = name.trim() || userName || "A Subtext user";
    const senderEmail = userEmail ? ` (${userEmail})` : "";
    lines.push(`— ${senderName}${senderEmail}`);
    return lines.join("\n");
  }, [intentId, cups, message, name, userName, userEmail]);

  const total = cups * CUP_PRICE;
  const isIssueIntent = intentId === "bug" || intentId === "feature";
  const subject = intentId === "coffee" ? `${intent.subject} (${cups}x)` : intent.subject;
  const mailHref = `mailto:${GMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
  const gmailWebHref = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(GMAIL)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;
  const issueHref = `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(subject)}&body=${encodeURIComponent(draft)}`;

  const copy = (key, text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const inputStyle = {
    width: "100%", padding: "10px 12px", borderRadius: "10px",
    background: "var(--bg)", border: "1px solid var(--border)", color: "var(--fg)",
    fontSize: "13px", outline: "none", fontFamily: "inherit", transition: "border-color 0.12s",
  };

  return (
    <div style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--fg)", margin: "0 0 6px" }}>
          Support Subtext
        </h1>
        <p style={{ fontSize: "14px", color: "var(--muted-fg)", margin: 0, maxWidth: "520px", lineHeight: 1.6 }}>
          Subtext is built and maintained by one person. Pick what you want to do, write a line or two,
          and reach me directly on Gmail or GitHub.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.25fr) minmax(0,1fr)", gap: "20px", alignItems: "start" }}>
        {/* Composer */}
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "16px", padding: "20px" }}>
          {/* Intent switcher */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", padding: "4px", borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)", marginBottom: "18px" }}>
            {INTENTS.map((i) => {
              const Icon = i.icon;
              const active = i.id === intentId;
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setIntentId(i.id)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "5px",
                    padding: "10px 4px", borderRadius: "9px", border: "none", cursor: "pointer",
                    background: active ? "var(--overlay)" : "transparent",
                    color: active ? i.accent : "var(--muted-fg)",
                    fontSize: "11px", fontWeight: 600, transition: "all 0.15s",
                  }}
                >
                  <Icon size={16} />
                  <span style={{ color: active ? "var(--text-1)" : "var(--muted-fg)" }}>{i.label}</span>
                </button>
              );
            })}
          </div>

          {/* Coffee picker */}
          {intentId === "coffee" && (
            <div style={{ borderRadius: "12px", background: "var(--bg)", border: "1px solid var(--border)", padding: "14px", marginBottom: "14px" }}>
              <style>{`@keyframes cupPop { from { transform: translateY(6px) scale(0.85); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

              {/* Quick picks with prices */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "14px" }}>
                {CUP_PRESETS.map((p) => {
                  const active = cups === p.cups;
                  return (
                    <button
                      key={p.cups}
                      type="button"
                      onClick={() => setCups(p.cups)}
                      style={{
                        textAlign: "left", padding: "10px 10px", borderRadius: "10px", cursor: "pointer",
                        background: active ? "rgba(251,191,36,0.08)" : "transparent",
                        border: active ? "1px solid rgba(251,191,36,0.5)" : "1px solid var(--border)",
                        transition: "all 0.12s",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: active ? "#fbbf24" : "var(--muted-fg)", fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)", marginTop: "2px" }}>
                        {CURRENCY}{(p.cups * CUP_PRICE).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--subtle-fg)", marginTop: "1px" }}>
                        {p.cups} {p.cups === 1 ? "cup" : "cups"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Cup row */}
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", minHeight: "38px", flexWrap: "wrap", marginBottom: "14px" }}>
                {Array.from({ length: Math.min(cups, 10) }).map((_, idx) => (
                  <span key={idx} style={{ animation: "cupPop 0.25s ease both", animationDelay: `${idx * 20}ms`, color: "#fbbf24", display: "inline-flex" }}>
                    <CupIcon size={30} />
                  </span>
                ))}
                {cups > 10 && (
                  <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--muted-fg)", fontFamily: "var(--font-mono)", paddingBottom: "4px" }}>
                    +{cups - 10}
                  </span>
                )}
              </div>

              {/* Stepper + breakdown */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button type="button" onClick={() => setCups((c) => Math.max(1, c - 1))}
                    style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ minWidth: "24px", textAlign: "center", fontSize: "16px", fontWeight: 700, color: "var(--fg)", fontFamily: "var(--font-mono)" }}>{cups}</span>
                  <button type="button" onClick={() => setCups((c) => Math.min(50, c + 1))}
                    style={{ width: "28px", height: "28px", borderRadius: "8px", border: "1px solid var(--border)", background: "transparent", color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Plus size={14} />
                  </button>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", color: "var(--muted-fg)", fontFamily: "var(--font-mono)" }}>
                    {cups} × {CURRENCY}{CUP_PRICE} per cup
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#fbbf24", fontFamily: "var(--font-mono)" }}>
                    {CURRENCY}{total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <input
              type="text" placeholder="Your name (optional)" value={name}
              onChange={(e) => setName(e.target.value)} style={inputStyle}
              onFocus={(e) => (e.target.style.borderColor = intent.accent)}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
            <textarea
              rows={4} placeholder={intent.placeholder} value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...inputStyle, resize: "none" }}
              onFocus={(e) => (e.target.style.borderColor = intent.accent)}
              onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
            />
          </div>

          {/* Live draft */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 12px", borderRadius: "8px", background: "var(--bg)",
              border: "1px solid var(--border)", fontSize: "11px", fontFamily: "var(--font-mono)",
              marginBottom: "8px",
            }}>
              <span>
                <span style={{ color: "var(--muted-fg)" }}>From: </span>
                <strong style={{ color: "var(--text-1)" }}>{userEmail || "Your account"}</strong>
              </span>
              <span>
                <span style={{ color: "var(--muted-fg)" }}>To: </span>
                <strong style={{ color: "#fbbf24" }}>{GMAIL}</strong>
              </span>
            </div>
            <pre style={{
              margin: 0, padding: "12px 14px", borderRadius: "10px", background: "var(--bg)",
              border: "1px dashed var(--border)", color: "var(--text-3)", fontSize: "12px",
              lineHeight: 1.6, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)",
            }}>
              {draft}
            </pre>
          </div>

          {/* Action buttons */}
          <div style={{ display: "grid", gridTemplateColumns: isIssueIntent ? "1fr 1fr" : "1.2fr 1fr", gap: "10px" }}>
            <a
              href={gmailWebHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "11px", borderRadius: "10px", background: intent.accent, color: "#09090b",
                fontSize: "13px", fontWeight: 700, textDecoration: "none", transition: "opacity 0.12s",
              }}
            >
              <Mail size={15} /> Send with Web Gmail
            </a>
            <a
              href={mailHref}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                padding: "11px", borderRadius: "10px", background: "transparent", color: "var(--text-1)",
                border: "1px solid var(--border)", fontSize: "13px", fontWeight: 600, textDecoration: "none",
              }}
            >
              <ExternalLink size={14} /> Open in Mail App (Outlook)
            </a>
            {isIssueIntent && (
              <a
                href={issueHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "10px", borderRadius: "10px", background: "transparent", color: "var(--muted-fg)",
                  border: "1px dashed var(--border)", fontSize: "12px", fontWeight: 600, textDecoration: "none",
                  gridColumn: "span 2",
                }}
              >
                {intentId === "bug" ? "Open as a public GitHub issue instead" : "Submit as a public GitHub issue instead"}
                <ArrowUpRight size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Handles */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-fg)" }}>
            Contact directly
          </div>
          <HandleRow
            label="Gmail" value={GMAIL} href={`mailto:${GMAIL}`}
            icon={<Mail size={16} />}
            copied={copiedKey === "mail"} onCopy={() => copy("mail", GMAIL)}
          />
          <HandleRow
            label="GitHub" value={`@${GITHUB_USER}`} href={`https://github.com/${GITHUB_USER}`}
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z"/></svg>}
            copied={copiedKey === "gh"} onCopy={() => copy("gh", `https://github.com/${GITHUB_USER}`)}
          />
          <HandleRow
            label="Repository" value={REPO} href={`https://github.com/${REPO}`}
            icon={<Lightbulb size={16} />}
            copied={copiedKey === "repo"} onCopy={() => copy("repo", `https://github.com/${REPO}`)}
          />

          <div style={{ marginTop: "6px", padding: "14px 16px", borderRadius: "12px", border: "1px dashed var(--border)", fontSize: "12px", color: "var(--muted-fg)", lineHeight: 1.6 }}>
            Coffee is never required. Starring the repo, reporting a bug, or sharing an idea helps just as much.
          </div>
        </div>
      </div>
    </div>
  );
}
