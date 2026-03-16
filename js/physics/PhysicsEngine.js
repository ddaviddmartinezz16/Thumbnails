/**

- Motor de física simplificado
- Colisiones jugador-plataforma y límites de arena
  */

import { CONFIG } from ‘../config/constants.js’;

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

- Actualiza física de un jugador
  */
  updatePlayer(player, platforms, deltaTime) {
  if (player.state === ‘dead’) return;

```
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
```

}

handlePlatformCollisions(player, platforms) {
for (const platform of platforms) {
if (!platform.active) continue;

```
  const dx = player.x - platform.x;
  const dy = player.y - platform.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // El jugador está sobre esta plataforma si su centro cae dentro del radio
  if (distance <= platform.radius) {
    player.falling = false;

    // Si se acerca al borde, empujarlo de vuelta
    const edgeDist = platform.radius - CONFIG.PLAYER_RADIUS;
    if (distance > edgeDist) {
      const nx = distance > 0 ? dx / distance : 0;
      const ny = distance > 0 ? dy / distance : 1;

      player.x = platform.x + nx * edgeDist;
      player.y = platform.y + ny * edgeDist;

      // Cancelar velocidad que sale hacia fuera
      const dot = player.vx * nx + player.vy * ny;
      if (dot > 0) {
        player.vx -= dot * nx * 0.8;
        player.vy -= dot * ny * 0.8;
      }
    }
    break;
  }
}
```

}

checkArenaBounds(player, deltaTime) {
if (player.falling) return;

```
const dx = player.x - this.centerX;
const dy = player.y - this.centerY;
const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);

// Fuera de la arena = caída
if (distanceFromCenter > this.arenaRadius - CONFIG.PLAYER_RADIUS) {
  player.startFalling();
}
```

}

/**

- Verifica si una posición está dentro de la arena
  */
  isInArena(x, y) {
  const dx = x - this.centerX;
  const dy = y - this.centerY;
  return Math.sqrt(dx * dx + dy * dy) <= this.arenaRadius - CONFIG.PLAYER_RADIUS;
  }

/**

- Encuentra plataforma más cercana
  */
  findNearestPlatform(x, y, platforms) {
  let nearest = null;
  let minDist = Infinity;

```
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
```

}
}
