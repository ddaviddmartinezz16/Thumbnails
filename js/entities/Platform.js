/**
 * Factory y lógica de plataformas
 */

import { CONFIG } from '../config/constants.js';

export class Platform {
  constructor(id, x, y, radius) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.active = true;
    this.warning = false;
    this.warningTimer = 0;
  }

  get isDangerous() {
    return this.warning && this.warningTimer > 0;
  }

  startWarning(duration = CONFIG.PLATFORM_WARNING_TIME) {
    this.warning = true;
    this.warningTimer = duration;
  }

  update(deltaTime) {
    if (!this.warning || this.warningTimer <= 0) return;

    this.warningTimer -= deltaTime;
    
    if (this.warningTimer <= 0) {
      this.active = false;
      this.warning = false;
      return 'destroyed';
    }
    return 'warning';
  }

  reset() {
    this.active = true;
    this.warning = false;
    this.warningTimer = 0;
  }
}

/**
 * Crea configuración de plataformas para una ronda
 */
export function createPlatformLayout(centerX, centerY, arenaRadius) {
  const platforms = [];
  
  // Centro
  platforms.push(new Platform(0, centerX, centerY, 90));
  
  // Anillo interior (4 plataformas)
  const innerCount = 4;
  const innerRadius = arenaRadius * 0.38;
  for (let i = 0; i < innerCount; i++) {
    const angle = (i / innerCount) * Math.PI * 2;
    platforms.push(new Platform(
      i + 1,
      centerX + Math.cos(angle) * innerRadius,
      centerY + Math.sin(angle) * innerRadius,
      64
    ));
  }
  
  // Anillo exterior (4 plataformas, offset)
  const outerCount = 4;
  const outerRadius = arenaRadius * 0.67;
  for (let i = 0; i < outerCount; i++) {
    const angle = (i / outerCount + 0.125) * Math.PI * 2;
    platforms.push(new Platform(
      i + 5,
      centerX + Math.cos(angle) * outerRadius,
      centerY + Math.sin(angle) * outerRadius,
      52
    ));
  }
  
  return platforms;
}
