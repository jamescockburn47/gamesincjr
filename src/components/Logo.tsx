'use client';

import Image from 'next/image';
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
      <Image
        src="/images/logo.png"
        alt="Games Inc Jr Logo"
        fill
        sizes="(min-width: 1024px) 8rem, (min-width: 640px) 6rem, 100vw"
        className="object-contain"
        onError={(event) => {
          event.currentTarget.src = '/images/logo-placeholder.svg';
        }}
      />
    </div>
  );
}
