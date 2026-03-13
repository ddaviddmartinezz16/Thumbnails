/**
 * HUD in-game
 * Actualiza timer, vidas y cooldowns
 */

// ARREGLO: Import movido al inicio del archivo
import { CONFIG } from '../config/constants.js';

export class HUD {
  constructor() {
    this.elements = {
      container: document.getElementById('hud'),
      timer: document.getElementById('hudTimer'),
      score: document.getElementById('hudScore'),
      lives: document.getElementById('hudLives'),
      parryCooldown: document.getElementById('cdParry'),
      dashCooldown: document.getElementById('cdDash'),
    };
    this.visible = false;
  }

  show() {
    this.elements.container.classList.remove('off');
    this.visible = true;
  }

  hide() {
    this.elements.container.classList.add('off');
    this.visible = false;
  }

  updateTimer(seconds, isDanger = false) {
    this.elements.timer.textContent = Math.ceil(seconds);
    this.elements.timer.classList.toggle('danger', isDanger);
  }

  updateScore(score1, score2) {
    this.elements.score.textContent = `${score1} — ${score2}`;
  }

  updateLives(players) {
    this.elements.lives.innerHTML = players.map(player => `
      <div class="hlbar">
        <div class="hlfi" style="height:${(player.lives / 3) * 100}%;background:${player.color}"></div>
      </div>
    `).join('');
  }

  updateCooldowns(localPlayer) {
    if (!localPlayer) return;

    const parryPercent = Math.min(1, localPlayer.parryCooldown / CONFIG.PARRY_COOLDOWN);
    const dashPercent = Math.min(1, localPlayer.dashCooldown / CONFIG.DASH_COOLDOWN);

    this.elements.parryCooldown.style.transform = `scaleY(${parryPercent})`;
    this.elements.dashCooldown.style.transform = `scaleY(${dashPercent})`;
  }

  update(roundTimer, players, localPlayer) {
    if (!this.visible) return;

    this.updateTimer(roundTimer, roundTimer <= 10);

    // Asume players[0] y players[1] son los equipos/rivales
    // Ajustar según modo de juego
    const scores = players.map(p => p.kills); // o matchScores
    this.updateScore(scores[0] || 0, scores[1] || 0);

    this.updateLives(players);
    this.updateCooldowns(localPlayer);
  }
}

// ELIMINADO: Import que estaba aquí al final
// import { CONFIG } from '../config/constants.js';
