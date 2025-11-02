export class InputManager {
  private keys: Set<string> = new Set();
  private touchActions: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown);
      window.addEventListener('keyup', this.handleKeyUp);
    }
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.key.toLowerCase());
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.add('up');
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.add('down');
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.add('left');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.add('right');
    if (e.key === ' ') this.keys.add('space');
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') this.keys.delete('up');
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') this.keys.delete('down');
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.delete('left');
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.delete('right');
    if (e.key === ' ') this.keys.delete('space');
  };

  isPressed(action: string): boolean {
    return this.keys.has(action) || this.touchActions.has(action);
  }

  addTouchAction(action: string): void {
    this.touchActions.add(action);
  }

  removeTouchAction(action: string): void {
    this.touchActions.delete(action);
  }

  clearTouchActions(): void {
    this.touchActions.clear();
  }

  cleanup(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.handleKeyDown);
      window.removeEventListener('keyup', this.handleKeyUp);
    }
    this.keys.clear();
    this.touchActions.clear();
  }
}
