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
  description: 'Pilot aurora unicorn Astra through an alien rift — collect harmony crystals, pulse-convert drones, and keep your streak alive!',
  instructions: [
    'Arrow Keys / WASD — speedy free-flight control',
    'Space — Starlight Pulse: blast enemies with shockwaves (4s cooldown)',
    'GRAZE enemies and bullets by flying close to them to recharge your pulse faster!',
    'Catch multiple enemies in a single pulse for massive combo points',
    'Collect glowing harmony crystals to build your streak multiplier',
    'Summon Nova and Ember to access the screen-clearing SUPER PULSE',
  ],
  controls: {
    keyboard: ['Arrow Keys / WASD', 'Space (Pulse)'],
    touch: 'On-screen D-pad + Pulse button',
  },
};

const TOUCH_BUTTONS = [
  { id: 'up', label: '↑', position: 'bottom-left' as const, action: 'up' },
  { id: 'down', label: '↓', position: 'bottom-left' as const, action: 'down' },
  { id: 'left', label: '←', position: 'bottom-left' as const, action: 'left' },
  { id: 'right', label: '→', position: 'bottom-right' as const, action: 'right' },
  { id: 'pulse', label: '✨', position: 'bottom-right' as const, action: 'space' },
];

export default function Page() {
  const [state, setState] = useState<'landing' | 'instructions' | 'playing'>('landing');
  const [inputManager] = useState(() => new InputManager());

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
          <GameCanvas GameClass={AlienUnicornGame} width={960} height={540} />
          <TouchControls
            buttons={TOUCH_BUTTONS}
            onButtonPress={action => inputManager.addTouchAction(action)}
            onButtonRelease={action => inputManager.removeTouchAction(action)}
          />
        </FullScreenWrapper>
      )}
    </>
  );
}
