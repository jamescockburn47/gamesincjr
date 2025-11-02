export abstract class GameEngine {
  private lastTimestamp: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_TIMESTEP: number = 1000 / 60;
  
  private animationFrameId: number | null = null;
  public paused: boolean = false;

  abstract init(): void;
  abstract update(dt: number): void;
  abstract render(ctx: CanvasRenderingContext2D): void;
  abstract cleanup(): void;

  start(canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }
    this.init();
    this.lastTimestamp = performance.now();
    this.loop(this.lastTimestamp, ctx);
  }

  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.cleanup();
  }

  private loop(timestamp: number, ctx: CanvasRenderingContext2D): void {
    if (this.paused) {
      this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts, ctx));
      return;
    }

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;
    this.accumulator += deltaTime;

    while (this.accumulator >= this.FIXED_TIMESTEP) {
      this.update(this.FIXED_TIMESTEP / 1000);
      this.accumulator -= this.FIXED_TIMESTEP;
    }

    this.render(ctx);
    this.animationFrameId = requestAnimationFrame((ts) => this.loop(ts, ctx));
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    this.paused = false;
  }
}
