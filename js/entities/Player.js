/**
 * Factory y lógica de jugadores
 */

import { CONFIG, PLAYER_STATES } from '../config/constants.js';

export class Player {
  constructor(id, name, color, x, y, isLocal = false) {
    // Identidad
    this.id = id;
    this.name = name;
    this.color = color;
    this.isLocal = isLocal;
    
    // Posición
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    
    // Estado
    this.state = PLAYER_STATES.NORMAL;
    this.alpha = 1;
    
    // Timers (ms)
    this.stunTimer = 0;
    this.parryCooldown = 0;
    this.dashCooldown = 0;
    this.smashCooldown = 0;
    this.invulnerability = 0;
    
    // Caída
    this.falling = false;
    this.fallTimer = 0;
    
    // Carga smash
    this.charging = false;
    this.chargeStartTime = 0;
    this.chargeAmount = 0;
    
    // Hitbox activa
    this.hitbox = null;
    
    // Efectos visuales
    this.dashTrail = null;
    
    // Stats
    this.kills = 0;
    this.deaths = 0;
  }

  get isAlive() {
    return this.state !== PLAYER_STATES.DEAD;
  }

  get isStunned() {
    return this.state === PLAYER_STATES.STUN;
  }

  get isParrying() {
    return this.state === PLAYER_STATES.PARRY;
  }

  get canMove() {
    return this.state === PLAYER_STATES.NORMAL && !this.falling;
  }

  get canAttack() {
    return this.state === PLAYER_STATES.NORMAL && !this.falling;
  }

  /**
   * Aplica fuerza de movimiento
   */
  applyInput(nx, ny, deltaTime) {
    if (!this.canMove) return;
    
    this.vx += nx * CONFIG.MOVE_FORCE * deltaTime;
    this.vy += ny * CONFIG.MOVE_FORCE * deltaTime;
  }

  /**
   * Inicia carga de smash
   */
  startCharge() {
    if (!this.canAttack) return;
    this.chargeStartTime = performance.now();
    this.charging = false;
    this.chargeAmount = 0;
  }

  /**
   * Actualiza estado de carga
   */
  updateCharge() {
    if (!this.chargeStartTime) return;
    
    const held = performance.now() - this.chargeStartTime;
    
    if (held > CONFIG.SMASH_CHARGE_TIME) {
      this.charging = true;
      this.chargeAmount = Math.min(
        1,
        (held - CONFIG.SMASH_CHARGE_TIME) / 
        (CONFIG.SMASH_MAX_CHARGE_TIME - CONFIG.SMASH_CHARGE_TIME)
      );
    }
  }

  /**
   * Cancela carga
   */
  cancelCharge() {
    this.charging = false;
    this.chargeAmount = 0;
    this.chargeStartTime = 0;
  }

  /**
   * Aplica fricción y limita velocidad
   */
  applyPhysics(deltaTime) {
    // Fricción
    this.vx *= CONFIG.FRICTION;
    this.vy *= CONFIG.FRICTION;
    
    // Limitar velocidad máxima
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    if (speed > CONFIG.MAX_SPEED) {
      const ratio = CONFIG.MAX_SPEED / speed;
      this.vx *= ratio;
      this.vy *= ratio;
    }
    
    // Aplicar velocidad
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
  }

  /**
   * Actualiza timers y estados temporales
   */
  updateTimers(deltaTime) {
    const dtMs = deltaTime * 1000;
    
    // Cooldowns
    if (this.parryCooldown > 0) this.parryCooldown = Math.max(0, this.parryCooldown - dtMs);
    if (this.dashCooldown > 0) this.dashCooldown = Math.max(0, this.dashCooldown - dtMs);
    if (this.smashCooldown > 0) this.smashCooldown = Math.max(0, this.smashCooldown - dtMs);
    if (this.invulnerability > 0) this.invulnerability = Math.max(0, this.invulnerability - dtMs);
    
    // Stun
    if (this.state === PLAYER_STATES.STUN && this.stunTimer > 0) {
      this.stunTimer = Math.max(0, this.stunTimer - dtMs);
      if (this.stunTimer === 0) {
        this.state = PLAYER_STATES.NORMAL;
      }
    }
    
    // Caída
    if (this.falling) {
      this.fallTimer -= deltaTime;
      this.alpha = Math.max(0, this.fallTimer);
      
      // Aceleración al caer
      this.vx *= 1.02;
      this.vy *= 1.02;
      
      if (this.fallTimer <= 0) {
        this.die();
      }
    }
  }

