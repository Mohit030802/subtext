"use client";

import { getGoogleAccessToken, DRIVE_SCOPE } from "./google-auth";
import { importDocument } from "./actions";

/**
 * Categorize contract by filename into values allowed by documents_doc_type_check:
 * ('NDA', 'MSA', 'SOW', 'SLA', 'HIRING', 'OTHER').
 */
export function detectDocType(filename = "") {
  const lower = filename.toLowerCase();
  if (lower.includes("nda") || lower.includes("non-disclosure") || lower.includes("confidential")) return "NDA";
  if (lower.includes("sow") || lower.includes("statement of work") || lower.includes("scope")) return "SOW";
  if (lower.includes("msa") || lower.includes("master service") || lower.includes("master agreement")) return "MSA";
  if (lower.includes("sla") || lower.includes("service level")) return "SLA";
  if (lower.includes("employ") || lower.includes("offer letter") || lower.includes("contractor") || lower.includes("hiring")) return "HIRING";
  return "OTHER";
}

/**
 * Formats byte size to human readable string (e.g. 2.4 MB).
 */
export function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return "";
  const num = Number(bytes);
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Formats ISO date string to readable format.
 */
export function formatModifiedDate(isoStr) {
  if (!isoStr) return "";
  try {
    const d = new Date(isoStr);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

/**
 * Searches Google Drive for documents matching the project name.
 * 
 * GUARDRAILS ENFORCED:
 * 1. Metadata-Only: Requests only id, name, mimeType, size, modifiedTime.
 * 2. Zero-Content Read: Never downloads or reads file contents during discovery.
 * 3. File Type Filtering: Only scans PDFs, Google Docs, and Word Documents.
 * 4. Trashed Files Excluded: Only searches active documents.
 */
export async function discoverMatchingDriveFiles({
  projectName,
  clientName = "",
  userEmail,
}) {
  if (!projectName || !projectName.trim()) {
    return { files: [], token: null, error: null };
  }

  // 1. Get access token with drive.readonly scope
  const token = await getGoogleAccessToken(DRIVE_SCOPE, userEmail);
  if (!token) {
    throw new Error("Could not acquire Google Drive access token.");
  }

  // 2. Extract meaningful search keywords from project name and optional client name
  // Filter out short noise words (e.g. 'and', 'the', 'for')
  const cleanStr = (s) => (s || "").replace(/[^\w\s-]/g, " ").trim();
  const rawKeywords = cleanStr(projectName)
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !["and", "the", "for", "with", "doc", "project"].includes(w.toLowerCase()));

  const primaryKeyword = rawKeywords[0] || projectName.trim();
  const secondaryKeyword = rawKeywords[1] || "";
  const cleanClient = cleanStr(clientName).split(/\s+/)[0] || "";

  // 3. Build Drive API search query
  // Escapes single quotes in query terms for Drive API syntax
  const escapeDriveQuery = (term) => term.replace(/\\/g, "\\\\").replace(/'/g, "\\'");

  const docMimeFilters = [
    "mimeType = 'application/pdf'",
    "mimeType = 'application/vnd.google-apps.document'",
    "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
  ].join(" or ");

  // Build search clauses (primary keyword OR secondary keyword OR client name)
  const nameClauses = [];
  if (primaryKeyword) {
    nameClauses.push(`name contains '${escapeDriveQuery(primaryKeyword)}'`);
  }
  if (secondaryKeyword && secondaryKeyword.length >= 3) {
    nameClauses.push(`name contains '${escapeDriveQuery(secondaryKeyword)}'`);
  }
  if (cleanClient && cleanClient.length >= 3 && cleanClient.toLowerCase() !== primaryKeyword.toLowerCase()) {
    nameClauses.push(`name contains '${escapeDriveQuery(cleanClient)}'`);
  }

  const nameQueryPart = nameClauses.length > 1
    ? `(${nameClauses.join(" or ")})`
    : nameClauses[0] || `name contains '${escapeDriveQuery(projectName.slice(0, 15))}'`;

  const driveQuery = `trashed = false and (${docMimeFilters}) and ${nameQueryPart}`;

  // 4. Fetch metadata strictly (no content payload)
  const params = new URLSearchParams({
    q: driveQuery,
    // Strict Guardrail: only request metadata fields
    fields: "files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink)",
    pageSize: "25",
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    orderBy: "modifiedTime desc",
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errDetail = "";
    try {
      const errJson = await res.json();
      errDetail = errJson?.error?.message || "";
    } catch {
      // ignore JSON parse error
    }
    throw new Error(errDetail || `Google Drive discovery returned status ${res.status}`);
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  // 5. Score and sort candidates by match relevance
  const normProject = projectName.toLowerCase();
  const normClient = clientName.toLowerCase();

  const scoredFiles = rawFiles.map((file) => {
    const fName = (file.name || "").toLowerCase();
    let score = 0;

    // Exact project name in filename
    if (fName.includes(normProject)) score += 50;

    // Word-level matching
    for (const kw of rawKeywords) {
      if (fName.includes(kw.toLowerCase())) score += 15;
    }

    // Client name in filename
    if (normClient && fName.includes(normClient)) score += 20;

    // Contract indicator bonus
    if (fName.includes("agreement") || fName.includes("contract") || fName.includes("proposal") || fName.includes("nda")) {
      score += 10;
    }

    // PDF / Doc bonus
    if (file.mimeType === "application/pdf") score += 5;

    return {
      ...file,
      docType: detectDocType(file.name, file.mimeType),
      matchScore: score,
      isExactMatch: fName.includes(normProject),
    };
  });

  // Sort highest score first, then newest
  scoredFiles.sort((a, b) => b.matchScore - a.matchScore);

  return {
    files: scoredFiles,
    token,
    queryUsed: primaryKeyword,
  };
}

/**
 * Directly queries Google Drive for contract files matching an arbitrary search string.
 * Uses metadata-only fields (id, name, mimeType, modifiedTime, size, webViewLink).
 */
export async function searchDriveFiles({
  userEmail = "",
  query = "",
  pageSize = 35,
}) {
  const token = await getGoogleAccessToken(DRIVE_SCOPE, userEmail);
  if (!token) {
    throw new Error("Could not acquire Google Drive access token.");
  }

  const docMimeFilters = [
    "mimeType = 'application/pdf'",
    "mimeType = 'application/vnd.google-apps.document'",
    "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'",
  ].join(" or ");

  const escapeDriveQuery = (term) => term.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  let driveQuery = `trashed = false and (${docMimeFilters})`;
  if (query && query.trim()) {
    driveQuery += ` and name contains '${escapeDriveQuery(query.trim())}'`;
  }

  const params = new URLSearchParams({
    q: driveQuery,
    fields: "files(id, name, mimeType, modifiedTime, size, iconLink, webViewLink)",
    pageSize: String(pageSize),
    supportsAllDrives: "true",
    includeItemsFromAllDrives: "true",
    orderBy: "modifiedTime desc",
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    let errDetail = "";
    try {
      const errJson = await res.json();
      errDetail = errJson?.error?.message || "";
    } catch {
      // ignore
    }
    throw new Error(errDetail || `Drive query returned status ${res.status}`);
  }

  const data = await res.json();
  const rawFiles = data.files || [];

  return {
    files: rawFiles.map((file) => ({
      ...file,
      docType: detectDocType(file.name, file.mimeType),
    })),
    token,
  };
}

/**
 * Imports a discovered file directly into the Subtext project.
 * Content is only accessed at this explicit user action step.
 */
export async function importDiscoveredFileToProject({
  projectId,
  file,
  accessToken,
  userEmail = "",
}) {
  let tokenToUse = accessToken;
  if (!tokenToUse) {
    tokenToUse = await getGoogleAccessToken(DRIVE_SCOPE, userEmail);
  }

  if (!projectId || !file?.id || !tokenToUse) {
    throw new Error("Could not acquire Google Drive access token for import");
  }

  const driveData = {
    title: file.name,
    doc_type: file.docType || detectDocType(file.name, file.mimeType),
    google_drive_file_id: file.id,
    google_drive_view_url: file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`,
    google_drive_mime_type: file.mimeType,
    page_count: null,
    drive_access_token: tokenToUse,
  };

  return await importDocument(projectId, driveData);
}
