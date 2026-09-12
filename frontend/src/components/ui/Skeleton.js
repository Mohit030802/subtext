"use client";
import React from "react";

export default function Skeleton({ width = "100%", height = "20px", borderRadius = "4px", style = {} }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: "var(--border)",
        position: "relative",
        overflow: "hidden",
        ...style
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)",
          animation: "shimmer 1.5s infinite"
        }}
      />
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
