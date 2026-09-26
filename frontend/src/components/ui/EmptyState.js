import React from "react";

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem",
      border: "1px dashed var(--border)",
      borderRadius: "0.5rem",
      textAlign: "center",
      backgroundColor: "var(--card)"
    }}>
      {Icon && (
        <div style={{
          padding: "1rem",
          backgroundColor: "var(--border)",
          borderRadius: "50%",
          marginBottom: "1rem",
          color: "var(--subtle-fg)"
        }}>
          <Icon size={24} />
        </div>
      )}
      <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.1rem", color: "var(--foreground)" }}>
        {title}
      </h3>
      <p style={{ margin: "0 0 1.5rem 0", color: "var(--subtle-fg)", maxWidth: "400px" }}>
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
