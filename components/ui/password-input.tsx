"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  fieldLabel: string;
};

export function PasswordInput({ fieldLabel, ...props }: Props) {
  const [visible, setVisible] = useState(false);
  return <span className="password-input">
    <input {...props} type={visible ? "text" : "password"} />
    <button
      type="button"
      className="password-input-toggle"
      aria-label={`${visible ? "Hide" : "Show"} ${fieldLabel.toLowerCase()}`}
      aria-pressed={visible}
      onClick={() => setVisible((value) => !value)}
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
        <circle cx="12" cy="12" r="2.5" />
        {visible ? <path d="M3 21 21 3" /> : null}
      </svg>
    </button>
  </span>;
}
