"use client";
import React from "react";

// Button component with variants, sizes and loading state
// Usage: <Button variant="primary" size="md" isLoading onClick={...}>Save</Button>
// New: variant="uiverse" implements the requested 3D animated style (white button, black shadow)
const variants = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600",
  secondary:
    "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:outline-gray-400",
  ghost:
    "bg-transparent text-gray-900 hover:bg-gray-100 focus-visible:outline-gray-400",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-6 text-base",
};

export const Button = React.forwardRef(
  (
    {
      as: Comp = "button",
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    // Special rendering for the Uiverse 3D style button
    if (variant === "uiverse") {
      // map size to paddings
      const sizeMap = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
      };

      return (
        <Comp
          ref={ref}
          disabled={disabled || isLoading}
          aria-disabled={disabled || isLoading}
          className={[
            "relative inline-block select-none align-middle group",
            // base from provided CSS
            "border-none bg-transparent p-0 cursor-pointer",
            // focus styles using ring to avoid duplicate outline utilities
            "outline-none focus-visible:ring-2 focus-visible:ring-offset-4 focus-visible:ring-blue-600",
            "transition-[filter] duration-200 hover:brightness-110",
            disabled || isLoading ? "opacity-60 cursor-not-allowed hover:brightness-100" : "",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        >
          {/* shadow */}
          <span
            aria-hidden
            className={[
              "absolute inset-0 rounded-xl bg-black/30",
              "will-change-transform translate-y-[2px]",
              "transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(.3,.7,.4,1)]",
              "group-hover:translate-y-1 group-active:translate-y-[1px]",
            ].join(" ")}
          />
          {/* edge */}
          <span
            aria-hidden
            className="absolute inset-0 rounded-xl"
            style={{
              background:
                "linear-gradient(to left, rgb(17,17,17) 0%, rgb(51,51,51) 8%, rgb(51,51,51) 92%, rgb(17,17,17) 100%)",
            }}
          />
          {/* front */}
          <span
            className={[
              "relative block rounded-xl font-medium text-gray-900 bg-white",
              "will-change-transform -translate-y-1",
              "transition-transform duration-[600ms] [transition-timing-function:cubic-bezier(.3,.7,.4,1)]",
              "group-hover:-translate-y-1.5 group-active:-translate-y-0.5",
              sizeMap[size] || sizeMap.md,
            ].join(" ")}
          >
            <span className="inline-flex items-center gap-2">
              {leftIcon ? (
                <span className="shrink-0" aria-hidden>
                  {leftIcon}
                </span>
              ) : null}
              {isLoading ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-gray-500/60 border-t-transparent" />
                  <span className="sr-only">Loading…</span>
                  <span aria-hidden>{children}</span>
                </>
              ) : (
                children
              )}
              {rightIcon ? (
                <span className="shrink-0" aria-hidden>
                  {rightIcon}
                </span>
              ) : null}
            </span>
          </span>
        </Comp>
      );
    }

    // Default (existing) button styles
    const cls = [
      "inline-flex items-center justify-center gap-2 rounded-md font-medium",
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
      "disabled:opacity-60 disabled:cursor-not-allowed transition-colors",
      variants[variant] || variants.primary,
      sizes[size] || sizes.md,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <Comp
        ref={ref}
        className={cls}
        disabled={disabled || isLoading}
        aria-disabled={disabled || isLoading}
        {...props}
      >
        {leftIcon ? <span className="shrink-0" aria-hidden>{leftIcon}</span> : null}
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
            <span className="sr-only">Loading…</span>
            <span aria-hidden>{children}</span>
          </span>
        ) : (
          children
        )}
        {rightIcon ? <span className="shrink-0" aria-hidden>{rightIcon}</span> : null}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export default Button;
