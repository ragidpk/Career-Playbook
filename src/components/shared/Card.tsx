import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'elevated' | 'interactive';
}

export default function Card({
  children,
  title,
  className = '',
  variant = 'default',
}: CardProps) {
  const variantStyles = {
    default: 'bg-white rounded-2xl shadow-card',
    elevated: 'bg-white rounded-2xl shadow-elevated',
    interactive:
      'bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-smooth cursor-pointer',
  };

  return (
    <div className={`${variantStyles[variant]} ${className}`}>
      {title && (
        <div className="px-6 pt-6 pb-0">
          <span className="section-label">{title}</span>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
