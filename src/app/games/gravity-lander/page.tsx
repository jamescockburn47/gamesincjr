'use client';

import { useState } from 'react';
import { GameLandingPage } from '@/components/game/GameLandingPage';
import { InstructionsOverlay } from '@/components/game/InstructionsOverlay';
import { FullScreenWrapper } from '@/components/game/FullScreenWrapper';
import { GameCanvas } from '@/components/game/GameCanvas';
import { TouchControls } from '@/components/game/TouchControls';
import { GravityLanderGame } from './game';
import { InputManager } from '@/lib/game-framework/mechanics/input';

const GAME_METADATA = {
  title: 'Gravity Lander',
  description: 'Guide your lander to a safe touchdown on the platform!',
  instructions: [
    'Land softly on the green platform',
    'Keep your V-Speed LOW for safe landing',
    'Use thrust carefully - fuel is limited',
    'Green = Safe, Yellow = Caution, Red = Too Fast!',
    'Land with V-Speed under 4.5 to succeed'
  ],
  controls: {
    keyboard: ['Arrow Keys (Left/Right rotate, Up thrust)', 'WASD'],
    touch: 'On-screen buttons for rotation and thrust'
  }
};

const TOUCH_BUTTONS = [
  { id: 'left', label: '◀︎', position: 'bottom-left' as const, action: 'left' },
  { id: 'right', label: '▶︎', position: 'bottom-right' as const, action: 'right' },
  { id: 'thrust', label: '▲', position: 'top-right' as const, action: 'space' }
];

export default function Page() {
  const [state, setState] = useState<'landing' | 'instructions' | 'playing'>('landing');
  const [inputManager] = useState(() => new InputManager());

  const handleTouchPress = (action: string) => {
    inputManager.addTouchAction(action);
  };

  const handleTouchRelease = (action: string) => {
    inputManager.removeTouchAction(action);
  };

  return (
    <>
      {state === 'landing' && (
        <GameLandingPage 
          game={GAME_METADATA} 
          onStart={() => setState('instructions')} 
        />
      )}
      
      {state === 'instructions' && (
        <InstructionsOverlay
          game={GAME_METADATA}
          onStartGame={() => setState('playing')}
        />
      )}

      {state === 'playing' && (
        <FullScreenWrapper onExit={() => setState('landing')}>
          <GameCanvas GameClass={GravityLanderGame} />
          <TouchControls
            buttons={TOUCH_BUTTONS}
            onButtonPress={handleTouchPress}
            onButtonRelease={handleTouchRelease}
          />
        </FullScreenWrapper>
      )}
    </>
  );
}