  /**
   * Inicia parry
   */
  startParry() {
    if (this.parryCooldown > 0 || !this.canAttack) return false;
    
    this.state = PLAYER_STATES.PARRY;
    this.parryCooldown = CONFIG.PARRY_COOLDOWN;
    
    // Auto-terminar parry después de duración
    setTimeout(() => {
      if (this.state === PLAYER_STATES.PARRY) {
        this.state = PLAYER_STATES.NORMAL;
      }
    }, CONFIG.PARRY_DURATION);
    
    return true;
  }

  /**
   * Ejecuta dash
   */
  dash(directionX, directionY) {
    if (this.dashCooldown > 0 || !this.canMove) return false;
    
    this.vx += directionX * CONFIG.DASH_IMPULSE;
    this.vy += directionY * CONFIG.DASH_IMPULSE;
    this.dashCooldown = CONFIG.DASH_COOLDOWN;
    this.invulnerability = CONFIG.DASH_INVULN_DURATION;
    
    // Crear trail
    this.dashTrail = [];
    for (let i = 0; i < 5; i++) {
      this.dashTrail.push({ x: this.x, y: this.y });
    }
    
    setTimeout(() => {
      this.dashTrail = null;
    }, 380);
    
    return true;
  }

  /**
   * Recibe daño/golpe
   */
  onHit(attacker, attackType, charge = 0) {
    // Parry activo
    if (this.state === PLAYER_STATES.PARRY) {
      // Stun al atacante
      attacker.stun(CONFIG.PARRY_STUN_DURATION);
      // Knockback leve al defensor (retroceso)
      const dx = this.x - attacker.x;
      const dy = this.y - attacker.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      this.vx -= (dx / dist) * 260;
      this.vy -= (dy / dist) * 260;
      return 'parried';
    }
    
    // Invulnerabilidad
    if (this.invulnerability > 0) return 'invulnerable';
    
    const dx = this.x - attacker.x;
    const dy = this.y - attacker.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / dist;
    const ny = dy / dist;
    
    if (attackType === 'jab') {
      this.vx += nx * CONFIG.JAB_IMPULSE;
      this.vy += ny * CONFIG.JAB_IMPULSE;
      return 'hit';
    } else {
      // Smash
      const power = CONFIG.SMASH_MIN_IMPULSE + 
        (CONFIG.SMASH_MAX_IMPULSE - CONFIG.SMASH_MIN_IMPULSE) * charge;
      this.vx += nx * power;
      this.vy += ny * power;
      this.stun(CONFIG.STUN_DURATION);
      attacker.kills++;
      return 'smashed';
    }
  }

  /**
   * Aplica stun
   */
  stun(duration) {
    this.state = PLAYER_STATES.STUN;
    this.stunTimer = duration;
  }

  /**
   * Inicia caída al vacío
   */
  startFalling() {
    if (this.falling) return;
    this.falling = true;
    this.fallTimer = 1.0; // 1 segundo de animación
  }

  /**
   * Muerte
   */
  die() {
    this.state = PLAYER_STATES.DEAD;
    this.alpha = 0;
    this.falling = false;
    this.deaths++;
  }

  /**
   * Reset para nueva ronda
   */
  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.state = PLAYER_STATES.NORMAL;
    this.alpha = 1;
    this.stunTimer = 0;
    this.falling = false;
    this.fallTimer = 0;
    this.charging = false;
    this.chargeAmount = 0;
    this.chargeStartTime = 0;
    this.hitbox = null;
    this.dashTrail = null;
    // No resetear kills/deaths entre rondas del mismo match
  }

  /**
   * Full reset (nuevo match)
   */
  fullReset(x, y) {
    this.reset(x, y);
    this.kills = 0;
    this.deaths = 0;
    this.parryCooldown = 0;
    this.dashCooldown = 0;
    this.smashCooldown = 0;
  }
}

/**
 * Factory para crear jugadores
 */
export function createPlayer(id, name, color, x, y, isLocal) {
  return new Player(id, name, color, x, y, isLocal);
}
