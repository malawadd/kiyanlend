import React from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'accent' | 'danger' | 'success' | 'neutral';

interface NeoBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-primary text-foreground',
  secondary: 'bg-secondary text-foreground',
  accent: 'bg-accent text-foreground',
  danger: 'bg-danger text-white',
  success: 'bg-success text-foreground',
  neutral: 'bg-gray-200 text-foreground',
};

export function NeoBadge({ children, variant = 'neutral', className = '' }: NeoBadgeProps) {
  return (
    <span className={`neo-badge inline-block px-3 py-1 ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
