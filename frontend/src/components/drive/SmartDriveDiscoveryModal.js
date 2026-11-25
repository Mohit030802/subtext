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
    return { label: "PDF", color: "var(--red)", bg: "var(--red-dim)", border: "var(--red-border)" };
  }
  if (mimeType.includes("word") || mimeType.includes("document")) {
    return { label: "DOCX", color: "var(--blue)", bg: "var(--blue-dim)", border: "var(--border)" };
  }
  return { label: "DOC", color: "var(--text-2)", bg: "var(--surface-xs)", border: "var(--border)" };
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

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const importedCount = Object.values(importStatus).filter(s => s === "imported").length;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(24, 24, 27, 0.42)",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 999999,
        padding: "24px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="fade-up"
        style={{
          background: "var(--card)",
          border: "1px solid var(--border-hover)",
          borderRadius: "10px",
          width: "100%",
          maxWidth: "660px",
          height: "76vh",
          maxHeight: "660px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 60px rgba(24, 24, 27, 0.18)",
          overflow: "hidden",
        }}
      >
        {/* ── Editorial Modal Header ── */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg)",
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "var(--card)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: "2px",
                flexShrink: 0,
              }}
            >
              <GoogleDriveLogo size={18} />
            </div>
            <div>
              <div
                style={{
                  fontSize: "10.5px",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--primary)",
                  marginBottom: "3px",
                }}
              >
                Google Drive Import
              </div>
              <h2
                className="font-serif-editorial"
                style={{
                  fontSize: "22px",
                  fontWeight: 400,
                  color: "var(--fg)",
                  margin: 0,
                  lineHeight: 1.15,
                }}
              >
                Import into {projectName}
              </h2>
              {clientName && (
                <div style={{ fontSize: "12px", color: "var(--muted-fg)", marginTop: "3px" }}>
                  Client: <span style={{ color: "var(--text-2)", fontWeight: 500 }}>{clientName}</span>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              color: "var(--muted-fg)",
              cursor: "pointer",
              width: "30px",
              height: "30px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--fg)";
              e.currentTarget.style.borderColor = "var(--border-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--muted-fg)";
              e.currentTarget.style.borderColor = "var(--border)";
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Search Bar & Hairline Tabs ── */}
        <div style={{ padding: "14px 24px 0", borderBottom: "1px solid var(--border)", background: "var(--card)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              background: "var(--surface-xs)",
              border: "1px solid var(--border)",
              borderRadius: "7px",
              padding: "9px 12px",
              marginBottom: searchQuery ? "14px" : "10px",
            }}
          >
            <Search size={14} color="var(--muted-fg)" style={{ flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contracts, NDAs, or proposals by title…"
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
                style={{ background: "transparent", border: "none", color: "var(--muted-fg)", cursor: "pointer", padding: "2px", display: "flex" }}
              >
                <X size={13} />
              </button>
            )}
          </div>

          {!searchQuery && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <button
                  type="button"
                  onClick={() => setActiveTab("suggested")}
                  style={{
                    padding: "8px 0 10px",
                    fontSize: "12.5px",
                    fontWeight: activeTab === "suggested" ? 600 : 500,
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "suggested" ? "2px solid var(--primary)" : "2px solid transparent",
                    color: activeTab === "suggested" ? "var(--primary)" : "var(--muted-fg)",
                    transition: "all 0.12s ease",
                    fontFamily: "inherit",
                  }}
                >
                  Matching &ldquo;{projectName}&rdquo;{" "}
                  <span className="font-mono" style={{ fontSize: "11px", opacity: 0.8 }}>
                    ({suggestedFiles.length})
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  style={{
                    padding: "8px 0 10px",
                    fontSize: "12.5px",
                    fontWeight: activeTab === "all" ? 600 : 500,
                    cursor: "pointer",
                    background: "transparent",
                    border: "none",
                    borderBottom: activeTab === "all" ? "2px solid var(--primary)" : "2px solid transparent",
                    color: activeTab === "all" ? "var(--primary)" : "var(--muted-fg)",
                    transition: "all 0.12s ease",
                    fontFamily: "inherit",
                  }}
                >
                  All Drive Files
                </button>
              </div>

              {activeTab === "suggested" && suggestedFiles.length > 1 && !loading && (
                <button
                  type="button"
                  onClick={handleImportAll}
                  disabled={importingAll}
                  className="btn btn-primary"
                  style={{
                    padding: "4px 10px",
                    fontSize: "11.5px",
                    marginBottom: "6px",
                    opacity: importingAll ? 0.7 : 1,
                    cursor: importingAll ? "not-allowed" : "pointer",
                  }}
                >
                  {importingAll ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : null}
                  <span>Import all ({suggestedFiles.length})</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Ledger-Style Files Stream ── */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: "56px 24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "var(--muted-fg)" }}>
              <Loader2 size={20} style={{ animation: "spin 1s linear infinite", color: "var(--primary)" }} />
              <span style={{ fontSize: "12.5px" }}>Querying Google Drive metadata…</span>
            </div>
          ) : error ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--red)", marginBottom: "12px" }}>{error}</div>
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
                style={{ fontSize: "12px" }}
              >
                <RefreshCw size={12} /> Retry
              </button>
            </div>
          ) : currentFiles.length === 0 ? (
            <div style={{ padding: "52px 24px", textAlign: "center", color: "var(--muted-fg)" }}>
              <FileText size={26} style={{ opacity: 0.35, margin: "0 auto 10px" }} />
              <div style={{ fontSize: "13.5px", color: "var(--fg)", fontWeight: 500 }}>
                {searchQuery
                  ? `No documents found matching "${searchQuery}"`
                  : `No files matching "${projectName}" found in Drive`}
              </div>
              <p style={{ fontSize: "12px", color: "var(--muted-fg)", marginTop: "4px" }}>
                Search any keyword above or switch to &ldquo;All Drive Files&rdquo;.
              </p>
            </div>
          ) : (
            <div>
              {currentFiles.map((file, idx) => {
                const badge = getFormatBadge(file.mimeType);
                const status = importStatus[file.id] || "idle";

                return (
                  <div
                    key={file.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 24px",
                      borderBottom: idx < currentFiles.length - 1 ? "1px solid var(--border)" : "none",
                      background: "var(--card)",
                      gap: "14px",
                      transition: "background 0.12s ease",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface-xs)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "var(--card)"; }}
                  >
                    {/* Left: format tag + title + metadata */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0, flex: 1 }}>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 7px",
                          borderRadius: "4px",
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
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
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", fontSize: "11.5px", color: "var(--muted-fg)" }}>
                          {file.isExactMatch && (
                            <span style={{ color: "var(--primary)", fontWeight: 600 }}>Exact match</span>
                          )}
                          <span className="font-mono">Updated {formatModifiedDate(file.modifiedTime)}</span>
                          {file.size && <span className="font-mono">· {formatBytes(file.size)}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Right: Import button */}
                    <button
                      type="button"
                      onClick={() => handleImportSingle(file)}
                      disabled={status === "importing" || status === "imported"}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 500,
                        cursor: status === "imported" ? "default" : status === "importing" ? "not-allowed" : "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        flexShrink: 0,
                        fontFamily: "inherit",
                        border:
                          status === "imported"
                            ? "1px solid var(--green-border)"
                            : "1px solid var(--border)",
                        background:
                          status === "imported"
                            ? "var(--green-dim)"
                            : status === "importing"
                            ? "var(--surface-sm)"
                            : "var(--card)",
                        color: status === "imported" ? "var(--green)" : "var(--fg)",
                        transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        if (status === "idle") {
                          e.currentTarget.style.borderColor = "var(--primary)";
                          e.currentTarget.style.background = "var(--primary)";
                          e.currentTarget.style.color = "#ffffff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (status === "idle") {
                          e.currentTarget.style.borderColor = "var(--border)";
                          e.currentTarget.style.background = "var(--card)";
                          e.currentTarget.style.color = "var(--fg)";
                        }
                      }}
                    >
                      {status === "imported" ? (
                        <>
                          <Check size={12} />
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
                          <ArrowRight size={12} />
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
            padding: "12px 24px",
            borderTop: "1px solid var(--border)",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: "var(--muted-fg)" }}>
            <Lock size={12} style={{ flexShrink: 0, color: "var(--primary)" }} />
            <span>Metadata query only · File contents are accessed only after you click Import.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={importedCount > 0 ? "btn btn-primary" : "btn btn-secondary"}
            style={{ padding: "6px 14px", fontSize: "12px" }}
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
