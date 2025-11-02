import { GameEngine } from '@/lib/game-framework/GameEngine';
import { Physics } from '@/lib/game-framework/mechanics/physics';
import { InputManager } from '@/lib/game-framework/mechanics/input';
import { Rendering } from '@/lib/game-framework/mechanics/rendering';
import { ScoreManager } from '@/lib/game-framework/mechanics/scoring';

interface Lander {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  fuel: number;
  alive: boolean;
  spawnTime: number;
}

interface Pad {
  x: number;
  y: number;
  w: number;
}

export class GravityLanderGame extends GameEngine {
  private lander: Lander = {
    x: 400,
    y: 80,
    vx: 0,
    vy: 0,
    angle: 0,
    fuel: 200,
    alive: true,
    spawnTime: 0
  };
  
  private pad: Pad = { x: 540, y: 520, w: 120 };
  private input = new InputManager();
  private score = new ScoreManager('gravity-lander');
  
  private readonly GRAVITY = 240;
  private readonly THRUST_POWER = 480;
  private readonly ROT_POWER = 3.6;
  private readonly TERMINAL_VELOCITY = 720;
  private readonly STALL_DURATION = 5.0;
  private readonly CANVAS_WIDTH = 960;
  private readonly CANVAS_HEIGHT = 540;
  
  private wind = 0;

  init(): void {
    this.reset();
  }

  private reset(): void {
    this.lander.x = 200 + Math.random() * 400;
    this.lander.y = 80;
    this.lander.vx = (Math.random() - 0.5) * 720;
    this.lander.vy = 0;
    this.lander.angle = 0;
    this.lander.fuel = 200;
    this.lander.alive = true;
    this.lander.spawnTime = performance.now();
    this.wind = 0;
    this.pad = { x: 100 + Math.random() * 600, y: 520, w: 100 + Math.random() * 80 };
  }

  update(dt: number): void {
    if (!this.lander.alive) return;

    const elapsed = (performance.now() - this.lander.spawnTime) / 1000;
    const stallComplete = elapsed > this.STALL_DURATION;

    if (this.input.isPressed('left')) {
      this.lander.angle -= this.ROT_POWER * dt;
    }
    if (this.input.isPressed('right')) {
      this.lander.angle += this.ROT_POWER * dt;
    }

    if (this.input.isPressed('space') && this.lander.fuel > 0) {
      this.lander.vx += Math.sin(this.lander.angle) * this.THRUST_POWER * dt;
      this.lander.vy -= Math.cos(this.lander.angle) * this.THRUST_POWER * dt;
      this.lander.fuel = Math.max(0, this.lander.fuel - 60 * dt);
    }

    if (stallComplete) {
      this.lander.vy += this.GRAVITY * dt;
      this.lander.vy = Math.min(this.lander.vy, this.TERMINAL_VELOCITY);
    }

    this.lander.vx += this.wind * dt;
    this.lander.x += this.lander.vx * dt;
    this.lander.y += this.lander.vy * dt;

    if (this.lander.x < 20) {
      this.lander.x = 20;
      this.lander.vx = 0;
    }
    if (this.lander.x > this.CANVAS_WIDTH - 20) {
      this.lander.x = this.CANVAS_WIDTH - 20;
      this.lander.vx = 0;
    }

    if (this.lander.y > this.pad.y - 10) {
      const within = this.lander.x > this.pad.x && this.lander.x < this.pad.x + this.pad.w;
      const soft = Math.abs(this.lander.vy) < 270 && Math.abs(this.lander.vx) < 180 && Math.abs(this.lander.angle) < 1.0;
      
      if (within && soft) {
        const points = Math.max(0, Math.floor(1000 - (Math.abs(this.lander.vy) / 3.6 + (200 - this.lander.fuel) * 2)));
        this.score.addPoints(points);
        this.reset();
      } else {
        this.lander.alive = false;
        this.score.saveHighScore('gravity-lander');
        setTimeout(() => this.reset(), 2000);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    Rendering.clearCanvas(ctx, '#05070d');

    const elapsed = (performance.now() - this.lander.spawnTime) / 1000;
    if (elapsed < this.STALL_DURATION) {
      const remaining = Math.ceil(this.STALL_DURATION - elapsed);
      ctx.save();
      ctx.font = 'bold 40px Arial';
      ctx.fillStyle = '#ffaa00';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText(`GRAVITY IN: ${remaining}s`, this.CANVAS_WIDTH / 2, 80);
      ctx.fillText(`GRAVITY IN: ${remaining}s`, this.CANVAS_WIDTH / 2, 80);
      ctx.restore();
    }

    ctx.fillStyle = '#0f1a35';
    ctx.fillRect(0, 540, this.CANVAS_WIDTH, 60);

    ctx.fillStyle = '#2ee6a6';
    ctx.fillRect(this.pad.x, this.pad.y, this.pad.w, 6);

    ctx.save();
    ctx.translate(this.lander.x, this.lander.y);
    ctx.rotate(this.lander.angle);
    ctx.fillStyle = '#d9e1ff';
    ctx.fillRect(-8, -10, 16, 20);
    ctx.fillStyle = '#39ff14';
    ctx.fillRect(-6, 10, 12, 2);
    ctx.restore();

    Rendering.drawText(ctx, `Fuel: ${Math.round(this.lander.fuel)}`, 20, 30, '#ffffff', 24);
    
    const vSpeed = Math.abs(this.lander.vy);
    let vsColor = '#2ee6a6';
    if (vSpeed > 240) vsColor = '#ff4444';
    else if (vSpeed > 150) vsColor = '#ffaa00';
    
    Rendering.drawText(ctx, `V-Speed: ${(this.lander.vy / 60).toFixed(2)}`, 20, 60, vsColor, 24);
    Rendering.drawText(ctx, `Score: ${this.score.getScore()}`, 20, 90, '#ffffff', 24);

    if (!this.lander.alive) {
      Rendering.drawText(ctx, 'CRASH!', this.CANVAS_WIDTH / 2 - 60, this.CANVAS_HEIGHT / 2, '#ff4444', 48);
    }
  }

  cleanup(): void {
    this.input.cleanup();
  }
}
