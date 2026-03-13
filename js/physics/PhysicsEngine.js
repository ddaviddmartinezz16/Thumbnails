/**
 * Motor de física simplificado
 * Colisiones jugador-plataforma y límites de arena
 */

import { CONFIG } from '../config/constants.js';

export class PhysicsEngine {
  constructor() {
    this.arenaRadius = 0;
    this.centerX = 0;
    this.centerY = 0;
  }

  setArena(centerX, centerY, radius) {
    this.centerX = centerX;
    this.centerY = centerY;
    this.arenaRadius = radius;
  }

  /**
   * Actualiza física de un jugador
   */
  updatePlayer(player, platforms, deltaTime) {
    if (player.state === 'dead') return;

    // Aplicar timers
    player.updateTimers(deltaTime);

    // Estados especiales
    if (player.isStunned || player.isParrying) {
      player.applyPhysics(deltaTime);
      this.checkArenaBounds(player, deltaTime);
      return;
    }

    // Física normal
    player.applyPhysics(deltaTime);
    
    // Colisiones con plataformas
    this.handlePlatformCollisions(player, platforms);
    
    // Límites de arena
    this.checkArenaBounds(player, deltaTime);
  }

  handlePlatformCollisions(player, platforms) {
    for (const platform of platforms) {
      if (!platform.active) continue;

      const dx = player.x - platform.x;
      const dy = player.y - platform.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Distancia máxima permitida (dentro de la plataforma)
      const maxAllowed = platform.radius - CONFIG.PLAYER_RADIUS;
      if (maxAllowed <= 0) continue;

      if (distance > maxAllowed) {
        // Empujar hacia el centro de la plataforma
        const nx = dx / distance;
        const ny = dy / distance;
        
        player.x = platform.x + nx * maxAllowed;
        player.y = platform.y + ny * maxAllowed;
        
        // Cancelar velocidad hacia afuera
        const dot = player.vx * nx + player.vy * ny;
        if (dot > 0) {
          player.vx -= dot * nx;
          player.vy -= dot * ny;
        }
      }
    }
  }

  checkArenaBounds(player, deltaTime) {
    if (player.falling) return;

    const dx = player.x - this.centerX;
    const dy = player.y - this.centerY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

    // Fuera de la arena = caída
    if (distanceFromCenter > this.arenaRadius - CONFIG.PLAYER_RADIUS) {
      player.startFalling();
    }
  }

  /**
   * Verifica si una posición está dentro de la arena
   */
  isInArena(x, y) {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    return Math.sqrt(dx * dx + dy * dy) <= this.arenaRadius - CONFIG.PLAYER_RADIUS;
  }

  /**
   * Encuentra plataforma más cercana
   */
  findNearestPlatform(x, y, platforms) {
    let nearest = null;
    let minDist = Infinity;
    
    for (const platform of platforms) {
      if (!platform.active) continue;
      
      const dx = x - platform.x;
      const dy = y - platform.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < minDist) {
        minDist = dist;
        nearest = platform;
      }
    }
    
    return nearest;
  }
}
