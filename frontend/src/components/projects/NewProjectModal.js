"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/lib/actions";
import { X } from "lucide-react";

function GoogleDriveLogo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 87.3 78" style={{ flexShrink: 0 }}>
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.5l5.85 10.15z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>
  );
}

export default function NewProjectModal({ clientId, onClose }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [autoDiscover, setAutoDiscover] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const project = await createProject(clientId, formData);
        onClose();
        if (project?.id) {
          const autoParam = autoDiscover ? "?autoDiscover=1" : "";
          router.push(`/clients/${clientId}/projects/${project.id}${autoParam}`);
          router.refresh();
        }
      } catch (error) {
        console.error(error);
        alert("Failed to create project");
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
        borderRadius: "14px",
        width: "100%", maxWidth: "460px",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
      }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--fg)" }}>New Project</h2>
          <button onClick={onClose} style={{
            background: "transparent", border: "none", color: "var(--subtle-fg)", cursor: "pointer",
            padding: "4px", borderRadius: "6px"
          }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px" }}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--subtle-fg)", marginBottom: "6px" }}>
              Project Name *
            </label>
            <input
              name="name" required autoFocus
              placeholder="e.g. Master Services Agreement, Vendor Review"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "6px",
                background: "var(--surface-xs)", border: "1px solid var(--border)",
                color: "var(--fg)", fontSize: "13.5px", outline: "none"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "var(--subtle-fg)", marginBottom: "6px" }}>
              Description
            </label>
            <textarea
              name="description" rows={2}
              placeholder="Optional notes or project scope"
              style={{
                width: "100%", padding: "10px 12px", borderRadius: "6px",
                background: "var(--surface-xs)", border: "1px solid var(--border)",
                color: "var(--fg)", fontSize: "13.5px", outline: "none", resize: "none"
              }}
              onFocus={e => e.target.style.borderColor = "var(--primary)"}
              onBlur={e => e.target.style.borderColor = "var(--border)"}
            />
          </div>

          {/* ── Google Drive Integration Option ── */}
          <div style={{
            padding: "12px 14px",
            borderRadius: "8px",
            background: "var(--surface-sm)",
            border: "1px solid var(--border)",
            marginBottom: "20px",
          }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
              <input
                type="checkbox"
                name="autoDiscover"
                checked={autoDiscover}
                onChange={e => setAutoDiscover(e.target.checked)}
                style={{ marginTop: "2px", accentColor: "var(--primary)", cursor: "pointer", width: "15px", height: "15px" }}
              />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500, color: "var(--fg)" }}>
                  <GoogleDriveLogo size={14} />
                  <span>Scan Google Drive for matching contracts</span>
                </div>
                <p style={{ fontSize: "12px", color: "var(--muted-fg)", marginTop: "2px", lineHeight: "1.4" }}>
                  Suggests existing agreements or proposals matching this project name for one-click import.
                </p>
              </div>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <button
              type="button" onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isPending}
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px",
                padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                background: "var(--primary)", color: "white", border: "none",
                cursor: isPending ? "not-allowed" : "pointer", opacity: isPending ? 0.7 : 1
              }}
            >
              {isPending ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
