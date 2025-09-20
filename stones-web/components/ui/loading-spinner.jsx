"use client";
import React from "react";

export default function LoadingSpinner({ size = 24, className = "", label = "Loading…" }) {
  const dimension = typeof size === "number" ? `${size}px` : size;
  return (
    <div className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <span
        className="inline-block animate-spin rounded-full border-2 border-current border-t-transparent"
        style={{ width: dimension, height: dimension }}
        aria-hidden
      />
      <span className="sr-only">{label}</span>
    </div>
  );
}
