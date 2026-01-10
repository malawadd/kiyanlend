import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface NeoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-foreground',
  secondary: 'bg-secondary text-foreground',
  accent: 'bg-accent text-foreground',
  danger: 'bg-danger text-white',
  success: 'bg-success text-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export function NeoButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  disabled,
  ...props
}: NeoButtonProps) {
  return (
    <button
      className={`neo-button ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      }`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
