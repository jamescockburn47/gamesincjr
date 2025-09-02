import React from 'react';
import Image from 'next/image';

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

  // Try to load the actual logo, fallback to placeholder
  const logoSrc = '/images/logo.png'; // Replace with your actual logo
  const placeholderSrc = '/images/logo-placeholder.svg';

  return (
    <div className={`${sizeClasses[size]} ${className} relative`}>
      <Image
        src={logoSrc}
        alt="Games Inc Jr Logo"
        width={200}
        height={120}
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback to placeholder if main logo fails to load
          const target = e.target as HTMLImageElement;
          target.src = placeholderSrc;
        }}
        priority
      />
    </div>
  );
}
