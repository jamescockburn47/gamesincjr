export class Rendering {
  static clearCanvas(ctx: CanvasRenderingContext2D, color: string = '#000000'): void {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  }

  static drawRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, width, height);
  }

  static drawCircle(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  static drawText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string = '#ffffff',
    fontSize: number = 20,
    fontFamily: string = 'Arial'
  ): void {
    ctx.fillStyle = color;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillText(text, x, y);
  }

  static drawImage(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width?: number,
    height?: number
  ): void {
    if (width !== undefined && height !== undefined) {
      ctx.drawImage(image, x, y, width, height);
    } else {
      ctx.drawImage(image, x, y);
    }
  }
}
