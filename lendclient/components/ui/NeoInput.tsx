import React from 'react';

interface NeoInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function NeoInput({ label, error, className = '', ...props }: NeoInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="font-bold text-sm uppercase tracking-wide">
          {label}
        </label>
      )}
      <input
        className={`neo-input px-4 py-3 ${className}`}
        {...props}
      />
      {error && (
        <span className="text-danger text-sm font-semibold">{error}</span>
      )}
    </div>
  );
}
