import { Vector2D, GameObject } from '../types';

export class Physics {
  static applyGravity(velocity: Vector2D, gravity: number, dt: number): void {
    velocity.y += gravity * dt;
  }

  static applyVelocity(position: Vector2D, velocity: Vector2D, dt: number): void {
    position.x += velocity.x * dt;
    position.y += velocity.y * dt;
  }

  static checkCollision(
    obj1: GameObject,
    obj2: GameObject,
    forgiveness: number = 0.7
  ): boolean {
    const hitbox1 = {
      x: obj1.x + obj1.width * (1 - forgiveness) / 2,
      y: obj1.y + obj1.height * (1 - forgiveness) / 2,
      width: obj1.width * forgiveness,
      height: obj1.height * forgiveness
    };

    const hitbox2 = {
      x: obj2.x + obj2.width * (1 - forgiveness) / 2,
      y: obj2.y + obj2.height * (1 - forgiveness) / 2,
      width: obj2.width * forgiveness,
      height: obj2.height * forgiveness
    };

    return (
      hitbox1.x < hitbox2.x + hitbox2.width &&
      hitbox1.x + hitbox1.width > hitbox2.x &&
      hitbox1.y < hitbox2.y + hitbox2.height &&
      hitbox1.y + hitbox1.height > hitbox2.y
    );
  }

  static clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  static lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  static distance(x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalize(vector: Vector2D): Vector2D {
    const magnitude = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    if (magnitude === 0) return { x: 0, y: 0 };
    return {
      x: vector.x / magnitude,
      y: vector.y / magnitude
    };
  }

  static bounceOffWalls(
    obj: GameObject,
    velocity: Vector2D,
    canvasWidth: number,
    canvasHeight: number,
    restitution: number = 0.8
  ): void {
    if (obj.x <= 0) {
      obj.x = 0;
      velocity.x = Math.abs(velocity.x) * restitution;
    } else if (obj.x + obj.width >= canvasWidth) {
      obj.x = canvasWidth - obj.width;
      velocity.x = -Math.abs(velocity.x) * restitution;
    }

    if (obj.y <= 0) {
      obj.y = 0;
      velocity.y = Math.abs(velocity.y) * restitution;
    } else if (obj.y + obj.height >= canvasHeight) {
      obj.y = canvasHeight - obj.height;
      velocity.y = -Math.abs(velocity.y) * restitution;
    }
  }
}
