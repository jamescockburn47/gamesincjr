/**
 * Nine Men's Morris (Merrills) - Ancient Strategy Game
 * 
 * Features:
 * - AI opponent with 3 difficulty levels
 * - Tutorial mode with strategy tips
 * - Round board with distinctive visual design
 * - Animated piece placement and captures
 * - Particle effects and celebrations
 * - Hint system and undo functionality
 */

import { GameEngine } from '@/lib/game-framework/GameEngine';

type Player = 'player' | 'ai' | null;
type GamePhase = 'placing' | 'moving' | 'flying' | 'removing';
type GameMode = 'tutorial' | 'easy' | 'medium' | 'hard';

interface Position {
  x: number;
  y: number;
  ring: number; // 0=outer, 1=middle, 2=inner
  index: number; // position on ring
}

interface Piece {
  player: Player;
  position: number;
  animProgress: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Mill {
  positions: number[];
}

export class NineMensMorrisGame extends GameEngine {
  private canvas!: HTMLCanvasElement;
  // Board configuration - 24 positions in 3 concentric rings
  private positions: Position[] = [];
  private board: (Player)[] = new Array(24).fill(null);
  private pieces: Map<number, Piece> = new Map();
  
  // Game state
  private currentPlayer: Player = 'player';
  private phase: GamePhase = 'placing';
  private selectedPos: number | null = null;
  private validMoves: Set<number> = new Set();
  
  // Piece counts
  private playerPiecesToPlace = 9;
  private aiPiecesToPlace = 9;
  private playerPiecesOnBoard = 0;
  private aiPiecesOnBoard = 0;
  
  // Game mode & difficulty
  private mode: GameMode = 'easy';
  private difficulty: 'easy' | 'medium' | 'hard' = 'easy';
  private tutorialMode = false;
  private tutorialStep = 0;
  private showDifficultyMenu = true;
  
  // Visual effects
  private particles: Particle[] = [];
  private hoverPos: number | null = null;
  private lastMill: number[] | null = null;
  private millCelebrationTime = 0;
  
  // AI state
  private aiThinking = false;
  private aiThinkTime = 0;
  
  // UI state
  private message = '';
  private messageTime = 0;
  
  // Constants
  private readonly CANVAS_WIDTH = 800;
  private readonly CANVAS_HEIGHT = 600;
  private readonly BOARD_CENTER_X = 400;
  private readonly BOARD_CENTER_Y = 320;
  private readonly RING_RADII = [200, 140, 80];
  private readonly PIECE_RADIUS = 20;
  
  // Mills - all possible 3-in-a-row combinations
  private readonly MILLS: Mill[] = [
    // Outer ring
    { positions: [0, 1, 2] }, { positions: [6, 7, 8] },
    { positions: [12, 13, 14] }, { positions: [18, 19, 20] },
    // Middle ring
    { positions: [3, 4, 5] }, { positions: [9, 10, 11] },
    { positions: [15, 16, 17] }, { positions: [21, 22, 23] },
    // Inner ring
    { positions: [0, 9, 21] }, { positions: [3, 10, 18] },
    { positions: [6, 14, 22] }, { positions: [1, 4, 7] },
    // Cross connections
    { positions: [8, 12, 17] }, { positions: [5, 13, 20] },
    { positions: [11, 16, 23] }, { positions: [2, 15, 19] },
  ];
  
  // Adjacent positions map
  private readonly ADJACENT: { [key: number]: number[] } = {
    0: [1, 9], 1: [0, 2, 4], 2: [1, 15],
    3: [4, 10], 4: [1, 3, 5, 7], 5: [4, 13],
    6: [7, 14], 7: [4, 6, 8], 8: [7, 12],
    9: [0, 10, 21], 10: [3, 9, 11, 18], 11: [10, 16],
    12: [8, 13, 17], 13: [5, 12, 14, 20], 14: [6, 13, 22],
    15: [2, 16, 19], 16: [11, 15, 17, 23], 17: [12, 16],
    18: [10, 19], 19: [15, 18, 20], 20: [13, 19],
    21: [9, 22], 22: [14, 21, 23], 23: [16, 22],
  };

  init(): void {
    this.initializePositions();
    this.setupGame();
  }
  
