import { GameEngine } from '@/lib/game-framework/GameEngine';
import { Physics } from '@/lib/game-framework/mechanics/physics';
import { InputManager } from '@/lib/game-framework/mechanics/input';
import { Rendering } from '@/lib/game-framework/mechanics/rendering';
import { ScoreManager } from '@/lib/game-framework/mechanics/scoring';

interface Crystal {
  x: number;
  y: number;
  width: number;
  height: number;
  collected: boolean;
}

interface Drone {
  x: number;
  y: number;
  width: number;
  height: number;
  velocityX: number;
}

export class AlienUnicornGame extends GameEngine {
  private player = { x: 100, y: 270, width: 50, height: 50 };
  private velocity = { x: 0, y: 0 };
  private input = new InputManager();
  private score = new ScoreManager('alien-unicorn-alliance');
  
  private crystals: Crystal[] = [];
  private drones: Drone[] = [];
  
  private readonly SPEED = 300;
  private readonly GRAVITY = 600;
  private readonly JUMP_POWER = 400;
  private readonly CANVAS_WIDTH = 960;
  private readonly CANVAS_HEIGHT = 540;
  
  private onGround = false;
  private shields = 3;
  private gameOver = false;

  init(): void {
    this.spawnCrystals();
    this.spawnDrones();
  }

  private spawnCrystals(): void {
    for (let i = 0; i < 5; i++) {
      this.crystals.push({
        x: Math.random() * (this.CANVAS_WIDTH - 30) + 30,
        y: Math.random() * (this.CANVAS_HEIGHT - 100) + 50,
        width: 20,
        height: 20,
        collected: false
      });
    }
  }

  private spawnDrones(): void {
    for (let i = 0; i < 3; i++) {
      this.drones.push({
        x: Math.random() * this.CANVAS_WIDTH,
        y: Math.random() * (this.CANVAS_HEIGHT - 100) + 50,
        width: 40,
        height: 40,
        velocityX: (Math.random() > 0.5 ? 1 : -1) * 100
      });
    }
  }

  update(dt: number): void {
    if (this.gameOver) return;

    if (this.input.isPressed('left')) {
      this.velocity.x = -this.SPEED;
    } else if (this.input.isPressed('right')) {
      this.velocity.x = this.SPEED;
    } else {
      this.velocity.x = 0;
    }

    if (this.input.isPressed('space') && this.onGround) {
      this.velocity.y = -this.JUMP_POWER;
      this.onGround = false;
    }

    Physics.applyGravity(this.velocity, this.GRAVITY, dt);
    Physics.applyVelocity(this.player, this.velocity, dt);

    this.player.x = Physics.clamp(this.player.x, 0, this.CANVAS_WIDTH - this.player.width);
    
    if (this.player.y + this.player.height >= this.CANVAS_HEIGHT) {
      this.player.y = this.CANVAS_HEIGHT - this.player.height;
      this.velocity.y = 0;
      this.onGround = true;
    }

    this.crystals.forEach(crystal => {
      if (!crystal.collected && Physics.checkCollision(this.player, crystal)) {
        crystal.collected = true;
        this.score.addPoints(100);
        this.score.incrementStreak();
      }
    });

    this.drones.forEach(drone => {
      drone.x += drone.velocityX * dt;
      
      if (drone.x <= 0 || drone.x + drone.width >= this.CANVAS_WIDTH) {
        drone.velocityX *= -1;
      }

      if (Physics.checkCollision(this.player, drone)) {
        this.shields--;
        this.score.resetStreak();
        drone.x = Math.random() * this.CANVAS_WIDTH;
        
        if (this.shields <= 0) {
          this.gameOver = true;
          this.score.saveHighScore('alien-unicorn-alliance');
        }
      }
    });
  }

  render(ctx: CanvasRenderingContext2D): void {
    Rendering.clearCanvas(ctx, '#1a0033');

    Rendering.drawRect(ctx, this.player.x, this.player.y, this.player.width, this.player.height, '#ff00ff');

    this.crystals.forEach(crystal => {
      if (!crystal.collected) {
        Rendering.drawCircle(ctx, crystal.x + crystal.width / 2, crystal.y + crystal.height / 2, crystal.width / 2, '#00ffff');
      }
    });

    this.drones.forEach(drone => {
      Rendering.drawRect(ctx, drone.x, drone.y, drone.width, drone.height, '#ff0000');
    });

    Rendering.drawText(ctx, `Score: ${this.score.getScore()}`, 20, 30, '#ffffff', 24);
    Rendering.drawText(ctx, `Shields: ${this.shields}`, 20, 60, '#ffffff', 24);
    Rendering.drawText(ctx, `Streak: ${this.score.getStreak()}`, 20, 90, '#00ffff', 24);

    if (this.gameOver) {
      Rendering.drawText(ctx, 'GAME OVER', this.CANVAS_WIDTH / 2 - 100, this.CANVAS_HEIGHT / 2, '#ff0000', 48);
      Rendering.drawText(ctx, `Final Score: ${this.score.getScore()}`, this.CANVAS_WIDTH / 2 - 120, this.CANVAS_HEIGHT / 2 + 50, '#ffffff', 32);
    }
  }

  cleanup(): void {
    this.input.cleanup();
  }
}
