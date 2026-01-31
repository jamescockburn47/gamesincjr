'use client';

import { useState } from 'react';
import { GameLandingPage } from '@/components/game/GameLandingPage';
import { InstructionsOverlay } from '@/components/game/InstructionsOverlay';
import { FullScreenWrapper } from '@/components/game/FullScreenWrapper';
import { GameCanvas } from '@/components/game/GameCanvas';
import { NineMensMorrisGame } from './game';

const GAME_METADATA = {
  title: "Nine Men's Morris",
  description: 'Master this ancient strategy game - form mills and outsmart the AI!',
  instructions: [
    'Click empty positions to place your pieces (blue)',
    'Form a "mill" (3 in a row) to capture an opponent piece',
    'After placing all pieces, move to adjacent positions',
    'When you have only 3 pieces, you can jump anywhere',
    'Win by reducing the AI to 2 pieces or blocking all moves',
    'Beautiful round board with animated pieces and effects!'
  ],
  controls: {
    keyboard: ['Mouse/Click to select and place pieces', 'Click again to move selected pieces'],
    touch: 'Tap positions to select and place pieces'
  }
};

export default function Page() {
  const [state, setState] = useState<'landing' | 'instructions' | 'playing'>('landing');

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
          <GameCanvas GameClass={NineMensMorrisGame} />
        </FullScreenWrapper>
      )}
    </>
  );
}