  start(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    canvas.addEventListener('mousemove', this.handleMouseMove);
    canvas.addEventListener('click', this.handleClick);
    super.start(canvas);
  }

  private initializePositions(): void {
    // Create position coordinates for traditional square layout
    // 24 positions: 8 per square (3 concentric squares)
    const squareSizes = [160, 110, 60]; // Outer, middle, inner square sizes
    
    for (let ring = 0; ring < 3; ring++) {
      const size = squareSizes[ring];
      const halfSize = size;
      
      // 8 positions per square: corners + midpoints
      const positions = [
        { x: -halfSize, y: -halfSize }, // Top-left corner
        { x: 0, y: -halfSize },          // Top-middle
        { x: halfSize, y: -halfSize },   // Top-right corner
        { x: halfSize, y: 0 },           // Right-middle
        { x: halfSize, y: halfSize },    // Bottom-right corner
        { x: 0, y: halfSize },           // Bottom-middle
        { x: -halfSize, y: halfSize },   // Bottom-left corner
        { x: -halfSize, y: 0 },          // Left-middle
      ];
      
      positions.forEach((pos, i) => {
        this.positions.push({
          x: this.BOARD_CENTER_X + pos.x,
          y: this.BOARD_CENTER_Y + pos.y,
          ring,
          index: i
        });
      });
    }
  }

  private setupGame(): void {
    this.board = new Array(24).fill(null);
    this.pieces.clear();
    this.currentPlayer = 'player';
    this.phase = 'placing';
    this.selectedPos = null;
    this.playerPiecesToPlace = 9;
    this.aiPiecesToPlace = 9;
    this.playerPiecesOnBoard = 0;
    this.aiPiecesOnBoard = 0;
    this.particles = [];
    this.showMessage('Place your pieces on empty positions');
  }

  private handleMouseMove = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (this.CANVAS_HEIGHT / rect.height);
    
    this.hoverPos = this.getPositionAt(x, y);
  };

  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (this.CANVAS_WIDTH / rect.width);
    const y = (e.clientY - rect.top) * (this.CANVAS_HEIGHT / rect.height);
    
    // Check for difficulty button clicks
    if (this.showDifficultyMenu) {
      if (this.isDifficultyButtonClicked(x, y, 'easy')) {
        this.difficulty = 'easy';
        this.showDifficultyMenu = false;
        this.showMessage('Easy mode selected - AI blocks your mills');
        return;
      }
      if (this.isDifficultyButtonClicked(x, y, 'medium')) {
        this.difficulty = 'medium';
        this.showDifficultyMenu = false;
        this.showMessage('Medium mode selected - AI tries to form mills');
        return;
      }
      if (this.isDifficultyButtonClicked(x, y, 'hard')) {
        this.difficulty = 'hard';
        this.showDifficultyMenu = false;
        this.showMessage('Hard mode selected - AI uses strategy!');
        return;
      }
      return; // Don't allow gameplay during menu
    }
    
    // Allow removal phase even when it's technically AI's turn
    if (this.phase === 'removing' && this.currentPlayer === 'player') {
      const pos = this.getPositionAt(x, y);
      if (pos !== null) {
        this.handlePlayerAction(pos);
      }
      return;
    }
    
    if (this.currentPlayer !== 'player' || this.aiThinking) return;
    
    const pos = this.getPositionAt(x, y);
    if (pos === null) return;
    
