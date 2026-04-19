import React from 'react';

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
} as const;

export type AvatarSize = keyof typeof sizeClasses;

export interface AvatarProps {
  name: string;
  /** Visual size; default `md`. */
  size?: AvatarSize;
  className?: string;
}

/**
 * Initial-based circular avatar (consistent blue).
 */
export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
  const initial = (name?.trim().charAt(0) || '?').toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold text-white ${sizeClasses[size]} ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
};
