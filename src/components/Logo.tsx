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
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-yellow-400/30 rounded-full blur-sm"></div>
      
      {/* Main logo container */}
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Game controller */}
        <div className="absolute bottom-0 w-8 h-6 bg-orange-500 rounded-lg flex items-center justify-between px-1">
          {/* D-pad */}
          <div className="w-3 h-3 bg-cyan-300 rounded-sm flex items-center justify-center">
            <div className="w-1 h-1 bg-cyan-300 rounded-full"></div>
          </div>
          {/* Action buttons */}
          <div className="flex flex-col gap-0.5">
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full"></div>
            </div>
            <div className="flex gap-0.5">
              <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Glow effect */}
        <div className="absolute bottom-2 w-12 h-16 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full opacity-60 blur-sm"></div>

        {/* Text container */}
        <div className="relative z-10 flex flex-col items-center">
          {/* GAMES inc. - pixelated style */}
          <div className="text-yellow-400 font-mono text-xs leading-tight">
            <div className="flex">
              <span className="block w-1 h-1 bg-yellow-400 m-0.5"></span>
              <span className="block w-1 h-1 bg-yellow-400 m-0.5"></span>
              <span className="block w-1 h-1 bg-yellow-400 m-0.5"></span>
              <span className="block w-1 h-1 bg-yellow-400 m-0.5"></span>
              <span className="block w-1 h-1 bg-yellow-400 m-0.5"></span>
            </div>
            <div className="text-[6px] font-bold tracking-wider">GAMES</div>
            <div className="text-[4px] font-bold tracking-wider">inc.</div>
          </div>
          
          {/* Jr - smooth modern style */}
          <div className="text-orange-500 font-bold text-lg leading-none mt-1 drop-shadow-sm">
            Jr
          </div>
        </div>
      </div>
    </div>
  );
}
