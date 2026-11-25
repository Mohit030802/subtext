"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { importDocument, updateDocument } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { openGoogleDrivePicker } from "@/lib/google-auth";

function GoogleDriveLogo({ size = 15 }) {
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

function detectDocType(filename, mimeType) {
  if (mimeType === "application/vnd.google-apps.document") return "AGREEMENT";
  const lower = filename.toLowerCase();
  if (lower.includes("nda")) return "NDA";
  if (lower.includes("sow") || lower.includes("statement of work")) return "SOW";
  if (lower.includes("msa") || lower.includes("master service")) return "MSA";
  if (lower.includes("lease")) return "LEASE";
  if (lower.includes("employ")) return "EMPLOYMENT";
  return "OTHER";
}

export default function DriveImportButton({
  projectId,
  documentId,
  clientId,
  onDocumentImported,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(documentId ? "Upload new version" : "Import from Drive");

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setLabel("Opening Drive…");

    try {
      await openGoogleDrivePicker({
        userEmail: session?.user?.email,
        onPicked: async ({ file, accessToken }) => {
          setLabel("Importing…");
          try {
            const driveData = {
              title: file.name,
              doc_type: detectDocType(file.name, file.mimeType),
              google_drive_file_id: file.id,
              google_drive_view_url: `https://drive.google.com/file/d/${file.id}/view`,
              google_drive_mime_type: file.mimeType,
              page_count: null,
              drive_access_token: accessToken,
            };

            if (documentId) {
              await updateDocument(documentId, driveData);
              router.replace(`/clients/${clientId}/projects/${projectId}/documents/${documentId}`);
              router.refresh();
            } else {
              const newDoc = await importDocument(projectId, driveData);
              if (onDocumentImported) {
                onDocumentImported(newDoc);
              }
              router.refresh();
            }
          } catch (err) {
            console.error("Import error:", err);
            alert(`Import failed: ${err.message}`);
          } finally {
            setLoading(false);
            setLabel(documentId ? "Upload new version" : "Import from Drive");
          }
        },
        onCancel: () => {
          setLoading(false);
          setLabel(documentId ? "Upload new version" : "Import from Drive");
        },
      });
    } catch (err) {
      console.error("Picker launch error:", err);
      alert(`Could not open Drive: ${err.message}`);
      setLoading(false);
      setLabel(documentId ? "Upload new version" : "Import from Drive");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "8px",
        background: loading ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.07)",
        border: "1px solid rgba(255, 255, 255, 0.14)",
        color: "#fafafa",
        fontSize: "13px",
        fontWeight: 600,
        cursor: loading ? "not-allowed" : "pointer",
        boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
        transition: "all 0.15s ease",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        if (!loading) {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.11)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
          e.currentTarget.style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = loading ? "rgba(255, 255, 255, 0.04)" : "rgba(255, 255, 255, 0.07)";
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {loading ? (
        <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
      ) : (
        <GoogleDriveLogo size={15} />
      )}
      <span>{label}</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
  );
}
