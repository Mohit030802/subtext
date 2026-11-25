"use client";

import { useState, useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  X, Search, Check, Loader2, ArrowRight,
  RefreshCw, FileText, Lock
} from "lucide-react";
import {
  discoverMatchingDriveFiles,
  searchDriveFiles,
  importDiscoveredFileToProject,
  formatBytes,
  formatModifiedDate,
} from "@/lib/google-drive-agent";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

function GoogleDriveLogo({ size = 16 }) {
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

function getFormatBadge(mimeType = "") {
  if (mimeType.includes("pdf")) {
    return { label: "PDF", color: "#f87171", bg: "rgba(248, 113, 113, 0.1)" };
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return { label: "DOCX", color: "#60a5fa", bg: "rgba(96, 165, 250, 0.1)" };
  }
  return { label: "DOC", color: "#9ca3af", bg: "rgba(156, 163, 175, 0.1)" };
}

export default function SmartDriveDiscoveryModal({
  projectId,
  projectName = "",
  clientName = "",
  isOpen,
  onClose,
  onDocumentImported,
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const mounted = useMounted();

  const [activeTab, setActiveTab] = useState("suggested"); // 'suggested' | 'all'
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestedFiles, setSuggestedFiles] = useState([]);
  const [allFiles, setAllFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [importStatus, setImportStatus] = useState({});
  const [importingAll, setImportingAll] = useState(false);

  const searchDebounceRef = useRef(null);

  // When modal opens, fetch suggested files matching project name
  useEffect(() => {
    if (!isOpen || !projectName) return;
    let isCancelled = false;

    Promise.resolve().then(() => {
      setLoading(true);
      setError(null);
      setActiveTab("suggested");
      setSearchQuery("");
      setImportStatus({});
    });

    discoverMatchingDriveFiles({
      projectName,
      clientName,
      userEmail: session?.user?.email,
    })
      .then(({ files, token }) => {
        if (isCancelled) return;
        setSuggestedFiles(files);
        setAccessToken(token);
      })
      .catch((err) => {
        if (isCancelled) return;
        console.error("Discovery error:", err);
        setError(err.message || "Failed to query Google Drive.");
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, projectName, clientName, session?.user?.email]);

  // When switching to 'all' or when user types a search query
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === "all" || searchQuery.trim().length > 0) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

      searchDebounceRef.current = setTimeout(async () => {
        setLoading(true);
        setError(null);
        try {
          const { files, token } = await searchDriveFiles({
            userEmail: session?.user?.email,
            query: searchQuery,
            pageSize: 30,
          });
          setAllFiles(files);
          if (token) setAccessToken(token);
        } catch (err) {
          console.error("Search error:", err);
          setError(err.message || "Failed to search Drive.");
        } finally {
          setLoading(false);
        }
      }, 300);
    }
  }, [isOpen, activeTab, searchQuery, session?.user?.email]);

  const currentFiles = searchQuery.trim().length > 0
    ? allFiles
    : activeTab === "suggested"
    ? suggestedFiles
    : allFiles;

  const handleImportSingle = async (file) => {
    if (importStatus[file.id] === "imported" || importStatus[file.id] === "importing") return;

    setImportStatus(prev => ({ ...prev, [file.id]: "importing" }));
    try {
      const doc = await importDiscoveredFileToProject({
        projectId,
        file,
        accessToken,
        userEmail: session?.user?.email,
      });
      setImportStatus(prev => ({ ...prev, [file.id]: "imported" }));
      if (onDocumentImported) {
        onDocumentImported(doc);
      }
      router.refresh();
    } catch (err) {
      console.error("Import failed:", err);
      setImportStatus(prev => ({ ...prev, [file.id]: "error" }));
      alert(`Import failed: ${err.message}`);
    }
  };

  const handleImportAll = async () => {
    if (importingAll || currentFiles.length === 0) return;
    setImportingAll(true);

    for (const file of currentFiles) {
      if (importStatus[file.id] !== "imported") {
        setImportStatus(prev => ({ ...prev, [file.id]: "importing" }));
        try {
          const doc = await importDiscoveredFileToProject({
            projectId,
            file,
            accessToken,
            userEmail: session?.user?.email,
          });
          setImportStatus(prev => ({ ...prev, [file.id]: "imported" }));
          if (onDocumentImported) {
            onDocumentImported(doc);
          }
        } catch (err) {
          console.error("Import error:", file.name, err);
          setImportStatus(prev => ({ ...prev, [file.id]: "error" }));
        }
      }
    }
    setImportingAll(false);
    router.refresh();
  };

  if (!isOpen || !mounted) return null;

  const importedCount = Object.values(importStatus).filter(s => s === "imported").length;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "20px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "620px",
          height: "78vh",
          maxHeight: "680px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
          overflow: "hidden",
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "6px",
                background: "var(--surface-sm)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GoogleDriveLogo size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: "14px", fontWeight: 600, color: "var(--fg)", margin: 0, lineHeight: 1.2 }}>
                Import Documents
              </h2>
              <div style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "2px" }}>
                Target: <span style={{ color: "var(--text-1)", fontWeight: 500 }}>{projectName}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-3)",
              cursor: "pointer",
              padding: "4px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--fg)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Search Bar & View Tabs ── */}
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: "10px" }}>
          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--surface-sm)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "7px 12px",
            }}
          >
            <Search size={14} color="var(--text-3)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts, NDAs, proposals in Google Drive…"
              style={{
                background: "transparent",
                border: "none",
                outline: "none",
                color: "var(--fg)",
                fontSize: "13px",
                width: "100%",
                fontFamily: "inherit",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ background: "transparent", border: "none", color: "var(--text-3)", cursor: "pointer", padding: "2px" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Segmented Control */}
          {!searchQuery && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div
                style={{
                  display: "inline-flex",
                  padding: "2px",
                  borderRadius: "6px",
                  background: "var(--surface-sm)",
                  border: "1px solid var(--border)",
                  gap: "2px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("suggested")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "none",
                    background: activeTab === "suggested" ? "var(--card)" : "transparent",
                    color: activeTab === "suggested" ? "var(--fg)" : "var(--text-3)",
                    boxShadow: activeTab === "suggested" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.1s ease",
                  }}
                >
                  Matching &ldquo;{projectName}&rdquo; ({suggestedFiles.length})
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  style={{
                    padding: "4px 12px",
                    borderRadius: "4px",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "none",
                    background: activeTab === "all" ? "var(--card)" : "transparent",
                    color: activeTab === "all" ? "var(--fg)" : "var(--text-3)",
                    boxShadow: activeTab === "all" ? "0 1px 3px rgba(0,0,0,0.2)" : "none",
                    transition: "all 0.1s ease",
                  }}
                >
                  All Google Drive Contracts
                </button>
              </div>

              {activeTab === "suggested" && suggestedFiles.length > 1 && !loading && (
                <button
                  type="button"
                  onClick={handleImportAll}
                  disabled={importingAll}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "var(--primary)",
                    color: "#ffffff",
                    border: "none",
                    cursor: importingAll ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  {importingAll ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  <span>Import all ({suggestedFiles.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Files Stream ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 20px" }}>
          {loading ? (
            <div style={{ padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--text-3)" }}>
              <Loader2 size={22} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
              <span style={{ fontSize: "12px" }}>Connecting to Google Drive…</span>
            </div>
          ) : error ? (
            <div style={{ padding: "30px 20px", textAlign: "center", color: "var(--red)" }}>
              <div style={{ fontSize: "13px", fontWeight: 500 }}>{error}</div>
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  setError(null);
                  discoverMatchingDriveFiles({ projectName, clientName, userEmail: session?.user?.email })
                    .then(({ files }) => setSuggestedFiles(files))
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
                className="btn btn-secondary"
                style={{ marginTop: "12px", fontSize: "12px", padding: "4px 12px" }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : currentFiles.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-3)" }}>
              <FileText size={28} style={{ opacity: 0.3, margin: "0 auto 10px" }} />
              <div style={{ fontSize: "13px", color: "var(--text-2)", fontWeight: 500 }}>
                {searchQuery
                  ? `No documents found matching "${searchQuery}"`
                  : `No contract files matching "${projectName}" found in Drive`}
              </div>
              <p style={{ fontSize: "12px", color: "var(--text-3)", marginTop: "4px" }}>
                Try searching any keyword above or switch to &ldquo;All Google Drive Contracts&rdquo;.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {currentFiles.map((file) => {
                const badge = getFormatBadge(file.mimeType);
                const status = importStatus[file.id] || "idle";

                return (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      background: "var(--surface-sm)",
                      gap: "12px",
                      transition: "all 0.12s ease",
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = "var(--border-hover)";
                      e.currentTarget.style.background = "var(--surface-md)";
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = "var(--border)";
                      e.currentTarget.style.background = "var(--surface-sm)";
                    }}
                  >
                    {/* Left: format pill + title + meta */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: "4px",
                          background: badge.bg,
                          color: badge.color,
                          fontFamily: "var(--font-mono)",
                          flexShrink: 0,
                        }}
                      >
                        {badge.label}
                      </span>

                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          title={file.name}
                          style={{
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "var(--fg)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {file.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", fontSize: "11px", color: "var(--text-3)" }}>
                          {file.isExactMatch && (
                            <span style={{ color: "#fbbf24", fontWeight: 500 }}>Exact match</span>
                          )}
                          <span>Updated {formatModifiedDate(file.modifiedTime)}</span>
                          {file.size && <span>· {formatBytes(file.size)}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Import action */}
                    <button
                      type="button"
                      onClick={() => handleImportSingle(file)}
                      disabled={status === "importing" || status === "imported"}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: status === "imported" ? "default" : status === "importing" ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        flexShrink: 0,
                        border: status === "imported" ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid var(--border)",
                        background: status === "imported"
                          ? "rgba(52, 211, 153, 0.1)"
                          : status === "importing"
                          ? "var(--surface-md)"
                          : "var(--card)",
                        color: status === "imported" ? "#34d399" : "var(--fg)",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={e => {
                        if (status === "idle") {
                          e.currentTarget.style.borderColor = "var(--border-hover)";
                          e.currentTarget.style.background = "var(--surface-md)";
                        }
                      }}
                      onMouseLeave={e => {
                        if (status === "idle") {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.background = "var(--card)";
                        }
                      }}
                    >
                      {status === "imported" ? (
                        <>
                          <Check size={12} color="#34d399" />
                          <span>Imported</span>
                        </>
                      ) : status === "importing" ? (
                        <>
                          <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
                          <span>Importing…</span>
                        </>
                      ) : (
                        <>
                          <span>Import</span>
                          <ArrowRight size={12} style={{ opacity: 0.6 }} />
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            background: "var(--surface-xs)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "var(--text-3)" }}>
            <Lock size={12} style={{ flexShrink: 0, opacity: 0.6 }} />
            <span>Metadata query only. File contents are downloaded only after you click import.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              background: importedCount > 0 ? "var(--primary)" : "var(--surface-sm)",
              border: "1px solid var(--border)",
              color: importedCount > 0 ? "#ffffff" : "var(--fg)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {importedCount > 0 ? "Done" : "Close"}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>,
    document.body
  );
}
