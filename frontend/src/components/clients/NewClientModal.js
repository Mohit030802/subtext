"use client";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/actions";
import { X, Building2 } from "lucide-react";

export default function NewClientModal({ onClose }) {
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createClient(formData);
        onClose();
      } catch (error) {
        console.error(error);
        alert("Failed to create client");
      }
    });
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0, 0, 0, 0.75)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 50, padding: "20px"
    }}>
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        width: "100%", maxWidth: "400px",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--fg)" }}>New Client</h2>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: "var(--subtle-fg)", cursor: "pointer"
          }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--subtle-fg)", marginBottom: "6px" }}>
              Client Name *
            </label>
            <input
              name="name" required autoFocus
              style={{
                width: "100%", padding: "10px", borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                color: "var(--fg)", fontSize: "14px", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--subtle-fg)", marginBottom: "6px" }}>
              Industry
            </label>
            <select
              name="industry"
              style={{
                width: "100%", padding: "10px", borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                color: "var(--fg)", fontSize: "14px", outline: "none", appearance: "none"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            >
              <option value="" style={{ background: "var(--card)", color: "var(--fg)" }}>Select industry...</option>
              {["Healthcare", "Finance", "Technology", "Real Estate", "Legal", "Other"].map(ind => (
                <option key={ind} value={ind} style={{ background: "var(--card)", color: "var(--fg)" }}>{ind}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--subtle-fg)", marginBottom: "6px" }}>
              Contact Name
            </label>
            <input
              name="contact_name"
              style={{
                width: "100%", padding: "10px", borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                color: "var(--fg)", fontSize: "14px", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--subtle-fg)", marginBottom: "6px" }}>
              Contact Email
            </label>
            <input
              name="contact_email" type="email"
              style={{
                width: "100%", padding: "10px", borderRadius: "6px",
                background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)",
                color: "var(--fg)", fontSize: "14px", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button" onClick={onClose}
              style={{
                padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500,
                background: "transparent", color: "var(--fg)", border: "1px solid var(--border)",
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isPending}
              style={{
                padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 500,
                background: "var(--primary)", color: "white", border: "none",
                cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1
              }}
            >
              {isPending ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
