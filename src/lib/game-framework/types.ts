export interface Vector2D {
  x: number;
  y: number;
}

export interface GameObject {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface GameMetadata {
  title: string;
  description: string;
  instructions: string[];
  controls: {
    keyboard: string[];
    touch?: string;
  };
  thumbnailUrl?: string;
}

export interface TouchButton {
  id: string;
  label: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  action: string;
}
