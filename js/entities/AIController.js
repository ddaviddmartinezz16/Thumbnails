/**
 * Controlador de IA para jugadores CPU
 * Comportamiento táctico simple pero efectivo
 */

import { CONFIG } from '../config/constants.js';

export class AIController {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty;
    this.attackRange = 85;
    this.retreatRange = 55;
    this.chaseRange = 90;
    this.parryChance = 0.004;
    this.attackChance = 0.02;
    this.smashChance = 0.007;
  }

  update(ai, target, arenaRadius, arenaCenterX, arenaCenterY, deltaTime) {
    if (!ai.isAlive || !target.isAlive) return;
    if (!ai.canMove) return;

    const dx = target.x - ai.x;
    const dy = target.y - ai.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Dirección normalizada hacia objetivo
    const dirX = distance > 0 ? dx / distance : 0;
    const dirY = distance > 0 ? dy / distance : 0;

    // Comportamiento de movimiento
    this.updateMovement(ai, target, distance, dirX, dirY, deltaTime);
    
    // Comportamiento de ataque
    this.updateCombat(ai, target, distance, dirX, dirY, deltaTime);
    
    // Evitar caerse
    this.avoidEdge(ai, arenaCenterX, arenaCenterY, arenaRadius, deltaTime);
    
    // Actualizar cooldowns
    this.updateCooldowns(ai, deltaTime);
  }

  updateMovement(ai, target, distance, dirX, dirY, deltaTime) {
    if (distance > this.chaseRange) {
      // Perseguir
      ai.vx += dirX * CONFIG.MOVE_FORCE * 0.68 * deltaTime;
      ai.vy += dirY * CONFIG.MOVE_FORCE * 0.68 * deltaTime;
    } else if (distance < this.retreatRange) {
      // Retirarse para distancia óptima
      ai.vx -= dirX * CONFIG.MOVE_FORCE * 0.4 * deltaTime;
      ai.vy -= dirY * CONFIG.MOVE_FORCE * 0.4 * deltaTime;
    }
    // En rango óptimo: quedarse/moverse lateralmente
  }

  updateCombat(ai, target, distance, dirX, dirY, deltaTime) {
    // Jab rápido
    if (distance < this.attackRange && Math.random() < this.attackChance) {
      this.executeJab(ai, dirX, dirY);
    }
    
    // Smash cargado
    if (distance < this.attackRange + 15 && 
        ai.smashCooldown <= 0 && 
        Math.random() < this.smashChance) {
      const charge = 0.6 + Math.random() * 0.4;
      this.executeSmash(ai, dirX, dirY, charge);
    }
    
    // Parry defensivo
    if (ai.parryCooldown <= 0 && Math.random() < this.parryChance) {
      ai.startParry();
    }
  }

  avoidEdge(ai, centerX, centerY, arenaRadius, deltaTime) {
    const dx = ai.x - centerX;
    const dy = ai.y - centerY;
    const distFromCenter = Math.sqrt(dx * dx + dy * dy);
    
    if (distFromCenter > arenaRadius * 0.72) {
      // Demasiado cerca del borde, volver al centro
      const toCenterX = -dx / distFromCenter;
      const toCenterY = -dy / distFromCenter;
      ai.vx += toCenterX * CONFIG.MOVE_FORCE * 0.65 * deltaTime;
      ai.vy += toCenterY * CONFIG.MOVE_FORCE * 0.65 * deltaTime;
    }
  }

  updateCooldowns(ai, deltaTime) {
    // La IA maneja sus propios cooldowns en Player.updateTimers
    // pero podemos añadir lógica de decisión basada en ellos
  }

  executeJab(ai, dirX, dirY) {
    // Delegar al sistema de combate
    if (ai.canAttack) {
      ai.hitbox = {
        x: ai.x + dirX * 36,
        y: ai.y + dirY * 36,
        radius: 18,
        timer: 0.12,
        type: 'jab',
        charge: 0,
        hit: new Set()
      };
      ai.vx -= dirX * 38;
      ai.vy -= dirY * 38;
    }
  }

  executeSmash(ai, dirX, dirY, charge) {
    if (ai.canAttack && ai.smashCooldown <= 0) {
      ai.hitbox = {
        x: ai.x + dirX * 44,
        y: ai.y + dirY * 44,
        radius: 28,
        timer: 0.15,
        type: 'smash',
        charge,
        hit: new Set()
      };
      ai.vx -= dirX * 75;
      ai.vy -= dirY * 75;
      ai.smashCooldown = CONFIG.SMASH_COOLDOWN;
    }
  }
}
