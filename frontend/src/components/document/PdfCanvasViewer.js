"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Loader2, AlertTriangle, ZoomIn, ZoomOut, RotateCcw, ExternalLink, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { getGoogleAccessToken, DRIVE_SCOPE } from "@/lib/google-auth";

const PDFJS_SCRIPT_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
const PDFJS_WORKER_SRC = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/**
 * Normalizes text for comparison (strips line breaks, multiple spaces, punctuation).
 */
function normalizeStr(s) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

/**
 * Finds text bounding box on a PDF.js page for a given clause text.
 * Accurately handles multi-line clauses, avoids leaking into adjacent table columns,
 * and includes proper ascender and descender margins.
 */
function findClauseBoundingBox(textContent, viewport, clauseText) {
  if (!textContent || !textContent.items || !textContent.items.length || !clauseText) {
    return null;
  }

  const normQuery = normalizeStr(clauseText);
  if (normQuery.length < 4) return null;

  const queryWords = normQuery.split(" ").filter(w => w.length > 1);
  if (!queryWords.length) return null;

  const items = textContent.items;
  let matchingItems = [];

  // Pass 1: Look for an item containing the start of the clause
  const keyPhrase = queryWords.slice(0, Math.min(queryWords.length, 4)).join(" ");
  for (let i = 0; i < items.length; i++) {
    const itemNorm = normalizeStr(items[i].str);
    if (!itemNorm) continue;

    const matchedStart = itemNorm.includes(keyPhrase) ||
      (queryWords.length >= 2 && itemNorm.includes(queryWords.slice(0, 2).join(" "))) ||
      (queryWords.length === 1 && itemNorm.includes(queryWords[0]));

    if (matchedStart) {
      matchingItems.push(items[i]);

      // Check if subsequent items contain the remaining words of the clause
      let remainingWords = queryWords.filter(w => !itemNorm.includes(w));
      if (remainingWords.length > 0) {
        // Inspect subsequent items within nearby reading range
        for (let k = 1; k <= 5 && i + k < items.length; k++) {
          const nextNorm = normalizeStr(items[i + k].str);
          if (!nextNorm) continue;

          // Only include if this subsequent item actually has one of the remaining words
          const matchedAny = remainingWords.some(w => nextNorm.includes(w));
          if (matchedAny) {
            matchingItems.push(items[i + k]);
            remainingWords = remainingWords.filter(w => !nextNorm.includes(w));
            if (!remainingWords.length) break;
          }
        }
      }
      break;
    }
  }

  // Pass 2: Fallback scan matching first 2 significant words
  if (!matchingItems.length && queryWords.length >= 2) {
    const firstWord = queryWords[0];
    const secondWord = queryWords[1];

    for (let i = 0; i < items.length; i++) {
      const itemNorm = normalizeStr(items[i].str);
      if (!itemNorm) continue;

      if (itemNorm.includes(firstWord)) {
        matchingItems.push(items[i]);
        let remainingWords = queryWords.slice(1);

        for (let k = 1; k <= 5 && i + k < items.length && remainingWords.length > 0; k++) {
          const nextNorm = normalizeStr(items[i + k].str);
          if (!nextNorm) continue;
          if (remainingWords.some(w => nextNorm.includes(w))) {
            matchingItems.push(items[i + k]);
            remainingWords = remainingWords.filter(w => !nextNorm.includes(w));
          }
        }
        break;
      }
    }
  }

  if (!matchingItems.length) return null;

  // Compute bounding box in canvas coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const item of matchingItems) {
    const tx = item.transform; // [scaleX, skewY, skewX, scaleY, tx, ty]
    const x = tx[4];
    const y = tx[5]; // font baseline in PDF user space
    const width = item.width || 40;
    const fontHeight = item.height || Math.abs(tx[3]) || 12;

    // In PDF user space:
    // Font ascenders reach up to ~1.05 * fontHeight above baseline (y + 1.05 * fontHeight)
    // Font descenders reach down to ~0.35 * fontHeight below baseline (y - 0.35 * fontHeight)
    const pTop = viewport.convertToViewportPoint(x, y + fontHeight * 1.05);
    const pBottom = viewport.convertToViewportPoint(x + width, y - fontHeight * 0.35);

    minX = Math.min(minX, pTop[0], pBottom[0]);
    maxX = Math.max(maxX, pTop[0], pBottom[0]);
    minY = Math.min(minY, pTop[1], pBottom[1]);
    maxY = Math.max(maxY, pTop[1], pBottom[1]);
  }

  if (!isFinite(minX) || !isFinite(minY)) return null;

  // Padding to ensure highlights surround text cleanly with no sliced glyphs
  const padX = 6;
  const padY = 5;

  return {
    left: Math.max(0, Math.round(minX - padX)),
    top: Math.max(0, Math.round(minY - padY)),
    width: Math.min(viewport.width, Math.round((maxX - minX) + (padX * 2))),
    height: Math.max(22, Math.round((maxY - minY) + (padY * 2))),
  };
}

