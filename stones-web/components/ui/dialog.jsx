"use client";
import React from "react";

// Accessible, controlled Dialog/Modal
// Props: open, onOpenChange, title, description, children, footer, closeOnOverlay=true
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  closeOnOverlay = true,
}) {
  const overlayRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      const old = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = old;
      };
    }
  }, [open]);

  if (!open) return null;

  function onOverlayClick(e) {
    if (!closeOnOverlay) return;
    if (e.target === overlayRef.current) onOpenChange?.(false);
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onOverlayClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-desc" : undefined}
    >
      <div className="w-full max-w-lg rounded-lg bg-white shadow-lg outline-none">
        <div className="border-b border-gray-100 px-4 py-3">
          {title ? (
            <h2 id="dialog-title" className="text-base font-semibold text-gray-900">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p id="dialog-desc" className="mt-1 text-sm text-gray-500">
              {description}
            </p>
          ) : null}
        </div>
        <div className="px-4 py-4">{children}</div>
        {footer ? <div className="border-t border-gray-100 px-4 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Dialog;
