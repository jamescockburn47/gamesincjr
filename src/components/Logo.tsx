import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-24 h-16',
    md: 'w-32 h-20',
    lg: 'w-48 h-32'
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <img
        src="/images/logo.png"
        alt="Games Inc Jr Logo"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to placeholder if main logo fails to load
          const target = e.target as HTMLImageElement;
          target.src = '/images/logo-placeholder.svg';
        }}
      />
    </div>
  );
}
