/**
 * Sistema de partículas con object pooling
 * Efectos visuales optimizados para móvil
 */

import { CONFIG } from '../config/constants.js';

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.type = 'circle';
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0;
    this.color = '#fff';
    this.size = 4;
    this.maxSize = 40;
    this.life = 0;
    this.maxLife = 0;
    this.active = false;
  }

  get alpha() {
    return Math.max(0, this.life / this.maxLife);
  }
}

export class ParticleSystem {
  constructor(maxParticles = CONFIG.MAX_PARTICLES) {
    this.maxParticles = maxParticles;
    this.pool = [];
    this.active = [];
    
    // Pre-crear pool
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push(new Particle());
    }
  }

  spawn(options) {
    if (this.active.length >= this.maxParticles) return;

    const particle = this.pool.pop() || new Particle();
    particle.reset();
    
    particle.type = options.type || 'circle';
    particle.x = options.x || 0;
    particle.y = options.y || 0;
    particle.vx = options.vx || 0;
    particle.vy = options.vy || 0;
    particle.gravity = options.gravity || 0;
    particle.color = options.color || '#fff';
    particle.size = options.size || 4;
    particle.maxSize = options.maxSize || 40;
    particle.life = options.life || 0.6;
    particle.maxLife = options.life || 0.6;
    particle.active = true;

    this.active.push(particle);
  }

  update(deltaTime) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      
      p.life -= deltaTime;
      
      if (p.life <= 0) {
        this.pool.push(this.active.splice(i, 1)[0]);
        continue;
      }

      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += p.gravity * deltaTime;
    }
  }

  draw(ctx) {
    for (const p of this.active) {
      ctx.globalAlpha = p.alpha;
      
      switch (p.type) {
        case 'circle':
          this.drawCircle(ctx, p);
          break;
        case 'ring':
          this.drawRing(ctx, p);
          break;
        case 'line':
          this.drawLine(ctx, p);
          break;
      }
    }
    
    ctx.globalAlpha = 1;
  }

  drawCircle(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.alpha, 0, Math.PI * 2);
    ctx.fill();
  }

  drawRing(ctx, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const radius = p.maxSize * (1 - p.alpha);
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  drawLine(ctx, p) {
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.size * p.alpha;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + p.vx * 0.1, p.y + p.vy * 0.1);
    ctx.stroke();
  }

  clear() {
    while (this.active.length > 0) {
      this.pool.push(this.active.pop());
    }
  }

  get count() {
    return this.active.length;
  }

  // ═══════════════════════════════════════════════════════════
  // EFECTOS PRESETS
  // ═══════════════════════════════════════════════════════════

  jab(x, y, color) {
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 110;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life: 0.28,
      });
    }
    this.spawn({
      type: 'ring',
      x, y,
      color,
      maxSize: 32,
      life: 0.22,
    });
  }

  smash(x, y, color) {
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 90 + Math.random() * 240;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 3 + Math.random() * 5,
        life: 0.55 + Math.random() * 0.35,
        gravity: 60,
      });
    }
    this.spawn({
      type: 'ring',
      x, y,
      color,
      maxSize: 65,
      life: 0.38,
    });
    this.spawn({
      type: 'ring',
      x, y,
      color: '#fff',
      maxSize: 45,
      life: 0.28,
    });
  }

  parry(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const speed = 80 + Math.random() * 80;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#00f5ff',
        size: 3 + Math.random() * 4,
        life: 0.48,
      });
    }
    this.spawn({
      type: 'ring',
      x, y,
      color: '#00f5ff',
      maxSize: 55,
      life: 0.38,
    });
  }

  death(x, y, color) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4 + Math.random() * 6,
        life: 0.8 + Math.random() * 0.5,
        gravity: 70,
      });
    }
    this.spawn({
      type: 'ring',
      x, y,
      color,
      maxSize: 85,
      life: 0.45,
    });
  }

  platformBreak(x, y) {
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      this.spawn({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: '#1a2040',
        size: 5 + Math.random() * 8,
        life: 1.1,
        gravity: 50,
      });
    }
  }
}
