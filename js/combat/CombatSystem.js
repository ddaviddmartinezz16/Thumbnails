/**
 * Sistema central de combate
 * Gestiona hitboxes, colisiones y aplicación de daño
 */

import { CONFIG, PLAYER_STATES } from '../config/constants.js';

export class Hitbox {
  constructor(x, y, radius, type, charge = 0, owner) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.type = type;
    this.charge = charge;
    this.owner = owner;
    this.duration = type === 'jab' ? 0.12 : 0.15;
    this.timer = this.duration;
    this.hitTargets = new Set();
    this.active = true;
  }

  update(deltaTime) {
    this.timer -= deltaTime;
    if (this.timer <= 0) {
      this.active = false;
    }
    return this.active;
  }

  hasHit(target) {
    return this.hitTargets.has(target.id);
  }

  markHit(target) {
    this.hitTargets.add(target.id);
  }
}

export class CombatSystem {
  constructor(particleSystem, camera) {
    this.particles = particleSystem;
    this.camera = camera;
    this.hitboxes = [];
  }

  /**
   * Crea hitbox de jab
   */
  createJab(attacker, directionX, directionY) {
    if (!attacker.canAttack) return null;
    
    const hitbox = new Hitbox(
      attacker.x + directionX * 36,
      attacker.y + directionY * 36,
      18,
      'jab',
      0,
      attacker
    );
    
    // Self-knockback
    attacker.vx -= directionX * 38;
    attacker.vy -= directionY * 38;
    
    this.particles.jab(hitbox.x, hitbox.y, attacker.color);
    this.hitboxes.push(hitbox);
    
    return hitbox;
  }

  /**
   * Crea hitbox de smash
   */
  createSmash(attacker, directionX, directionY, charge) {
    if (!attacker.canAttack || attacker.smashCooldown > 0) return null;
    
    const hitbox = new Hitbox(
      attacker.x + directionX * 44,
      attacker.y + directionY * 44,
      28,
      'smash',
      charge,
      attacker
    );
    
    // Self-knockback mayor
    attacker.vx -= directionX * 75;
    attacker.vy -= directionY * 75;
    attacker.smashCooldown = CONFIG.SMASH_COOLDOWN;
    
    this.particles.smash(hitbox.x, hitbox.y, attacker.color);
    this.hitboxes.push(hitbox);
    
    return hitbox;
  }

  /**
   * Procesa todas las hitboxes activas
   */
  update(deltaTime, players) {
    for (let i = this.hitboxes.length - 1; i >= 0; i--) {
      const hitbox = this.hitboxes[i];
      
      if (!hitbox.update(deltaTime)) {
        this.hitboxes.splice(i, 1);
        continue;
      }
      
      this.checkCollisions(hitbox, players);
    }
  }

  checkCollisions(hitbox, players) {
    for (const target of players) {
      if (target.id === hitbox.owner.id) continue;
      if (!target.isAlive) continue;
      if (hitbox.hasHit(target)) continue;
      
      const distance = Math.sqrt(
        (target.x - hitbox.x) ** 2 + 
        (target.y - hitbox.y) ** 2
      );
      
      if (distance > hitbox.radius + CONFIG.PLAYER_RADIUS) continue;
      
      hitbox.markHit(target);
      this.resolveHit(hitbox.owner, target, hitbox.type, hitbox.charge);
    }
  }

  resolveHit(attacker, target, type, charge) {
    // Verificar parry
    if (target.isParrying) {
      this.resolveParry(target, attacker);
      return;
    }
    
    // Verificar invulnerabilidad
    if (target.invulnerability > 0) return;
    
    const dx = target.x - attacker.x;
    const dy = target.y - attacker.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / distance;
    const ny = dy / distance;
    
    if (type === 'jab') {
      // Jab: knockback leve
      target.vx += nx * CONFIG.JAB_IMPULSE;
      target.vy += ny * CONFIG.JAB_IMPULSE;
      this.camera.addShake(2);
      
    } else {
      // Smash: knockback masivo + stun
      const power = CONFIG.SMASH_MIN_IMPULSE + 
        (CONFIG.SMASH_MAX_IMPULSE - CONFIG.SMASH_MIN_IMPULSE) * charge;
      
      target.vx += nx * power;
      target.vy += ny * power;
      target.stun(CONFIG.STUN_DURATION);
      attacker.kills++;
      this.camera.addShake(9);
    }
    
    this.particles.smash(target.x, target.y, attacker.color);
  }

  resolveParry(defender, attacker) {
    // Stun al atacante
    attacker.stun(CONFIG.PARRY_STUN_DURATION);
    
    // Knockback al defensor (retroceso defensivo)
    const dx = defender.x - attacker.x;
    const dy = defender.y - attacker.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    
    defender.vx -= (dx / distance) * 260;
    defender.vy -= (dy / distance) * 260;
    
    this.particles.parry(defender.x, defender.y);
    this.camera.addShake(4);
  }

  clear() {
    this.hitboxes.length = 0;
  }
}
