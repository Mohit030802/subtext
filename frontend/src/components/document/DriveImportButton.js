"use client";

import { useState, useEffect, useRef } from "react";
import { importDocument } from "@/lib/actions";
import { FolderOpen, Loader2 } from "lucide-react";

const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function DriveImportButton({ projectId }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | auth | picker | importing
  const gisReady = useRef(false);
  const pickerReady = useRef(false);
  const tokenClientRef = useRef(null);

  // Load Google Identity Services + Picker API once on mount
  useEffect(() => {
    // 1. Load GIS (for getting Drive access token via popup)
    if (!document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      const gis = document.createElement("script");
      gis.src = "https://accounts.google.com/gsi/client";
      gis.async = true;
      gis.defer = true;
      gis.onload = () => { gisReady.current = true; };
      document.body.appendChild(gis);
    } else {
      gisReady.current = true;
    }

    // 2. Load Google Picker API
    if (!document.querySelector('script[src*="apis.google.com/js/api.js"]')) {
      const gapi = document.createElement("script");
      gapi.src = "https://apis.google.com/js/api.js";
      gapi.async = true;
      gapi.defer = true;
      gapi.onload = () => {
        window.gapi.load("picker", () => { pickerReady.current = true; });
      };
      document.body.appendChild(gapi);
    } else if (window.gapi) {
      window.gapi.load("picker", () => { pickerReady.current = true; });
    }
  }, []);

  const openPicker = (accessToken) => {
    if (!window.google?.picker) {
      alert("Google Picker is still loading. Please try again in a moment.");
      setLoading(false);
      setStatus("idle");
      return;
    }

    const view = new window.google.picker.DocsView()
      .setMimeTypes([
        "application/pdf",
        "application/vnd.google-apps.document",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].join(","))
      .setMode(window.google.picker.DocsViewMode.LIST)
      .setIncludeFolders(false);

    const picker = new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setTitle("Select a contract or document")
      .setCallback(async (data) => {
        if (data.action === window.google.picker.Action.CANCEL) {
          setLoading(false);
          setStatus("idle");
          return;
        }
        if (data.action !== window.google.picker.Action.PICKED) return;

        const file = data.docs[0];
        setStatus("importing");

        try {
          await importDocument(projectId, {
            title: file.name,
            doc_type: detectDocType(file.name, file.mimeType),
            google_drive_file_id: file.id,
            google_drive_view_url: `https://drive.google.com/file/d/${file.id}/view`,
            google_drive_mime_type: file.mimeType,
            page_count: null,
          });
          setStatus("idle");
        } catch (err) {
          console.error("Import failed:", err);
          alert(`Import failed: ${err.message}`);
          setStatus("idle");
        } finally {
          setLoading(false);
        }
      })
      .build();

    setStatus("picker");
    picker.setVisible(true);
  };

  const handleClick = async () => {
    if (loading) return;
    setLoading(true);
    setStatus("auth");

    // Wait for GIS to be ready (it loads async)
    let waited = 0;
    while (!window.google?.accounts?.oauth2 && waited < 5000) {
      await new Promise(r => setTimeout(r, 200));
      waited += 200;
    }

    if (!window.google?.accounts?.oauth2) {
      alert("Google Identity Services failed to load. Please refresh and try again.");
      setLoading(false);
      setStatus("idle");
      return;
    }

    // Wait for Picker to be ready too
    let pickerWaited = 0;
    while (!window.google?.picker && pickerWaited < 5000) {
      await new Promise(r => setTimeout(r, 200));
      pickerWaited += 200;
    }

    // Initialize GIS token client (requests Drive scope via popup)
    if (!tokenClientRef.current) {
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: DRIVE_SCOPE,
        callback: (response) => {
          if (response.error) {
            console.error("Drive auth error:", response.error);
            alert(`Drive authorization failed: ${response.error}`);
            setLoading(false);
            setStatus("idle");
            return;
          }
          // Got a Drive-scoped access token — open the picker
          openPicker(response.access_token);
        },
      });
    }

    // Request token — shows popup if needed, instant if already authorized
    tokenClientRef.current.requestAccessToken({ prompt: "" });
  };

  const buttonLabel = {
    idle: "Import from Google Drive",
    auth: "Requesting Drive access…",
    picker: "Select a file…",
    importing: "Importing…",
  }[status];

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 16px",
        borderRadius: "8px",
        background: loading ? "rgba(124,58,237,0.5)" : "#7c3aed",
        color: "#fff",
        fontSize: "13px",
        fontWeight: 600,
        border: "none",
        cursor: loading ? "not-allowed" : "pointer",
        transition: "opacity 0.15s",
        fontFamily: "inherit",
        flexShrink: 0,
      }}
      onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = "0.88"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
    >
      {loading
        ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
        : <FolderOpen size={14} />
      }
      {buttonLabel}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </button>
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
