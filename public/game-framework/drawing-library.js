const DrawingLibrary = {
  createParticles(x, y, count, config = {}) {
    const defaults = {
      colors: ['#ff0000', '#ff8800', '#ffff00'],
      minSpeed: 50,
      maxSpeed: 200,
      minSize: 2,
      maxSize: 6,
      lifetime: 1.0,
      gravity: 0
    };
    
    const settings = { ...defaults, ...config };
    const particles = [];
    
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = GameUtils.randomRange(settings.minSpeed, settings.maxSpeed);
      
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: GameUtils.randomRange(settings.minSize, settings.maxSize),
        color: GameUtils.randomChoice(settings.colors),
        lifetime: settings.lifetime,
        age: 0,
        gravity: settings.gravity,
        
        update(dt) {
          this.x += this.vx * dt;
          this.y += this.vy * dt;
          this.vy += this.gravity * dt;
          this.age += dt;
        },
        
        draw(ctx) {
          const alpha = 1 - (this.age / this.lifetime);
          ctx.globalAlpha = alpha;
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        },
        
        isDead() {
          return this.age >= this.lifetime;
        }
      });
    }
    
    return particles;
  },
  
  createBackground(config = {}) {
    const defaults = {
      type: 'space',
      colors: ['#000033', '#000066'],
      scrollSpeed: 20,
      starCount: 100
    };
    
    const settings = { ...defaults, ...config };
    const elements = [];
    
    if (settings.type === 'space') {
      for (let i = 0; i < settings.starCount; i++) {
        elements.push({
          x: Math.random() * 800,
          y: Math.random() * 600,
          size: Math.random() * 2 + 1,
          speed: Math.random() * settings.scrollSpeed + 10,
          brightness: Math.random() * 0.5 + 0.5
        });
      }
    } else if (settings.type === 'forest') {
      for (let i = 0; i < 20; i++) {
        elements.push({
          x: Math.random() * 800,
          y: Math.random() * 600,
          size: Math.random() * 30 + 20,
          speed: Math.random() * settings.scrollSpeed + 5,
          shade: Math.random() * 0.3
        });
      }
    } else if (settings.type === 'ocean') {
      for (let i = 0; i < 10; i++) {
        elements.push({
          x: 0,
          y: i * 60,
          amplitude: Math.random() * 20 + 10,
          frequency: Math.random() * 0.02 + 0.01,
          speed: settings.scrollSpeed,
          offset: Math.random() * Math.PI * 2
        });
      }
    }
    
    return {
      elements: elements,
      scrollOffset: 0,
      
      update(dt) {
        this.scrollOffset += settings.scrollSpeed * dt;
        
        if (settings.type === 'space') {
          this.elements.forEach(star => {
            star.y += star.speed * dt;
            if (star.y > 600) {
              star.y = 0;
              star.x = Math.random() * 800;
            }
          });
        } else if (settings.type === 'forest') {
          this.elements.forEach(tree => {
            tree.y += tree.speed * dt;
            if (tree.y > 600) {
              tree.y = -tree.size;
              tree.x = Math.random() * 800;
            }
          });
        }
      },
      
      draw(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, settings.colors[0]);
        gradient.addColorStop(1, settings.colors[1]);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);
        
        if (settings.type === 'space') {
          this.elements.forEach(star => {
            ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
            ctx.fillRect(star.x, star.y, star.size, star.size);
          });
        } else if (settings.type === 'forest') {
          this.elements.forEach(tree => {
            const shade = tree.shade;
            ctx.fillStyle = `rgba(0, ${100 + shade * 100}, 0, 0.6)`;
            ctx.beginPath();
            ctx.moveTo(tree.x, tree.y + tree.size);
            ctx.lineTo(tree.x - tree.size / 3, tree.y + tree.size);
            ctx.lineTo(tree.x, tree.y);
            ctx.lineTo(tree.x + tree.size / 3, tree.y + tree.size);
            ctx.fill();
          });
        } else if (settings.type === 'ocean') {
          this.elements.forEach(wave => {
            ctx.strokeStyle = `rgba(100, 200, 255, 0.3)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            for (let x = 0; x < 800; x += 5) {
              const y = wave.y + Math.sin(x * wave.frequency + this.scrollOffset * 0.1 + wave.offset) * wave.amplitude;
              if (x === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            }
            ctx.stroke();
          });
        }
      }
    };
  },
  
  createRadialGradient(ctx, x, y, innerRadius, outerRadius, colors) {
    const gradient = ctx.createRadialGradient(x, y, innerRadius, x, y, outerRadius);
    colors.forEach((color, i) => {
      gradient.addColorStop(i / (colors.length - 1), color);
    });
    return gradient;
  },
  
  drawWithShadow(ctx, drawFunc, offsetX = 2, offsetY = 2, blur = 4, color = 'rgba(0,0,0,0.5)') {
    ctx.save();
    ctx.shadowOffsetX = offsetX;
    ctx.shadowOffsetY = offsetY;
    ctx.shadowBlur = blur;
    ctx.shadowColor = color;
    drawFunc(ctx);
    ctx.restore();
  },
  
  drawWithGlow(ctx, drawFunc, glowColor = '#ffffff', glowSize = 10) {
    ctx.save();
    ctx.shadowBlur = glowSize;
    ctx.shadowColor = glowColor;
    drawFunc(ctx);
    ctx.restore();
  },
  
  drawText(ctx, text, x, y, config = {}) {
    const defaults = {
      font: '24px Arial',
      color: '#ffffff',
      align: 'center',
      baseline: 'middle',
      shadow: false,
      glow: false
    };
    
    const settings = { ...defaults, ...config };
    
    ctx.save();
    ctx.font = settings.font;
    ctx.fillStyle = settings.color;
    ctx.textAlign = settings.align;
    ctx.textBaseline = settings.baseline;
    
    if (settings.shadow) {
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
    }
    
    if (settings.glow) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = settings.color;
    }
    
    ctx.fillText(text, x, y);
    ctx.restore();
  }
};
