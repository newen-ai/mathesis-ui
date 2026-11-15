"use client";

import { type InputHTMLAttributes, type ReactNode, useMemo, useState } from "react";

type PasswordToggleLabels = {
  show?: string;
  hide?: string;
};

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  labels?: PasswordToggleLabels;
  ariaLabels?: PasswordToggleLabels;
  toggleClassName?: string;
  togglePaddingClassName?: string;
  renderToggleIcon?: (isVisible: boolean) => ReactNode;
};

export function buildPasswordInputClassName(
  className?: string,
  togglePaddingClassName = "pr-12"
): string {
  const classes = [className?.trim(), "w-full", togglePaddingClassName].filter(Boolean);
  return classes.join(" ");
}

export function PasswordInput({
  className,
  labels,
  ariaLabels,
  toggleClassName,
  togglePaddingClassName,
  renderToggleIcon,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  const resolvedLabels: PasswordToggleLabels = {
    show: labels?.show,
    hide: labels?.hide,
  };

  const resolvedAriaLabels: PasswordToggleLabels = {
    show: ariaLabels?.show ?? resolvedLabels.show,
    hide: ariaLabels?.hide ?? resolvedLabels.hide,
  };

  const usesTextToggle = Boolean(resolvedLabels.show || resolvedLabels.hide);

  const resolvedToggleClassName = useMemo(() => {
    if (toggleClassName) {
      return toggleClassName;
    }

    if (usesTextToggle) {
      return "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#7A6435] hover:underline";
    }

    return "sophium-password-toggle absolute right-3 top-1/2 -translate-y-1/2";
  }, [toggleClassName, usesTextToggle]);

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        className={buildPasswordInputClassName(className, togglePaddingClassName)}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? (resolvedAriaLabels.hide ?? "Ocultar contraseña") : (resolvedAriaLabels.show ?? "Mostrar contraseña")}
        className={resolvedToggleClassName}
      >
        {usesTextToggle
          ? (isVisible ? (resolvedLabels.hide ?? "Ocultar") : (resolvedLabels.show ?? "Mostrar"))
          : (renderToggleIcon?.(isVisible) ?? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
              {!isVisible ? <line x1="3" y1="3" x2="21" y2="21" /> : null}
            </svg>
          ))}
      </button>
    </div>
  );
}