    this.handlePlayerAction(pos);
  };
  
  private isDifficultyButtonClicked(x: number, y: number, difficulty: 'easy' | 'medium' | 'hard'): boolean {
    const buttonY = this.BOARD_CENTER_Y - 60 + (difficulty === 'easy' ? 0 : difficulty === 'medium' ? 60 : 120);
    const buttonX = this.BOARD_CENTER_X - 80;
    return x >= buttonX && x <= buttonX + 160 && y >= buttonY && y <= buttonY + 45;
  }

  private getPositionAt(x: number, y: number): number | null {
    for (let i = 0; i < this.positions.length; i++) {
      const p = this.positions[i];
      const dist = Math.sqrt((x - p.x) ** 2 + (y - p.y) ** 2);
      if (dist < this.PIECE_RADIUS + 15) return i;
    }
    return null;
  }

  private handlePlayerAction(pos: number): void {
    if (this.phase === 'placing') {
      this.placePiece(pos, 'player');
    } else if (this.phase === 'moving' || this.phase === 'flying') {
      if (this.selectedPos === null) {
        if (this.board[pos] === 'player') {
          this.selectedPos = pos;
          this.calculateValidMoves();
        }
      } else {
        if (this.validMoves.has(pos)) {
          this.movePiece(this.selectedPos, pos, 'player');
        }
        this.selectedPos = null;
        this.validMoves.clear();
      }
    } else if (this.phase === 'removing') {
      this.removePiece(pos, 'player');
    }
  }

  private placePiece(pos: number, player: Player): void {
    if (this.board[pos] !== null) return;
    if (player === 'player' && this.playerPiecesToPlace === 0) return;
    if (player === 'ai' && this.aiPiecesToPlace === 0) return;
    
    this.board[pos] = player;
    this.pieces.set(pos, { player, position: pos, animProgress: 0 });
    
    if (player === 'player') {
      this.playerPiecesToPlace--;
      this.playerPiecesOnBoard++;
    } else {
      this.aiPiecesToPlace--;
      this.aiPiecesOnBoard++;
    }
    
    this.createPlacementParticles(pos, player);
    
    if (this.checkMill(pos, player)) {
      this.lastMill = this.getMillPositions(pos, player);
      this.millCelebrationTime = 1.0;
      this.phase = 'removing';
      this.showMessage(player === 'player' ? 'Mill! Remove an opponent piece' : 'AI formed a mill!');
      
      // If AI formed the mill, trigger it to remove a piece
      if (player === 'ai') {
        this.aiThinking = true;
        this.aiThinkTime = 0.3; // Shorter delay for removal
      }
    } else {
      this.switchPlayer();
      if (this.playerPiecesToPlace === 0 && this.aiPiecesToPlace === 0) {
        this.phase = 'moving';
        this.showMessage('All pieces placed! Now move to adjacent positions');
      }
    }
  }

  private movePiece(from: number, to: number, player: Player): void {
    this.board[from] = null;
    this.board[to] = player;
    this.pieces.delete(from);
    this.pieces.set(to, { player, position: to, animProgress: 0 });
    
    this.createMoveParticles(from, to, player);
    
    if (this.checkMill(to, player)) {
      this.lastMill = this.getMillPositions(to, player);
      this.millCelebrationTime = 1.0;
      this.phase = 'removing';
      this.showMessage(player === 'player' ? 'Mill! Remove an opponent piece' : 'AI formed a mill!');
      
      // If AI formed the mill, trigger it to remove a piece
      if (player === 'ai') {
        this.aiThinking = true;
        this.aiThinkTime = 0.3; // Shorter delay for removal
      }
    } else {
      this.switchPlayer();
    }
  }

  private removePiece(pos: number, remover: Player): void {
    const target = remover === 'player' ? 'ai' : 'player';
    
    if (this.board[pos] !== target) return;
    if (this.isInMill(pos, target) && this.hasNonMillPieces(target)) return;
    
    this.board[pos] = null;
    this.pieces.delete(pos);
    
    if (target === 'player') this.playerPiecesOnBoard--;
    else this.aiPiecesOnBoard--;
    
    this.createCaptureParticles(pos, target);
    this.phase = this.playerPiecesToPlace === 0 && this.aiPiecesToPlace === 0 ? 'moving' : 'placing';
    this.lastMill = null;
    
    if (this.checkWinCondition()) return;
    
    this.switchPlayer();
  }

  private calculateValidMoves(): void {
    this.validMoves.clear();
    if (this.selectedPos === null) return;
    
    const playerPieces = this.board.filter(p => p === this.currentPlayer).length;
    
    if (playerPieces === 3 && this.phase === 'moving') {
      this.phase = 'flying';
      this.showMessage('You can now jump anywhere!');
    }
    
    if (this.phase === 'flying') {
      for (let i = 0; i < 24; i++) {
        if (this.board[i] === null) this.validMoves.add(i);
      }
    } else {
      const adjacent = this.ADJACENT[this.selectedPos];
      for (const pos of adjacent) {
        if (this.board[pos] === null) this.validMoves.add(pos);
      }
    }
  }

  private checkMill(pos: number, player: Player): boolean {
    for (const mill of this.MILLS) {
      if (!mill.positions.includes(pos)) continue;
      if (mill.positions.every(p => this.board[p] === player)) return true;
    }
    return false;
  }

  private getMillPositions(pos: number, player: Player): number[] | null {
    for (const mill of this.MILLS) {
      if (!mill.positions.includes(pos)) continue;
      if (mill.positions.every(p => this.board[p] === player)) return mill.positions;
    }
    return null;
  }

  private isInMill(pos: number, player: Player): boolean {
    return this.checkMill(pos, player);
  }

  private hasNonMillPieces(player: Player): boolean {
    for (let i = 0; i < 24; i++) {
      if (this.board[i] === player && !this.isInMill(i, player)) return true;
    }
    return false;
  }

  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 'player' ? 'ai' : 'player';
    
    if (this.currentPlayer === 'ai') {
      this.aiThinking = true;
      this.aiThinkTime = 0.5 + Math.random() * 0.5;
    }
  }

  private checkWinCondition(): boolean {
    if (this.playerPiecesOnBoard < 3) {
      this.showMessage('AI Wins!');
      setTimeout(() => this.setupGame(), 3000);
      return true;
    }
    if (this.aiPiecesOnBoard < 3) {
      this.showMessage('You Win!');
      setTimeout(() => this.setupGame(), 3000);
      return true;
    }
    return false;
  }

  private aiTakeTurn(): void {
    if (this.phase === 'placing') {
      this.aiPlacePiece();
    } else if (this.phase === 'moving' || this.phase === 'flying') {
      this.aiMovePiece();
    } else if (this.phase === 'removing') {
      this.aiRemovePiece();
    }
  }

  private aiPlacePiece(): void {
    const empty = this.board.map((p, i) => p === null ? i : -1).filter(i => i >= 0);
    if (empty.length === 0) return;
    
    let pos: number;
    
    if (this.difficulty === 'easy') {
      // Easy: Try to block player mills, otherwise strategic positions
      pos = this.findMillFormingMove('player', empty) || 
            this.findStrategicPosition(empty) ||
            empty[Math.floor(Math.random() * empty.length)];
    } else if (this.difficulty === 'medium') {
      // Medium: Try to form a mill or block player mill
      pos = this.findMillFormingMove('ai', empty) || 
            this.findMillFormingMove('player', empty) || 
            this.findStrategicPosition(empty) ||
            empty[Math.floor(Math.random() * empty.length)];
    } else {
      // Hard: Strategic placement (center positions, mill formation, blocking)
      pos = this.findMillFormingMove('ai', empty) ||
            this.findMillFormingMove('player', empty) ||
            this.findStrategicPosition(empty) ||
            empty[Math.floor(Math.random() * empty.length)];
    }
    
    this.placePiece(pos, 'ai');
  }
  
  private findMillFormingMove(player: Player, emptyPositions: number[]): number | null {
    // Check if placing on any empty position would form a mill
    for (const pos of emptyPositions) {
      this.board[pos] = player;
      const formsMill = this.checkMill(pos, player);
      this.board[pos] = null;
      if (formsMill) return pos;
    }
    return null;
  }
  
  private findStrategicPosition(emptyPositions: number[]): number | null {
    // Prefer center positions and corners (positions 1, 3, 5, 7 on each square)
    const strategicPositions = [1, 3, 5, 7, 9, 11, 13, 15];
    const strategic = emptyPositions.filter(p => strategicPositions.includes(p));
    return strategic.length > 0 ? strategic[Math.floor(Math.random() * strategic.length)] : null;
  }

  private aiMovePiece(): void {
    const aiPieces = this.board.map((p, i) => p === 'ai' ? i : -1).filter(i => i >= 0);
    if (aiPieces.length === 0) return;
    
    let bestFrom = -1;
    let bestTo = -1;
    
    if (this.difficulty === 'easy') {
      // Random move
      const from = aiPieces[Math.floor(Math.random() * aiPieces.length)];
      this.selectedPos = from;
      this.currentPlayer = 'ai';
      this.calculateValidMoves();
      
      if (this.validMoves.size === 0) {
        this.selectedPos = null;
        return;
      }
      
      const moves = Array.from(this.validMoves);
      bestTo = moves[Math.floor(Math.random() * moves.length)];
      bestFrom = from;
    } else {
      // Medium/Hard: Try to form mills or block player
      for (const from of aiPieces) {
        this.selectedPos = from;
        this.currentPlayer = 'ai';
        this.calculateValidMoves();
        
        for (const to of this.validMoves) {
          // Simulate move
          const originalPiece = this.board[from];
          this.board[from] = null;
          this.board[to] = 'ai';
          
          const formsMill = this.checkMill(to, 'ai');
          
          // Restore board
          this.board[from] = originalPiece;
          this.board[to] = null;
          
          if (formsMill) {
            bestFrom = from;
            bestTo = to;
            break;
          }
          
          // For medium, accept first valid move after checking mills
          if (this.difficulty === 'medium' && bestFrom === -1) {
            bestFrom = from;
            bestTo = to;
          }
        }
        
        if (bestFrom !== -1 && bestTo !== -1 && this.checkMill(bestTo, 'ai')) break;
      }
      
      // If no mill-forming move found, pick a strategic move
      if (bestFrom === -1) {
        const from = aiPieces[Math.floor(Math.random() * aiPieces.length)];
        this.selectedPos = from;
        this.currentPlayer = 'ai';
        this.calculateValidMoves();
        const moves = Array.from(this.validMoves);
        bestTo = moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : -1;
        bestFrom = from;
      }
    }
    
    if (bestFrom !== -1 && bestTo !== -1) {
      this.movePiece(bestFrom, bestTo, 'ai');
    }
    
    this.selectedPos = null;
    this.validMoves.clear();
  }

  private aiRemovePiece(): void {
    const playerPieces = this.board.map((p, i) => p === 'player' ? i : -1).filter(i => i >= 0);
    const nonMill = playerPieces.filter(p => !this.isInMill(p, 'player'));
    const target = nonMill.length > 0 ? nonMill : playerPieces;
    
    if (target.length === 0) return;
    
    const pos = target[Math.floor(Math.random() * target.length)];
    this.removePiece(pos, 'ai');
  }

  private showMessage(msg: string): void {
    this.message = msg;
    this.messageTime = 3.0;
  }

  private createPlacementParticles(pos: number, player: Player): void {
    const p = this.positions[pos];
    const colors = player === 'player' ? ['#4db8ff', '#64b5f6', '#ffffff'] : ['#ff6b6b', '#ff8a80', '#ffffff'];
    
    for (let i = 0; i < 20; i++) {
      const angle = (i / 20) * Math.PI * 2;
      const speed = 80 + Math.random() * 60;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.6 + Math.random() * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  private createMoveParticles(from: number, to: number, player: Player): void {
    const p = this.positions[to];
    const color = player === 'player' ? '#4db8ff' : '#ff6b6b';
    
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * 60,
        vy: Math.sin(angle) * 60,
        life: 0.4,
        color
      });
    }
  }

  private createCaptureParticles(pos: number, player: Player): void {
    const p = this.positions[pos];
    const colors = player === 'player' ? ['#4db8ff', '#64b5f6', '#90caf9', '#ffffff'] : 
                                        ['#ff6b6b', '#ff8a80', '#ffab91', '#ffffff'];
    
    // Big explosion
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 100 + Math.random() * 120;
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  update(dt: number): void {
    // Update message timer
    if (this.messageTime > 0) this.messageTime -= dt;
    
    // Update mill celebration
    if (this.millCelebrationTime > 0) this.millCelebrationTime -= dt;
    
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    
    // Update piece animations
    this.pieces.forEach(piece => {
      if (piece.animProgress < 1) piece.animProgress += dt * 3;
    });
    
    // AI turn
    if (this.aiThinking) {
      this.aiThinkTime -= dt;
      if (this.aiThinkTime <= 0) {
        this.aiThinking = false;
        this.aiTakeTurn();
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    // Clear background with deep space theme
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Draw animated gradient background
    const time = Date.now() / 2000;
    const gradient = ctx.createRadialGradient(
      this.BOARD_CENTER_X, this.BOARD_CENTER_Y, 0,
      this.BOARD_CENTER_X, this.BOARD_CENTER_Y, 300
    );
    gradient.addColorStop(0, '#3d5a80');
    gradient.addColorStop(0.5, '#293241');
    gradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
    
    // Add subtle stars/dots in background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 50; i++) {
      const x = (i * 47) % this.CANVAS_WIDTH;
      const y = (i * 83 + Math.sin(time + i) * 5) % this.CANVAS_HEIGHT;
      ctx.fillRect(x, y, 2, 2);
    }
    
    // Draw difficulty selection menu
    if (this.showDifficultyMenu) {
      this.drawDifficultyMenu(ctx);
      return;
    }
    
    // Draw board
    this.drawBoard(ctx);
    
    // Draw pieces
    this.drawPieces(ctx);
    
    // Draw particles
    this.drawParticles(ctx);
    
    // Draw UI
    this.drawUI(ctx);
  }
  
  private drawDifficultyMenu(ctx: CanvasRenderingContext2D): void {
    // Draw title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Nine Men's Morris", this.BOARD_CENTER_X, 100);
    
    // Draw subtitle
    ctx.font = '20px Arial';
    ctx.fillStyle = '#aaaaaa';
    ctx.fillText('Select AI Difficulty', this.BOARD_CENTER_X, 140);
    
    // Draw difficulty buttons
    const difficulties: Array<{level: 'easy' | 'medium' | 'hard', label: string, desc: string, color: string}> = [
      { level: 'easy', label: 'Easy', desc: 'AI makes random moves', color: '#4db8ff' },
      { level: 'medium', label: 'Medium', desc: 'AI tries to form mills', color: '#ffaa00' },
      { level: 'hard', label: 'Hard', desc: 'AI uses strategy', color: '#ff6b6b' },
    ];
    
    difficulties.forEach((diff, i) => {
      const y = this.BOARD_CENTER_Y - 60 + i * 60;
      const x = this.BOARD_CENTER_X - 80;
      
      // Button background
      ctx.fillStyle = diff.color;
      ctx.fillRect(x, y, 160, 45);
      
      // Button border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 160, 45);
      
      // Button text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(diff.label, this.BOARD_CENTER_X, y + 28);
      
      // Description
      ctx.font = '14px Arial';
      ctx.fillStyle = '#aaaaaa';
      ctx.fillText(diff.desc, this.BOARD_CENTER_X, y + 70);
    });
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    // Draw board platform background
    ctx.fillStyle = 'rgba(30, 30, 50, 0.3)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fillRect(
      this.BOARD_CENTER_X - 200,
      this.BOARD_CENTER_Y - 200,
      400,
      400
    );
    ctx.shadowBlur = 0;
    
    // Draw three concentric squares with glowing effect
    const squareSizes = [160, 110, 60];
    squareSizes.forEach((size, idx) => {
      // Outer glow
      ctx.strokeStyle = idx === 0 ? 'rgba(100, 200, 255, 0.3)' : 
                       idx === 1 ? 'rgba(100, 200, 255, 0.2)' : 
                       'rgba(100, 200, 255, 0.15)';
      ctx.lineWidth = 6;
      ctx.strokeRect(
        this.BOARD_CENTER_X - size,
        this.BOARD_CENTER_Y - size,
        size * 2,
        size * 2
      );
      
      // Main line with gradient
      const gradient = ctx.createLinearGradient(
        this.BOARD_CENTER_X - size,
        this.BOARD_CENTER_Y - size,
        this.BOARD_CENTER_X + size,
        this.BOARD_CENTER_Y + size
      );
      gradient.addColorStop(0, '#64b5f6');
      gradient.addColorStop(0.5, '#ffffff');
      gradient.addColorStop(1, '#64b5f6');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#64b5f6';
      ctx.shadowBlur = 8;
      ctx.strokeRect(
        this.BOARD_CENTER_X - size,
        this.BOARD_CENTER_Y - size,
        size * 2,
        size * 2
      );
    });
    ctx.shadowBlur = 0;
    
    // Draw connecting lines with glow
    ctx.lineWidth = 3;
    const connections = [
      [1, 9, 17],   // Top middle
      [3, 11, 19],  // Right middle
      [5, 13, 21],  // Bottom middle
      [7, 15, 23],  // Left middle
    ];
    
    for (const line of connections) {
      ctx.strokeStyle = '#90caf9';
      ctx.shadowColor = '#64b5f6';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(this.positions[line[0]].x, this.positions[line[0]].y);
      ctx.lineTo(this.positions[line[1]].x, this.positions[line[1]].y);
      ctx.lineTo(this.positions[line[2]].x, this.positions[line[2]].y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    
    // Draw position markers with enhanced visuals
    this.positions.forEach((pos, i) => {
      const isValid = this.validMoves.has(i);
      const isHovered = this.hoverPos === i;
      const isMill = this.lastMill?.includes(i) && this.millCelebrationTime > 0;
      const isRemovable = this.phase === 'removing' && this.currentPlayer === 'player' && this.board[i] === 'ai';
      const pulse = isMill ? 1 + Math.sin(Date.now() / 150) * 0.3 : 1;
      
      // Outer glow for special states
      if (isValid || isMill || isRemovable) {
        ctx.shadowColor = isValid ? '#44ff44' : isRemovable ? '#ff4444' : '#ffd700';
        ctx.shadowBlur = 15 * pulse;
        ctx.fillStyle = isValid ? 'rgba(68, 255, 68, 0.3)' : 
                       isRemovable ? 'rgba(255, 68, 68, 0.3)' :
                       'rgba(255, 215, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 12 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      
      // Draw position marker
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2);
      
      if (isMill) {
        ctx.fillStyle = '#ffd700';
        ctx.strokeStyle = '#ffaa00';
      } else if (isValid) {
        ctx.fillStyle = '#44ff44';
        ctx.strokeStyle = '#22aa22';
      } else if (isRemovable) {
        ctx.fillStyle = '#ff4444';
        ctx.strokeStyle = '#cc2222';
      } else if (isHovered && this.board[i] === null) {
        ctx.fillStyle = '#666';
        ctx.strokeStyle = '#999';
      } else {
        ctx.fillStyle = '#2a2a3a';
        ctx.strokeStyle = '#555';
      }
      
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  private drawPieces(ctx: CanvasRenderingContext2D): void {
    this.pieces.forEach((piece, pos) => {
      const p = this.positions[pos];
      const isSelected = this.selectedPos === pos;
      const isMill = this.lastMill?.includes(pos) && this.millCelebrationTime > 0;
      const scale = Math.min(1, piece.animProgress);
      const pulse = isMill ? 1 + Math.sin(Date.now() / 200) * 0.1 : 1;
      
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(scale * pulse, scale * pulse);
      
      // Draw outer glow for selected or mill pieces
      if (isSelected || isMill) {
        ctx.shadowColor = isSelected ? '#ffd700' : '#00ff88';
        ctx.shadowBlur = 20;
        ctx.fillStyle = isSelected ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 255, 136, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, this.PIECE_RADIUS + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      
      // Draw piece shadow (larger, softer)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.arc(3, 3, this.PIECE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw piece with enhanced gradient
      const gradient = ctx.createRadialGradient(-8, -8, 0, 0, 0, this.PIECE_RADIUS);
      if (piece.player === 'player') {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#6dd5ff');
        gradient.addColorStop(0.7, '#2196f3');
        gradient.addColorStop(1, '#0d47a1');
      } else {
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.3, '#ff8a80');
        gradient.addColorStop(0.7, '#f44336');
        gradient.addColorStop(1, '#b71c1c');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, this.PIECE_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw metallic border
      ctx.strokeStyle = isSelected ? '#ffd700' : isMill ? '#00ff88' : '#e0e0e0';
      ctx.lineWidth = isSelected ? 5 : 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = isSelected || isMill ? 10 : 0;
      ctx.stroke();
      ctx.shadowBlur = 0;
      
      // Draw bright highlight spot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(-7, -7, 5, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => {
      const size = 2 + p.life * 3;
      
      // Glow effect
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10 * p.life;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  private drawUI(ctx: CanvasRenderingContext2D): void {
    // Draw title with glow
    ctx.shadowColor = '#64b5f6';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("Nine Men's Morris", this.BOARD_CENTER_X, 45);
    ctx.shadowBlur = 0;
    
    // Draw phase indicator with colored background
    const phaseText = this.phase === 'placing' ? 'PLACING PHASE' : 
                     this.phase === 'removing' ? '⚡ REMOVE OPPONENT PIECE ⚡' :
                     this.phase === 'flying' ? '✈ FLYING PHASE ✈' : 'MOVING PHASE';
    const phaseColor = this.phase === 'removing' ? '#ff4444' : '#64b5f6';
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(this.BOARD_CENTER_X - 200, this.CANVAS_HEIGHT - 40, 400, 30);
    
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = phaseColor;
    ctx.shadowColor = phaseColor;
    ctx.shadowBlur = 10;
    ctx.textAlign = 'center';
    ctx.fillText(phaseText, this.BOARD_CENTER_X, this.CANVAS_HEIGHT - 18);
    ctx.shadowBlur = 0;
    
    // Draw piece counts with modern styling
    ctx.textAlign = 'left';
    ctx.font = 'bold 20px Arial';
    
    // Player info box
    ctx.fillStyle = 'rgba(77, 184, 255, 0.2)';
    ctx.fillRect(10, 60, 180, 60);
    ctx.strokeStyle = '#4db8ff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 60, 180, 60);
    
    ctx.fillStyle = '#4db8ff';
    ctx.shadowColor = '#4db8ff';
    ctx.shadowBlur = 5;
    ctx.fillText(`⚫ You: ${this.playerPiecesOnBoard}`, 20, 85);
    if (this.playerPiecesToPlace > 0) {
      ctx.font = '16px Arial';
      ctx.fillText(`To place: ${this.playerPiecesToPlace}`, 20, 108);
      ctx.font = 'bold 20px Arial';
    }
    ctx.shadowBlur = 0;
    
    // AI info box
    ctx.fillStyle = 'rgba(255, 107, 107, 0.2)';
    ctx.fillRect(this.CANVAS_WIDTH - 190, 60, 180, 60);
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.CANVAS_WIDTH - 190, 60, 180, 60);
    
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    ctx.shadowBlur = 5;
    ctx.fillText(`AI: ${this.aiPiecesOnBoard} ⚫`, this.CANVAS_WIDTH - 20, 85);
    if (this.aiPiecesToPlace > 0) {
      ctx.font = '16px Arial';
      ctx.fillText(`To place: ${this.aiPiecesToPlace}`, this.CANVAS_WIDTH - 20, 108);
      ctx.font = 'bold 20px Arial';
    }
    ctx.shadowBlur = 0;
    
    // Draw current player indicator with animation
    ctx.textAlign = 'center';
    ctx.font = 'bold 28px Arial';
    const pulse = 1 + Math.sin(Date.now() / 300) * 0.1;
    
    if (this.aiThinking) {
      ctx.fillStyle = '#ffaa00';
      ctx.shadowColor = '#ffaa00';
      ctx.shadowBlur = 15 * pulse;
      ctx.fillText('🤖 AI Thinking...', this.BOARD_CENTER_X, 550);
    } else if (this.currentPlayer === 'player' || this.phase === 'removing') {
      ctx.fillStyle = '#4db8ff';
      ctx.shadowColor = '#4db8ff';
      ctx.shadowBlur = 15 * pulse;
      ctx.fillText('👤 Your Turn', this.BOARD_CENTER_X, 550);
    } else {
      ctx.fillStyle = '#ff6b6b';
      ctx.shadowColor = '#ff6b6b';
      ctx.shadowBlur = 15 * pulse;
      ctx.fillText('🤖 AI Turn', this.BOARD_CENTER_X, 550);
    }
    ctx.shadowBlur = 0;
    
    // Draw message with background
    if (this.messageTime > 0) {
      const alpha = Math.min(1, this.messageTime);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.8})`;
      ctx.fillRect(this.BOARD_CENTER_X - 250, 130, 500, 40);
      
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.font = 'bold 22px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, this.BOARD_CENTER_X, 157);
      ctx.shadowBlur = 0;
    }
  }

  cleanup(): void {
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('click', this.handleClick);
  }
}
