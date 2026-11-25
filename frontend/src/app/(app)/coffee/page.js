"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import {
  Coffee,
  Lightbulb,
  Bug,
  Hand,
  Mail,
  Check,
  Copy,
  ArrowUpRight,
  ExternalLink,
  Minus,
  Plus,
} from "lucide-react";

const GMAIL = "mohitom2002@gmail.com";
const GITHUB_USER = "Mohit030802";
const REPO = `${GITHUB_USER}/subtext`;

const CUP_PRICE = 150;
const CURRENCY = "₹";
const CUP_PRESETS = [
  { cups: 1, label: "Espresso" },
  { cups: 3, label: "Flat white" },
  { cups: 5, label: "Cold brew" },
  { cups: 10, label: "Pour-over" },
];

const INTENTS = [
  { id: "coffee",  label: "Buy a coffee", icon: Coffee,    subject: "Coffee for Subtext",         placeholder: "Tell me what Subtext helped you catch…" },
  { id: "feature", label: "Feature idea", icon: Lightbulb, subject: "Subtext feature idea",       placeholder: "Describe the feature you wish existed…" },
  { id: "bug",     label: "Report a bug", icon: Bug,       subject: "Subtext bug report",         placeholder: "What happened, and what did you expect?" },
  { id: "hi",      label: "Just say hi",  icon: Hand,      subject: "Hello from a Subtext user",  placeholder: "Anything on your mind…" },
];

