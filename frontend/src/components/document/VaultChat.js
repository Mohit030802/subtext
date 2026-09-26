"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

function Message({ msg }) {
  const isUser = msg.role === "user";

  // Parse **bold** in assistant messages
  const renderContent = (text) =>
    text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />;
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} style={{ margin: "0 0 6px" }}>
          {parts.map((p, j) =>
            p.startsWith("**") && p.endsWith("**")
              ? <strong key={j} style={{ color: "var(--text-1)", fontWeight: 600 }}>{p.slice(2,-2)}</strong>
              : p
          )}
        </p>
      );
    });

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: isUser ? "flex-end" : "flex-start", marginBottom: "16px" }}>
      {!isUser && (
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
          background: "var(--primary-dim)", border: "1px solid rgba(124,58,237,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center", marginTop: "2px",
        }}>
          <Sparkles size={12} color="#a78bfa" />
        </div>
      )}

      <div style={{
        maxWidth: "82%",
        padding: "10px 13px",
        borderRadius: isUser ? "12px 12px 3px 12px" : "3px 12px 12px 12px",
        fontSize: "12px", lineHeight: 1.65,
        background: isUser ? "#7c3aed" : "var(--card)",
        border: isUser ? "none" : "1px solid var(--border)",
        color: isUser ? "#fff" : "var(--text-3)",
      }}>
        {isUser
          ? <p style={{ margin: 0 }}>{msg.content}</p>
          : <div>{renderContent(msg.content)}</div>
        }
        {msg.citations?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginTop: "10px", paddingTop: "8px", borderTop: "1px solid var(--border)" }}>
            {msg.citations.map(c => (
              <span key={c.chunk_id} style={{
                fontSize: "10px", padding: "2px 7px", borderRadius: "4px", cursor: "pointer",
                border: "1px solid rgba(124,58,237,0.25)", color: "#a78bfa",
                background: "rgba(124,58,237,0.08)", fontWeight: 500,
              }}>p.{c.page}</span>
            ))}
          </div>
        )}
      </div>

      {isUser && (
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
          background: "#7c3aed20", border: "1px solid rgba(124,58,237,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "11px", fontWeight: 700, color: "#a78bfa", marginTop: "2px",
        }}>U</div>
      )}
    </div>
  );
}

export default function VaultChat({ messages, documentTitle }) {
  const [history, setHistory] = useState(messages || []);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  const send = () => {
    if (!input.trim()) return;
    const user = { id: `u-${Date.now()}`, role: "user", content: input.trim(), timestamp: new Date().toISOString() };
    const ai = {
      id: `a-${Date.now()}`, role: "assistant",
      content: "This is a **demo mode** response. Connect the Gemini API to enable live AI-powered contract analysis. The chat interface is fully functional — try asking questions once the backend is wired up.",
      timestamp: new Date().toISOString(),
    };
    setHistory(h => [...h, user, ai]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Scope bar */}
      <div style={{
        padding: "8px 16px", borderBottom: "1px solid var(--border)",
        background: "rgba(124,58,237,0.04)",
        display: "flex", alignItems: "center", gap: "7px",
      }}>
        <Sparkles size={12} color="#7c3aed" />
        <span style={{ fontSize: "11px", color: "#8b5cf6" }}>
          Chatting about: <strong style={{ fontWeight: 600 }}>{documentTitle}</strong>
        </span>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {history.map(m => <Message key={m.id} msg={m} />)}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border)" }}>
        <div style={{
          display: "flex", alignItems: "flex-end", gap: "8px",
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "10px", padding: "8px 10px 8px 14px",
        }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about this contract…"
            rows={1}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none", resize: "none",
              fontSize: "13px", color: "var(--text-2)", lineHeight: 1.5,
              maxHeight: "100px", fontFamily: "var(--font-inter), system-ui, sans-serif",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim()}
            style={{
              width: "32px", height: "32px", borderRadius: "7px",
              background: input.trim() ? "#7c3aed" : "var(--surface-sm)",
              border: "none", cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s", flexShrink: 0,
            }}
          >
            <Send size={14} color={input.trim() ? "#fff" : "var(--subtle-fg)"} />
          </button>
        </div>
        <p style={{ fontSize: "10px", color: "var(--subtle-fg)", textAlign: "center", marginTop: "6px" }}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
