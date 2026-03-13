/**
 * Controlador de input táctil
 * Joystick virtual invisible con gestos múltiples
 */

import { CONFIG, INPUT_TYPES } from '../config/constants.js';

export class TouchController {
  constructor(canvas) {
    this.canvas = canvas;
    this.active = false;
    this.centerX = 0;
    this.centerY = 0;
    this.normalizedX = 0;
    this.normalizedY = 0;
    this.touchId = -1;
    
    // Detección de doble tap para dash
    this.lastTapTime = 0;
    this.lastDirectionX = 0;
    this.lastDirectionY = 0;
    
    // Callbacks
    this.onInputStart = null;
    this.onInputMove = null;
    this.onInputEnd = null;
    this.onParry = null;
    this.onDash = null;
    
    this.bindEvents();
  }

  bindEvents() {
    this.canvas.addEventListener('touchstart', this.handleStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleEnd.bind(this), { passive: false });
    this.canvas.addEventListener('touchcancel', this.handleEnd.bind(this), { passive: false });
  }

  unbindEvents() {
    this.canvas.removeEventListener('touchstart', this.handleStart);
    this.canvas.removeEventListener('touchmove', this.handleMove);
    this.canvas.removeEventListener('touchend', this.handleEnd);
    this.canvas.removeEventListener('touchcancel', this.handleEnd);
  }

  isInJoystickZone(y) {
    return y > this.canvas.height * 0.55;
  }

  handleStart(event) {
    event.preventDefault();
    
    for (const touch of event.changedTouches) {
      // Solo zona inferior para joystick
      if (!this.isInJoystickZone(touch.clientY)) continue;
      
      if (!this.active) {
        // Primer dedo - iniciar joystick
        this.startJoystick(touch);
      } else {
        // Segundo dedo - parry
        if (this.onParry) this.onParry();
      }
    }
  }

  startJoystick(touch) {
    this.active = true;
    this.centerX = touch.clientX;
    this.centerY = touch.clientY;
    this.normalizedX = 0;
    this.normalizedY = 0;
    this.touchId = touch.identifier;
    
    // Detectar doble tap para dash
    const now = performance.now();
    const timeSinceLastTap = now - this.lastTapTime;
    
    if (timeSinceLastTap < CONFIG.DOUBLE_TAP_WINDOW && 
        (Math.abs(this.lastDirectionX) > 0.15 || Math.abs(this.lastDirectionY) > 0.15)) {
      if (this.onDash) {
        this.onDash(this.lastDirectionX, this.lastDirectionY);
      }
    }
    
    this.lastTapTime = now;
    
    if (this.onInputStart) {
      this.onInputStart();
    }
  }

  handleMove(event) {
    event.preventDefault();
    
    for (const touch of event.changedTouches) {
      if (touch.identifier !== this.touchId || !this.active) continue;
      
      const dx = touch.clientX - this.centerX;
      const dy = touch.clientY - this.centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Limitar al radio máximo
      const maxRadius = CONFIG.JOYSTICK_MAX_RADIUS;
      const clampedDistance = Math.min(distance, maxRadius);
      const ratio = clampedDistance / maxRadius;
      
      // Normalizar
      if (distance > 0) {
        this.normalizedX = (dx / distance) * ratio;
        this.normalizedY = (dy / distance) * ratio;
      }
      
      if (this.onInputMove) {
        this.onInputMove(this.normalizedX, this.normalizedY);
      }
    }
  }

  handleEnd(event) {
    event.preventDefault();
    
    for (const touch of event.changedTouches) {
      if (touch.identifier !== this.touchId) continue;
      
      // Calcular dirección final para posible dash en próximo tap
      const magnitude = Math.sqrt(
        this.normalizedX * this.normalizedX + 
        this.normalizedY * this.normalizedY
      );
      
      if (magnitude > CONFIG.JOYSTICK_DEADZONE) {
        this.lastDirectionX = this.normalizedX / magnitude;
        this.lastDirectionY = this.normalizedY / magnitude;
      }
      
      // Determinar tipo de ataque basado en duración
      const inputType = this.determineInputType();
      
      if (this.onInputEnd) {
        this.onInputEnd(inputType, this.lastDirectionX, this.lastDirectionY, this.chargeAmount);
      }
      
      this.reset();
    }
  }

  determineInputType() {
    if (!this.chargeStartTime) return null;
    
    const held = performance.now() - this.chargeStartTime;
    
    if (held < CONFIG.JAB_MAX_DURATION) {
      return { type: INPUT_TYPES.JAB, charge: 0 };
    } else if (held >= CONFIG.SMASH_MIN_DURATION) {
      const charge = Math.min(1, 
        (held - CONFIG.SMASH_CHARGE_TIME) / 
        (CONFIG.SMASH_MAX_CHARGE_TIME - CONFIG.SMASH_CHARGE_TIME)
      );
      return { type: INPUT_TYPES.SMASH, charge };
    }
    
    return null; // Entre jab y smash: no hay acción
  }

  reset() {
    this.active = false;
    this.normalizedX = 0;
    this.normalizedY = 0;
    this.touchId = -1;
    this.chargeStartTime = 0;
    this.chargeAmount = 0;
  }

  // Para sincronización con el player
  setChargeStartTime(time) {
    this.chargeStartTime = time;
  }

  updateCharge() {
    if (!this.chargeStartTime || !this.active) return;
    
    const held = performance.now() - this.chargeStartTime;
    if (held > CONFIG.SMASH_CHARGE_TIME) {
      this.chargeAmount = Math.min(1,
        (held - CONFIG.SMASH_CHARGE_TIME) /
        (CONFIG.SMASH_MAX_CHARGE_TIME - CONFIG.SMASH_CHARGE_TIME)
      );
    }
  }

  // Getters para renderizado
  get visualX() {
    return this.centerX + this.normalizedX * CONFIG.JOYSTICK_MAX_RADIUS;
  }

  get visualY() {
    return this.centerY + this.normalizedY * CONFIG.JOYSTICK_MAX_RADIUS;
  }
}
