'use client';

import { useEffect, useState } from 'react';
import { TouchButton } from '@/lib/game-framework/types';

interface Props {
  buttons: TouchButton[];
  onButtonPress: (action: string) => void;
  onButtonRelease: (action: string) => void;
}

export function TouchControls({ buttons, onButtonPress, onButtonRelease }: Props) {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window);
  }, []);

  if (!isTouchDevice) return null;

  const getPositionClasses = (position: string) => {
    switch (position) {
      case 'bottom-left': return 'bottom-20 left-20';
      case 'bottom-right': return 'bottom-20 right-20';
      case 'top-left': return 'top-20 left-20';
      case 'top-right': return 'top-20 right-20';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {buttons.map(button => (
        <button
          key={button.id}
          className={`absolute pointer-events-auto w-16 h-16 rounded-full bg-white/30 border-2 border-white/50 backdrop-blur-md text-2xl flex items-center justify-center active:scale-90 transition-transform ${getPositionClasses(button.position)}`}
          onTouchStart={(e) => {
            e.preventDefault();
            onButtonPress(button.action);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            onButtonRelease(button.action);
          }}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
}
