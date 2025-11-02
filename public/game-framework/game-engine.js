class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.isPaused = false;
    
    this.updateCallback = null;
    this.renderCallback = null;
    
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedTimeStep = 1 / 60;
    
    this.animationFrameId = null;
  }
  
  onUpdate(callback) {
    this.updateCallback = callback;
  }
  
  onRender(callback) {
    this.renderCallback = callback;
  }
  
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
    
    this._gameLoop();
  }
  
  pause() {
    this.isPaused = true;
  }
  
  resume() {
    if (!this.isRunning) return;
    
    this.isPaused = false;
    this.lastTime = performance.now() / 1000;
    this.accumulator = 0;
  }
  
  stop() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
  
  _gameLoop() {
    if (!this.isRunning) return;
    
    const currentTime = performance.now() / 1000;
    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    if (frameTime > 0.25) {
      frameTime = 0.25;
    }
    
    this.accumulator += frameTime;
    
    if (!this.isPaused) {
      while (this.accumulator >= this.fixedTimeStep) {
        if (this.updateCallback) {
          this.updateCallback(this.fixedTimeStep);
        }
        this.accumulator -= this.fixedTimeStep;
      }
    }
    
    if (this.renderCallback) {
      this.renderCallback(this.ctx);
    }
    
    this.animationFrameId = requestAnimationFrame(() => this._gameLoop());
  }
}
