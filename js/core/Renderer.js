/**
 * Sistema de renderizado Canvas
 * Separa dibujo de lógica de juego
 */

import { CONFIG, PLAYER_STATES } from '../config/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    return {
      width: this.canvas.width,
      height: this.canvas.height
    };
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawBackground(width, height) {
    const gradient = this.ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, '#080c1e');
    gradient.addColorStop(1, '#02040a');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  drawArena(centerX, centerY, radius) {
    this.ctx.save();
    
    // Vacío exterior
    this.ctx.beginPath();
    this.ctx.rect(centerX - radius * 2, centerY - radius * 2, radius * 4, radius * 4);
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true);
    this.ctx.fillStyle = 'rgba(0,0,0,0.65)';
    this.ctx.fill();
    
    // Glow sutil
    const glow = this.ctx.createRadialGradient(
      centerX, centerY, radius * 0.55,
      centerX, centerY, radius
    );
    glow.addColorStop(0, 'rgba(0,50,80,0)');
    glow.addColorStop(1, 'rgba(0,245,255,0.055)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Borde punteado
    this.ctx.strokeStyle = 'rgba(0,245,255,0.22)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([7, 6]);
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    this.ctx.restore();
  }

  drawPlatforms(platforms, time) {
    for (const platform of platforms) {
      if (!platform.active && !platform.warning) continue;
      
      this.drawPlatform(platform, time);
    }
  }

  drawPlatform(platform, time) {
    const isWarning = platform.isDangerous;
    const pulse = isWarning ? Math.sin(time / 115) * 0.5 + 0.5 : 1;
    
    this.ctx.save();
    
    if (isWarning) {
      this.ctx.globalAlpha = 0.35 + pulse * 0.5;
    }
    
    // Gradiente de fondo
    const grad = this.ctx.createRadialGradient(
      platform.x, platform.y - platform.radius * 0.25,
      platform.radius * 0.05,
      platform.x, platform.y,
      platform.radius
    );
    
    if (isWarning) {
      grad.addColorStop(0, '#3a1010');
      grad.addColorStop(1, '#0e0404');
    } else {
      grad.addColorStop(0, '#1e2545');
      grad.addColorStop(1, '#080e20');
    }
    
    this.ctx.fillStyle = grad;
    this.ctx.beginPath();
    this.ctx.arc(platform.x, platform.y, platform.radius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Borde
    this.ctx.strokeStyle = isWarning
      ? `rgba(255,${50 + pulse * 100 | 0},50,${0.6 + pulse * 0.4})`
      : 'rgba(30,50,100,0.75)';
    this.ctx.lineWidth = isWarning ? 2.5 : 1.5;
    this.ctx.beginPath();
    this.ctx.arc(platform.x, platform.y, platform.radius, 0, Math.PI * 2);
    this.ctx.stroke();
    
    // Brillo
    this.ctx.strokeStyle = isWarning 
      ? 'rgba(255,100,100,0.25)' 
      : 'rgba(100,150,255,0.14)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.arc(
      platform.x, 
      platform.y - platform.radius * 0.18,
      platform.radius * 0.7,
      Math.PI * 1.1, 
      Math.PI * 1.9
    );
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawPlayers(players, time) {
    for (const player of players) {
      this.drawPlayer(player, time);
    }
  }

  drawPlayer(player, time) {
    if (player.state === PLAYER_STATES.DEAD) return;

    // Trail de dash
    if (player.dashTrail) {
      this.drawDashTrail(player);
    }

    const alpha = player.alpha * (player.isStunned ? 0.55 : 1);
    this.ctx.globalAlpha = alpha;

    // Glow exterior
    const glowRadius = CONFIG.PLAYER_RADIUS * (1.75 + Math.sin(time / 280) * 0.12);
    const glow = this.ctx.createRadialGradient(
      player.x, player.y,
      CONFIG.PLAYER_RADIUS * 0.4,
      player.x, player.y,
      glowRadius
    );
    glow.addColorStop(0, player.color + '50');
    glow.addColorStop(1, 'transparent');
    
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, glowRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Cuerpo
    this.ctx.fillStyle = player.color;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
    this.ctx.fill();

    // Borde
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(player.x, player.y, CONFIG.PLAYER_RADIUS, 0, Math.PI * 2);
    this.ctx.stroke();

    // Brillo interno
    this.ctx.globalAlpha = alpha * 0.18;
    this.ctx.fillStyle = '#fff';
    this.ctx.beginPath();
    this.ctx.arc(
      player.x - CONFIG.PLAYER_RADIUS * 0.25,
      player.y - CONFIG.PLAYER_RADIUS * 0.3,
      CONFIG.PLAYER_RADIUS * 0.44,
      0, Math.PI * 2
    );
    this.ctx.fill();

    this.ctx.globalAlpha = alpha;

    // Efectos de estado
    if (player.isStunned) {
      this.drawStunEffect(player, time);
    } else if (player.isParrying) {
      this.drawParryEffect(player, time);
    }

    // Indicador de carga
    if (player.charging && player.chargeAmount > 0) {
      this.drawChargeIndicator(player);
    }

    // Label
    this.ctx.globalAlpha = alpha * 0.78;
    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 10px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      player.isLocal ? 'YOU' : player.name,
      player.x,
      player.y - CONFIG.PLAYER_RADIUS - 8
    );
    this.ctx.textAlign = 'left';
    this.ctx.globalAlpha = 1;
  }

  drawDashTrail(player) {
    for (let i = 0; i < player.dashTrail.length; i++) {
      const point = player.dashTrail[i];
      const alpha = (i / player.dashTrail.length) * 0.28 * (player.alpha || 1);
      
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = player.color;
      this.ctx.beginPath();
      this.ctx.arc(point.x, point.y, CONFIG.PLAYER_RADIUS * 0.85, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawStunEffect(player, time) {
    this.ctx.strokeStyle = '#ffffc0';
    this.ctx.lineWidth = 2.5;
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    this.ctx.rotate(time / 140);
    
    this.ctx.beginPath();
    this.ctx.arc(0, 0, CONFIG.PLAYER_RADIUS + 9, 0, Math.PI * 1.4);
    this.ctx.stroke();
    
    this.ctx.rotate(Math.PI * 0.8);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, CONFIG.PLAYER_RADIUS + 9, 0, Math.PI * 0.8);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawParryEffect(player, time) {
    const alpha = Math.sin(time / 55) * 0.4 + 0.6;
    this.ctx.strokeStyle = `rgba(100,220,255,${alpha})`;
    this.ctx.lineWidth = 3;
    this.ctx.save();
    this.ctx.translate(player.x, player.y);
    
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + time / 1100;
      const r = CONFIG.PLAYER_RADIUS + 12;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      i === 0 ? this.ctx.moveTo(x, y) : this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  drawChargeIndicator(player) {
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 4;
    this.ctx.shadowColor = player.color;
    this.ctx.shadowBlur = 10;
    
    this.ctx.beginPath();
    this.ctx.arc(
      player.x, player.y,
      CONFIG.PLAYER_RADIUS + 16,
      -Math.PI / 2,
      -Math.PI / 2 + player.chargeAmount * Math.PI * 2
    );
    this.ctx.stroke();
    
    this.ctx.shadowBlur = 0;
  }

  drawJoystick(joystick) {
    if (!joystick.active) return;

    const stickX = joystick.visualX;
    const stickY = joystick.visualY;

    // Base
    this.ctx.globalAlpha = 0.38;
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([3, 4]);
    this.ctx.beginPath();
    this.ctx.arc(joystick.centerX, joystick.centerY, 40, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    // Stick
    this.ctx.globalAlpha = 0.82;
    this.ctx.fillStyle = 'rgba(255,255,255,0.18)';
    this.ctx.beginPath();
    this.ctx.arc(stickX, stickY, 21, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#fff';
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    this.ctx.globalAlpha = 1;
  }

  drawParticleSystem(particleSystem) {
    particleSystem.draw(this.ctx);
  }
}
