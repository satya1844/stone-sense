"use client";
import React from "react";

// Input with label, error, helperText. Forwarded ref for form libraries.
export const Input = React.forwardRef(
  (
    {
      id,
      label,
      type = "text",
      className = "",
      error,
      helperText,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const inputId = id || React.useId();
    const describedBy = [];
    if (helperText) describedBy.push(`${inputId}-help`);
    if (error) describedBy.push(`${inputId}-error`);

    return (
      <div className={"w-full " + className}>
        {label ? (
          <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-gray-700">
            {label}
          </label>
        ) : null}
        <div className="relative">
          {leftIcon ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {leftIcon}
            </span>
          ) : null}
          <input
            id={inputId}
            ref={ref}
            type={type}
            aria-invalid={!!error}
            aria-describedby={describedBy.join(" ") || undefined}
            className={`block w-full rounded-md border bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              error
                ? "border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:ring-blue-600"
            } ${leftIcon ? "pl-10" : "pl-3"} ${rightIcon ? "pr-10" : "pr-3"} h-10 text-sm`}
            {...props}
          />
          {rightIcon ? (
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
              {rightIcon}
            </span>
          ) : null}
        </div>
        {helperText ? (
          <p id={`${inputId}-help`} className="mt-1 text-xs text-gray-500">
            {helperText}
          </p>
        ) : null}
        {error ? (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
