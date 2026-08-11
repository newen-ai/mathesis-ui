"use client";

import { type InputHTMLAttributes, useState } from "react";

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function PasswordInput({
  className,
  ...props
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={isVisible ? "text" : "password"}
        className={`${className ?? ""} pr-12`}
      />
      <button
        type="button"
        onClick={() => setIsVisible((current) => !current)}
        aria-label={isVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
        className="mathesis-password-toggle absolute right-3 top-1/2 -translate-y-1/2"
      >
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
      </button>
    </div>
  );
}
