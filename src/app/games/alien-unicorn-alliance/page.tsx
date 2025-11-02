'use client';

import { useState } from 'react';
import { GameLandingPage } from '@/components/game/GameLandingPage';
import { InstructionsOverlay } from '@/components/game/InstructionsOverlay';
import { FullScreenWrapper } from '@/components/game/FullScreenWrapper';
import { GameCanvas } from '@/components/game/GameCanvas';
import { TouchControls } from '@/components/game/TouchControls';
import { AlienUnicornGame } from './game';
import { InputManager } from '@/lib/game-framework/mechanics/input';

const GAME_METADATA = {
  title: 'Alien Unicorn Alliance',
  description: 'Pilot an aurora unicorn through alien raids, collecting harmony crystals!',
  instructions: [
    'Use arrow keys or WASD to move left and right',
    'Press Space to jump',
    'Collect cyan crystals for points and streaks',
    'Avoid red drones or lose shields',
    'Game ends when all shields are lost'
  ],
  controls: {
    keyboard: ['Arrow Keys', 'WASD', 'Space'],
    touch: 'On-screen buttons for movement and jump'
  }
};

const TOUCH_BUTTONS = [
  { id: 'left', label: '←', position: 'bottom-left' as const, action: 'left' },
  { id: 'right', label: '→', position: 'bottom-right' as const, action: 'right' },
  { id: 'jump', label: '↑', position: 'top-right' as const, action: 'space' }
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
          <GameCanvas GameClass={AlienUnicornGame} />
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
