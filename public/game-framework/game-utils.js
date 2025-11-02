class InputManager {
  constructor() {
    this.keys = {};
    this.actions = {
      up: ['ArrowUp', 'KeyW'],
      down: ['ArrowDown', 'KeyS'],
      left: ['ArrowLeft', 'KeyA'],
      right: ['ArrowRight', 'KeyD'],
      space: ['Space']
    };
    this.touchActions = new Set();
    
    this._setupKeyboardListeners();
  }
  
  _setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    
    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }
  
  isPressed(action) {
    if (this.touchActions.has(action)) {
      return true;
    }
    
    const keyCodes = this.actions[action];
    if (!keyCodes) return false;
    
    return keyCodes.some(code => this.keys[code]);
  }
  
  addTouch(action) {
    this.touchActions.add(action);
  }
  
  removeTouch(action) {
    this.touchActions.delete(action);
  }
  
  clearTouch() {
    this.touchActions.clear();
  }
}

const GameUtils = {
  applyGravity(object, gravityConstant, dt) {
    if (!object.vy) object.vy = 0;
    object.vy += gravityConstant * dt;
  },
  
  applyVelocity(object, dt) {
    if (object.vx !== undefined) {
      object.x += object.vx * dt;
    }
    if (object.vy !== undefined) {
      object.y += object.vy * dt;
    }
  },
  
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },
  
  checkCollision(obj1, obj2, forgiveness = 0.7) {
    const margin1X = obj1.width * (1 - forgiveness) / 2;
    const margin1Y = obj1.height * (1 - forgiveness) / 2;
    const margin2X = obj2.width * (1 - forgiveness) / 2;
    const margin2Y = obj2.height * (1 - forgiveness) / 2;
    
    const box1 = {
      left: obj1.x + margin1X,
      right: obj1.x + obj1.width - margin1X,
      top: obj1.y + margin1Y,
      bottom: obj1.y + obj1.height - margin1Y
    };
    
    const box2 = {
      left: obj2.x + margin2X,
      right: obj2.x + obj2.width - margin2X,
      top: obj2.y + margin2Y,
      bottom: obj2.y + obj2.height - margin2Y
    };
    
    return box1.left < box2.right &&
           box1.right > box2.left &&
           box1.top < box2.bottom &&
           box1.bottom > box2.top;
  },
  
  randomRange(min, max) {
    return Math.random() * (max - min) + min;
  },
  
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
  
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },
  
  lerp(start, end, t) {
    return start + (end - start) * t;
  },
  
  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }
};
