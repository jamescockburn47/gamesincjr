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
    
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/21c7b4be-62c9-4a72-9713-3ad5f82a3a6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game-engine.js:constructor',message:'GameEngine instantiated - framework IS being used',data:{page:location.pathname},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
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
    
    // #region agent log
    if (!this._logFrame) this._logFrame = 0;
    this._logFrame++;
    if (this._logFrame === 60) {
      const fps = Math.round(1 / frameTime);
      fetch('http://127.0.0.1:7245/ingest/21c7b4be-62c9-4a72-9713-3ad5f82a3a6e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'game-engine.js:_gameLoop',message:'FPS at frame 60',data:{fps,frameTime:frameTime.toFixed(4),fixedTimeStep:this.fixedTimeStep,page:location.pathname},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    }
    // #endregion
    
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
