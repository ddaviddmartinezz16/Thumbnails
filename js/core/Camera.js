/**
 * Sistema de cámara dinámica
 * Sigue a los jugadores vivos con zoom adaptativo
 */

import { CONFIG } from '../config/constants.js';

export class Camera {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.zoom = 1;
    this.targetZoom = 1;
    this.shake = 0;
  }

  reset(centerX, centerY) {
    this.x = centerX;
    this.y = centerY;
    this.targetX = centerX;
    this.targetY = centerY;
    this.zoom = 1;
    this.targetZoom = 1;
    this.shake = 0;
  }

  /**
   * Actualiza posición y zoom basado en jugadores vivos
   */
  update(players, screenWidth, screenHeight) {
    const alivePlayers = players.filter(p => p.state !== 'dead');
    if (alivePlayers.length === 0) return;

    // Centroid de jugadores vivos
    let sumX = 0, sumY = 0;
    for (const player of alivePlayers) {
      sumX += player.x;
      sumY += player.y;
    }
    this.targetX = sumX / alivePlayers.length;
    this.targetY = sumY / alivePlayers.length;

    // Zoom basado en dispersión
    let maxSpread = 60;
    for (const player of alivePlayers) {
      const spreadX = Math.abs(player.x - this.targetX);
      const spreadY = Math.abs(player.y - this.targetY);
      maxSpread = Math.max(maxSpread, spreadX, spreadY);
    }

    const minDimension = Math.min(screenWidth, screenHeight);
    this.targetZoom = Math.max(
      0.65,
      Math.min(1.45, minDimension * 0.32 / maxSpread)
    );

    // Suavizado
    this.x += (this.targetX - this.x) * CONFIG.CAMERA_SMOOTHING;
    this.y += (this.targetY - this.y) * CONFIG.CAMERA_SMOOTHING;
    this.zoom += (this.targetZoom - this.zoom) * CONFIG.CAMERA_ZOOM_SMOOTHING;
    this.shake *= 0.87;
  }

  /**
   * Aplica transformación al contexto canvas
   */
  apply(ctx, screenWidth, screenHeight) {
    const shakeX = (Math.random() - 0.5) * this.shake * 2;
    const shakeY = (Math.random() - 0.5) * this.shake * 2;

    ctx.save();
    ctx.translate(screenWidth / 2 + shakeX, screenHeight / 2 + shakeY);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  restore(ctx) {
    ctx.restore();
  }

  /**
   * Añade vibración de cámara
   */
  addShake(amount) {
    this.shake = Math.max(this.shake, amount);
  }
}