export default function PdfCanvasViewer({
  document: doc,
  clauseRisks = [],
  activeRisk = null,
  onSelectRisk,
  onSwitchToIframe,
}) {
  const { data: session } = useSession();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.25);
  const [pageBoxes, setPageBoxes] = useState({}); // { [riskId]: { page, left, top, width, height } }
  const [currentPage, setCurrentPage] = useState(1);
  const renderedPagesRef = useRef(new Set());

  // 1. Load PDF.js script from CDN
  const loadPdfJs = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (window.pdfjsLib) {
        resolve(window.pdfjsLib);
        return;
      }
      const existing = document.querySelector(`script[src="${PDFJS_SCRIPT_SRC}"]`);
      if (existing) {
        const interval = setInterval(() => {
          if (window.pdfjsLib) {
            clearInterval(interval);
            resolve(window.pdfjsLib);
          }
        }, 100);
        return;
      }
      const script = document.createElement("script");
      script.src = PDFJS_SCRIPT_SRC;
      script.async = true;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        resolve(window.pdfjsLib);
      };
      script.onerror = () => reject(new Error("Failed to load PDF engine"));
      document.body.appendChild(script);
    });
  }, []);

  // 2. Fetch PDF bytes from Drive or fallback with resilient retry & export handling
  const fetchPdfBytes = useCallback(async () => {
    if (!doc.google_drive_file_id) {
      throw new Error("No Google Drive file linked to this document");
    }

    const token = await getGoogleAccessToken(DRIVE_SCOPE, session?.user?.email);
    const fileId = encodeURIComponent(doc.google_drive_file_id);
    const isGoogleDoc = doc.google_drive_mime_type?.includes("google-apps") || doc.google_drive_mime_type === "application/vnd.google-apps.document";

    // URLs with supportsAllDrives=true to ensure shared drives and files work
    const mediaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
    const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=application/pdf&supportsAllDrives=true`;

    const primaryUrl = isGoogleDoc ? exportUrl : mediaUrl;
    const secondaryUrl = isGoogleDoc ? mediaUrl : exportUrl;

    let res = await fetch(primaryUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // If primary failed with 404 or 400, try the secondary mode (e.g. export vs alt=media)
    if (!res.ok && (res.status === 404 || res.status === 400)) {
      try {
        const altRes = await fetch(secondaryUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (altRes.ok) {
          res = altRes;
        }
      } catch (_) {}
    }

    // If still not ok, try backend PDF proxy endpoint
    if (!res.ok) {
      try {
        const backendBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const proxyRes = await fetch(`${backendBase}/api/v1/documents/${doc.id}/pdf`, {
          headers: { "X-Drive-Token": token },
        });
        if (proxyRes.ok) {
          return await proxyRes.arrayBuffer();
        }
      } catch (_) {}
    }

    if (!res.ok) {
      let detail = "";
      try {
        const errJson = await res.json();
        if (errJson?.error?.message) {
          detail = errJson.error.message;
        }
      } catch (_) {}

      if (res.status === 404) {
        throw new Error(
          detail
            ? `Google Drive: "${detail}". Make sure the file exists and is accessible to ${session?.user?.email || "your Google account"}.`
            : `File not found in Google Drive (404). Your account (${session?.user?.email || "current account"}) may not have access to this file.`
        );
      }

      throw new Error(detail || `Google Drive returned status ${res.status}`);
    }

    return await res.arrayBuffer();
  }, [doc.id, doc.google_drive_file_id, doc.google_drive_mime_type, session?.user?.email]);

  // 3. Initialize document
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    renderedPagesRef.current.clear();

    async function init() {
      try {
        const [pdfjs, buffer] = await Promise.all([loadPdfJs(), fetchPdfBytes()]);
        if (!active) return;

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
        const pdf = await loadingTask.promise;
        if (!active) return;

        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.error("PDF load error:", err);
        if (active) {
          setError(err.message || "Failed to load PDF file");
          setLoading(false);
        }
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [loadPdfJs, fetchPdfBytes]);

  // 4. Render pages on canvas & compute clause markers
  useEffect(() => {
    if (!pdfDoc || loading) return;

    let cancelled = false;

    async function renderAllPages() {
      const computedBoxes = {};

      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        if (cancelled) break;

        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });

        const canvas = document.getElementById(`pdf-canvas-${pageNum}`);
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        // Get text content to calculate bounding boxes
        const textContent = await page.getTextContent();
        for (const risk of clauseRisks) {
          // If risk specifies page_number, match only on that page
          const targetP = risk.page_number ? Number(risk.page_number) : null;
          if (targetP && targetP !== pageNum) continue;

          const box = findClauseBoundingBox(textContent, viewport, risk.clause_text);
          if (box) {
            computedBoxes[risk.id] = { ...box, page: pageNum };
          }
        }
      }

      if (!cancelled) {
        setPageBoxes(computedBoxes);
      }
    }

    renderAllPages();
    return () => {
      cancelled = true;
    };
  }, [pdfDoc, scale, loading, clauseRisks]);

  // 5. Scroll to active risk when "View in doc" is clicked
  useEffect(() => {
    if (!activeRisk) return;

    const targetPageNum = activeRisk.page_number ? Number(activeRisk.page_number) : 1;
    setCurrentPage(targetPageNum);

    const timer = setTimeout(() => {
      // First try scrolling directly to the bounding box marker
      const boxEl = document.getElementById(`risk-marker-box-${activeRisk.id}`);
      if (boxEl) {
        boxEl.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      // Fallback: scroll to page container
      const pageEl = document.getElementById(`pdf-page-${targetPageNum}`);
      if (pageEl) {
        pageEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [activeRisk]);

  const handleZoomIn = () => setScale(s => Math.min(2.2, +(s + 0.2).toFixed(2)));
  const handleZoomOut = () => setScale(s => Math.max(0.7, +(s - 0.2).toFixed(2)));
  const handleResetZoom = () => setScale(1.25);

  const jumpToPage = (p) => {
    const pageNum = Math.max(1, Math.min(numPages, p));
    setCurrentPage(pageNum);
    const el = document.getElementById(`pdf-page-${pageNum}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px", color: "var(--muted-fg)" }}>
        <Loader2 size={24} style={{ animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "12px", fontWeight: 500 }}>Rendering authentic PDF contract…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px 24px", textAlign: "center", color: "var(--muted-fg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
        <AlertTriangle size={32} color="#f87171" />
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-1)" }}>Could not render native PDF</div>
        <div style={{ fontSize: "12px", maxWidth: "340px", lineHeight: 1.5 }}>
          {error}. You can switch to Google Drive's cloud preview viewer instead.
        </div>
        {onSwitchToIframe && (
          <button
            type="button"
            onClick={onSwitchToIframe}
            style={{
              marginTop: "8px", padding: "8px 16px", borderRadius: "6px",
              background: "var(--primary)", color: "#fff", border: "none",
              fontSize: "12px", fontWeight: 600, cursor: "pointer",
            }}
          >
            Switch to Google Drive Preview
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#1f1f23", position: "relative" }}>
      {/* ── PDF Toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "6px 14px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
        flexShrink: 0, fontSize: "11px", zIndex: 20,
      }}>
        {/* Page Jump */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => jumpToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            style={{ padding: "3px 6px", background: "transparent", border: "none", color: currentPage <= 1 ? "var(--subtle-fg)" : "var(--text-2)", cursor: currentPage <= 1 ? "default" : "pointer" }}
          >
            <ChevronLeft size={14} />
          </button>
          <span style={{ color: "var(--text-1)", fontWeight: 500, fontFamily: "var(--font-mono)" }}>
            {currentPage} / {numPages}
          </span>
          <button
            type="button"
            onClick={() => jumpToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            style={{ padding: "3px 6px", background: "transparent", border: "none", color: currentPage >= numPages ? "var(--subtle-fg)" : "var(--text-2)", cursor: currentPage >= numPages ? "default" : "pointer" }}
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Zoom Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom out"
            style={{ padding: "3px 6px", borderRadius: "4px", background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}
          >
            <ZoomOut size={12} />
          </button>
          <button
            type="button"
            onClick={handleResetZoom}
            title="Reset zoom"
            style={{ padding: "2px 6px", borderRadius: "4px", background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "10px" }}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom in"
            style={{ padding: "3px 6px", borderRadius: "4px", background: "var(--surface-sm)", border: "1px solid var(--border)", color: "var(--text-2)", cursor: "pointer" }}
          >
            <ZoomIn size={12} />
          </button>
        </div>

        {/* Right action */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {clauseRisks.length > 0 && (
            <span style={{ fontSize: "11px", color: "#a78bfa", fontWeight: 600 }}>
              {clauseRisks.length} clauses marked
            </span>
          )}
          {onSwitchToIframe && (
            <button
              type="button"
              onClick={onSwitchToIframe}
              style={{
                fontSize: "11px", color: "var(--muted-fg)", background: "transparent",
                border: "none", cursor: "pointer", textDecoration: "underline"
              }}
            >
              Google Preview
            </button>
          )}
        </div>
      </div>

      {/* ── Document Scroll Area ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {Array.from({ length: numPages }, (_, idx) => {
          const pageNum = idx + 1;
          const risksOnPage = clauseRisks.filter(r => (r.page_number ? Number(r.page_number) === pageNum : true));

          return (
            <div
              id={`pdf-page-${pageNum}`}
              key={pageNum}
              style={{
                position: "relative",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.45)",
                borderRadius: "2px",
                background: "#ffffff",
                lineHeight: 0,
              }}
            >
              {/* Canvas where PDF page is rendered */}
              <canvas id={`pdf-canvas-${pageNum}`} />

              {/* Bounding Box Overlays for detected risks */}
              {risksOnPage.map(r => {
                const box = pageBoxes[r.id];
                if (!box || box.page !== pageNum) return null;

                const isActive = activeRisk?.id === r.id;
                const isHigh = r.risk_level === "HIGH";

                return (
                  <div
                    id={`risk-marker-box-${r.id}`}
                    key={r.id}
                    onClick={() => onSelectRisk && onSelectRisk(r)}
                    style={{
                      position: "absolute",
                      left: `${box.left}px`,
                      top: `${box.top}px`,
                      width: `${box.width}px`,
                      height: `${box.height}px`,
                      background: isActive
                        ? isHigh ? "rgba(239, 68, 68, 0.22)" : "rgba(245, 158, 11, 0.22)"
                        : isHigh ? "rgba(239, 68, 68, 0.10)" : "rgba(245, 158, 11, 0.10)",
                      border: isActive
                        ? `2px solid ${isHigh ? "#ef4444" : "#f59e0b"}`
                        : `1.5px dashed ${isHigh ? "rgba(239, 68, 68, 0.65)" : "rgba(245, 158, 11, 0.65)"}`,
                      boxShadow: isActive
                        ? `0 0 16px ${isHigh ? "rgba(239, 68, 68, 0.45)" : "rgba(245, 158, 11, 0.45)"}`
                        : "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      pointerEvents: "auto",
                      transition: "all 0.18s ease-in-out",
                      zIndex: isActive ? 15 : 5,
                    }}
                    title={`Click to view ${r.risk_level} risk: "${r.clause_text.slice(0, 80)}…"`}
                  >
                    {/* Floating Anchor Badge */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: box.top < 30 ? "auto" : "calc(100% + 6px)",
                          top: box.top < 30 ? "calc(100% + 6px)" : "auto",
                          left: "0",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: isHigh ? "#ef4444" : "#f59e0b",
                          color: "#ffffff",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          userSelect: "none",
                        }}
                      >
                        <AlertTriangle size={11} />
                        <span>{r.risk_level} RISK · P.{pageNum}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
