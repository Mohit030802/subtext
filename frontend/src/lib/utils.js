import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export function formatDateRelative(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days <= 7) return `${days}d`;
  if (days <= 30) return `${Math.ceil(days / 7)}w`;
  return formatDate(dateStr);
}

export const RISK_CONFIG = {
  HIGH: {
    label: "HIGH",
    color: "var(--risk-high)",
    bg: "var(--risk-high-bg)",
    glow: "var(--risk-high-glow)",
    tailwind: "text-red-400",
    dot: "bg-red-400",
  },
  MEDIUM: {
    label: "MEDIUM",
    color: "var(--risk-medium)",
    bg: "var(--risk-medium-bg)",
    glow: "var(--risk-medium-glow)",
    tailwind: "text-amber-400",
    dot: "bg-amber-400",
  },
  LOW: {
    label: "LOW",
    color: "var(--risk-low)",
    bg: "var(--risk-low-bg)",
    glow: "var(--risk-low-glow)",
    tailwind: "text-emerald-400",
    dot: "bg-emerald-400",
  },
};

export const STATUS_CONFIG = {
  PENDING: { label: "Pending", color: "#6366f1", bg: "rgba(99,102,241,0.12)" },
  COMPLETED: { label: "Completed", color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  OVERDUE: { label: "Overdue", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export const OBLIGATION_TYPE_CONFIG = {
  RENEWAL_NOTICE: { label: "Renewal", icon: "🔄" },
  PAYMENT: { label: "Payment", icon: "💳" },
  DELIVERABLE: { label: "Deliverable", icon: "📦" },
  EXPIRY: { label: "Expiry", icon: "⏰" },
  COMPLIANCE: { label: "Compliance", icon: "✅" },
  OTHER: { label: "Other", icon: "📋" },
};

export const PARTY_CONFIG = {
  CLIENT: { label: "Client", color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  US: { label: "Us", color: "#60a5fa", bg: "rgba(96,165,250,0.12)" },
  THIRD_PARTY: { label: "Third Party", color: "#9ca3af", bg: "rgba(156,163,175,0.12)" },
};

export const DOC_TYPE_COLORS = {
  NDA: { color: "#818cf8", bg: "rgba(129,140,248,0.1)" },
  MSA: { color: "#34d399", bg: "rgba(52,211,153,0.1)" },
  SOW: { color: "#60a5fa", bg: "rgba(96,165,250,0.1)" },
  SLA: { color: "#f472b6", bg: "rgba(244,114,182,0.1)" },
  HIRING: { color: "#fb923c", bg: "rgba(251,146,60,0.1)" },
  OTHER: { color: "#9ca3af", bg: "rgba(156,163,175,0.1)" },
};