function HandleRow({ label, value, href, icon, copied, onCopy }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        padding: "13px 16px",
        borderRadius: "8px",
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      <div
        style={{
          width: "34px",
          height: "34px",
          borderRadius: "7px",
          flexShrink: 0,
          background: "var(--surface-xs)",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: "var(--muted-fg)", marginBottom: "2px" }}>{label}</div>
        <div
          className="font-mono"
          style={{
            fontSize: "12.5px",
            fontWeight: 600,
            color: "var(--fg)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </div>
      </div>
      <button
        type="button"
        onClick={onCopy}
        title="Copy"
        style={{
          width: "30px",
          height: "30px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: copied ? "var(--green)" : "var(--muted-fg)",
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
          width: "30px",
          height: "30px",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--muted-fg)",
          textDecoration: "none",
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
  const [customName, setCustomName] = useState(null);
  const [message, setMessage] = useState("");
  const [copiedKey, setCopiedKey] = useState(null);

  const name = customName !== null ? customName : userName;
  const intent = INTENTS.find((i) => i.id === intentId);

  const draft = useMemo(() => {
    const lines = ["Hi Mohit,", ""];
    if (intentId === "coffee") {
      lines.push(
        `I'd like to buy you ${cups} coffee${cups > 1 ? "s" : ""} for Subtext (${cups} x ${CURRENCY}${CUP_PRICE} = ${CURRENCY}${cups * CUP_PRICE}).`
      );
      if (message.trim()) {
        lines.push("", message.trim());
      }
      lines.push("", "Let me know the best way to send it over.");
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
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    background: "var(--surface-xs)",
    border: "1px solid var(--border)",
    color: "var(--fg)",
    fontSize: "13px",
    outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.12s",
  };

  return (
    <div style={{ maxWidth: "1020px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Editorial Header */}
      <div
        className="fade-up"
        style={{
          marginBottom: "24px",
          paddingBottom: "20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--primary)",
            marginBottom: "6px",
          }}
        >
          Direct Support &amp; Feedback
        </div>
        <h1
          className="font-serif-editorial"
          style={{
            fontSize: "28px",
            fontWeight: 400,
            color: "var(--fg)",
            margin: "0 0 6px",
            lineHeight: 1.15,
          }}
        >
          Support Subtext
        </h1>
        <p style={{ fontSize: "13.5px", color: "var(--muted-fg)", margin: 0, maxWidth: "560px", lineHeight: 1.6 }}>
          Subtext is crafted independently. Choose a topic below, write a quick note, and reach out directly via Gmail, your Mail App, or GitHub.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.35fr) minmax(280px, 1fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left: Editorial Composer */}
        <div
          className="fade-up delay-1"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "10px",
            padding: "22px",
          }}
        >
          {/* Intent Switcher */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "6px",
              padding: "4px",
              borderRadius: "8px",
              background: "var(--surface-xs)",
              border: "1px solid var(--border)",
              marginBottom: "18px",
            }}
          >
            {INTENTS.map((i) => {
              const Icon = i.icon;
              const active = i.id === intentId;
              return (
                <button
                  key={i.id}
                  type="button"
                  onClick={() => setIntentId(i.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "5px",
                    padding: "9px 4px",
                    borderRadius: "6px",
                    border: active ? "1px solid var(--border)" : "1px solid transparent",
                    cursor: "pointer",
                    background: active ? "var(--card)" : "transparent",
                    color: active ? "var(--primary)" : "var(--muted-fg)",
                    fontSize: "11.5px",
                    fontWeight: active ? 600 : 500,
                    transition: "all 0.12s",
                    fontFamily: "inherit",
                  }}
                >
                  <Icon size={15} />
                  <span>{i.label}</span>
                </button>
              );
            })}
          </div>

          {/* Coffee Picker */}
          {intentId === "coffee" && (
            <div
              style={{
                borderRadius: "8px",
                background: "var(--surface-xs)",
                border: "1px solid var(--border)",
                padding: "14px",
                marginBottom: "16px",
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "14px" }}>
                {CUP_PRESETS.map((p) => {
                  const active = cups === p.cups;
                  return (
                    <button
                      key={p.cups}
                      type="button"
                      onClick={() => setCups(p.cups)}
                      style={{
                        textAlign: "left",
                        padding: "10px",
                        borderRadius: "7px",
                        cursor: "pointer",
                        background: active ? "var(--card)" : "transparent",
                        border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
                        transition: "all 0.12s",
                        fontFamily: "inherit",
                      }}
                    >
                      <div style={{ fontSize: "11px", color: active ? "var(--primary)" : "var(--muted-fg)", fontWeight: 600 }}>
                        {p.label}
                      </div>
                      <div className="font-mono" style={{ fontSize: "15px", fontWeight: 700, color: "var(--fg)", marginTop: "2px" }}>
                        {CURRENCY}{(p.cups * CUP_PRICE).toLocaleString()}
                      </div>
                      <div style={{ fontSize: "10.5px", color: "var(--muted-fg)", marginTop: "1px" }}>
                        {p.cups} {p.cups === 1 ? "cup" : "cups"}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setCups((c) => Math.max(1, c - 1))}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--fg)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Minus size={13} />
                  </button>
                  <span className="font-mono" style={{ minWidth: "24px", textAlign: "center", fontSize: "15px", fontWeight: 600, color: "var(--fg)" }}>
                    {cups}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCups((c) => Math.min(50, c + 1))}
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "6px",
                      border: "1px solid var(--border)",
                      background: "var(--card)",
                      color: "var(--fg)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={13} />
                  </button>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div className="font-mono" style={{ fontSize: "11px", color: "var(--muted-fg)" }}>
                    {cups} &times; {CURRENCY}{CUP_PRICE}
                  </div>
                  <div className="font-serif-editorial" style={{ fontSize: "22px", color: "var(--primary)", lineHeight: 1.1 }}>
                    {CURRENCY}{total.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setCustomName(e.target.value)}
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
            <textarea
              rows={4}
              placeholder={intent.placeholder}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ ...inputStyle, resize: "none" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--primary)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
          </div>

          {/* Live Draft Preview */}
          <div style={{ marginBottom: "16px" }}>
            <div
              className="font-mono"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: "6px",
                background: "var(--surface-xs)",
                border: "1px solid var(--border)",
                fontSize: "11px",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <span>
                <span style={{ color: "var(--muted-fg)" }}>From: </span>
                <strong style={{ color: "var(--fg)" }}>{userEmail || "Your account"}</strong>
              </span>
              <span>
                <span style={{ color: "var(--muted-fg)" }}>To: </span>
                <strong style={{ color: "var(--primary)" }}>{GMAIL}</strong>
              </span>
            </div>
            <pre
              className="font-mono"
              style={{
                margin: 0,
                padding: "12px 14px",
                borderRadius: "6px",
                background: "var(--surface-xs)",
                border: "1px dashed var(--border)",
                color: "var(--text-2)",
                fontSize: "12px",
                lineHeight: 1.6,
                whiteSpace: "pre-wrap",
              }}
            >
              {draft}
            </pre>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "10px" }}>
            <a
              href={gmailWebHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: "10px 14px", textDecoration: "none" }}
            >
              <Mail size={14} />
              <span>Send with Web Gmail</span>
            </a>
            <a
              href={mailHref}
              className="btn btn-secondary"
              style={{ padding: "10px 14px", textDecoration: "none" }}
            >
              <ExternalLink size={14} />
              <span>Open in Mail App</span>
            </a>
            {isIssueIntent && (
              <a
                href={issueHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
                style={{
                  gridColumn: "span 2",
                  border: "1px dashed var(--border)",
                  padding: "9px",
                  textDecoration: "none",
                  fontSize: "12px",
                }}
              >
                <span>
                  {intentId === "bug"
                    ? "Open as a public GitHub issue instead"
                    : "Submit as a public GitHub issue instead"}
                </span>
                <ArrowUpRight size={13} />
              </a>
            )}
          </div>
        </div>

        {/* Right: Direct Contact Channels */}
        <div className="fade-up delay-2" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted-fg)",
            }}
          >
            Contact Directly
          </div>
          <HandleRow
            label="Gmail"
            value={GMAIL}
            href={`mailto:${GMAIL}`}
            icon={<Mail size={15} />}
            copied={copiedKey === "mail"}
            onCopy={() => copy("mail", GMAIL)}
          />
          <HandleRow
            label="GitHub"
            value={`@${GITHUB_USER}`}
            href={`https://github.com/${GITHUB_USER}`}
            icon={
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.74.81 1.18 1.83 1.18 3.09 0 4.42-2.7 5.39-5.27 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
              </svg>
            }
            copied={copiedKey === "gh"}
            onCopy={() => copy("gh", `https://github.com/${GITHUB_USER}`)}
          />
          <HandleRow
            label="Repository"
            value={REPO}
            href={`https://github.com/${REPO}`}
            icon={<Lightbulb size={15} />}
            copied={copiedKey === "repo"}
            onCopy={() => copy("repo", `https://github.com/${REPO}`)}
          />

          <div
            style={{
              marginTop: "4px",
              padding: "14px 16px",
              borderRadius: "8px",
              background: "var(--surface-xs)",
              border: "1px dashed var(--border)",
              fontSize: "12px",
              color: "var(--muted-fg)",
              lineHeight: 1.6,
            }}
          >
            Coffee is never required. Starring the repository, reporting a bug, or sharing a workflow idea helps just as much.
          </div>
        </div>
      </div>
    </div>
  );
}
