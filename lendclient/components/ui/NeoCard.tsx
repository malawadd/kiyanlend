import React from 'react';

interface NeoCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  bg?: string;
}

export function NeoCard({ children, className = '', onClick, bg = 'bg-white' }: NeoCardProps) {
  return (
    <div
      className={`neo-card ${bg} p-6 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
