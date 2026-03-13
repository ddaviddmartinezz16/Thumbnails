/**
 * Gestor de pantallas/navegación UI
 * Controla visibilidad y transiciones
 */

import { Utils } from '../utils/Helpers.js';

const SCREENS = {
  HOME: 'screenHome',
  LOBBY: 'screenLobby',
};

const OVERLAYS = {
  COUNTDOWN: 'overlayCountdown',
  ROUND_END: 'overlayRound',
  MATCH_END: 'overlayMatch',
};

export class ScreenManager {
  constructor() {
    this.screens = new Map();
    this.overlays = new Map();
    this.currentScreen = null;
    this.setupElements();
  }

  setupElements() {
    // Pantallas principales
    Object.values(SCREENS).forEach(id => {
      this.screens.set(id, document.getElementById(id));
    });
    
    // Overlays
    Object.values(OVERLAYS).forEach(id => {
      this.overlays.set(id, document.getElementById(id));
    });
  }

  show(screenId) {
    // Ocultar actual
    if (this.currentScreen) {
      this.currentScreen.classList.add('off');
    }
    
    // Mostrar nueva
    const screen = this.screens.get(screenId);
    if (screen) {
      screen.classList.remove('off');
      this.currentScreen = screen;
    }
  }

  hideAll() {
    this.screens.forEach(screen => screen.classList.add('off'));
    this.overlays.forEach(overlay => overlay.classList.add('off'));
    this.currentScreen = null;
  }

  showOverlay(overlayId) {
    const overlay = this.overlays.get(overlayId);
    if (overlay) {
      overlay.classList.remove('off');
    }
  }

  hideOverlay(overlayId) {
    const overlay = this.overlays.get(overlayId);
    if (overlay) {
      overlay.classList.add('off');
    }
  }

  hideAllOverlays() {
    this.overlays.forEach(overlay => overlay.classList.add('off'));
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS ESPECÍFICOS
  // ═══════════════════════════════════════════════════════════

  updateLobbyCode(code) {
    document.getElementById('lobbyCode').textContent = code;
  }

  updateLobbyPlayers(players, myId) {
    const container = document.getElementById('lobbyList');
    const rows = players.map(player => this.createPlayerRow(player, player.id === myId));
    
    // Slots vacíos
    for (let i = players.length; i < 4; i++) {
      rows.push(this.createEmptySlot());
    }
    
    container.innerHTML = rows.join('');
  }

  createPlayerRow(player, isMe) {
    return `
      <div class="prow">
        <div class="pavt" style="background:${player.color};box-shadow:0 0 12px ${player.color}"></div>
        <div class="pnm">${player.name}</div>
        ${isMe ? '<div class="pbdg">TÚ</div>' : ''}
      </div>
    `;
  }

  createEmptySlot() {
    return `
      <div class="prow empty">
        <div class="pavt" style="background:var(--border)"></div>
        <div class="pnm" style="color:var(--dim);font-style:italic">Esperando...</div>
      </div>
    `;
  }

  updateLobbyStatus(current, max = 4) {
    document.getElementById('lobbyStatus').textContent = `${current}/${max} jugadores`;
  }

  setStartButtonEnabled(enabled) {
    document.getElementById('btnStart').disabled = !enabled;
  }

  // ═══════════════════════════════════════════════════════════
  // OVERLAY ROUND END
  // ═══════════════════════════════════════════════════════════

  showRoundEnd(round, winner, scores, players, isMatchEnd, onNext) {
    const overlay = this.overlays.get(OVERLAYS.ROUND_END);
    
    document.getElementById('roundTitle').textContent = `RONDA ${round}`;
    
    const badge = document.getElementById('roundBadge');
    const winnerName = document.getElementById('roundWinner');
    
    if (winner) {
      badge.style.cssText = `background:${winner.color}33;color:${winner.color};border:1.5px solid ${winner.color}`;
      badge.textContent = 'GANADOR';
      winnerName.textContent = winner.name;
      winnerName.style.color = winner.color;
    } else {
      badge.style.cssText = 'background:rgba(255,255,255,0.1);color:#fff;border:1.5px solid #fff';
      badge.textContent = 'EMPATE';
      winnerName.textContent = '—';
      winnerName.style.color = '#fff';
    }
    
    document.getElementById('roundScore').innerHTML = this.createScoreHTML(scores, players);
    
    const nextText = document.getElementById('roundNext');
    if (isMatchEnd) {
      nextText.textContent = 'Fin del match...';
      setTimeout(() => {
        this.hideOverlay(OVERLAYS.ROUND_END);
        // El game llamará a showMatchEnd
      }, 3000);
    } else {
      let countdown = 3;
      nextText.textContent = `Siguiente ronda en ${countdown}...`;
      
      const interval = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(interval);
          this.hideOverlay(OVERLAYS.ROUND_END);
          if (onNext) onNext();
        } else {
          nextText.textContent = `Siguiente ronda en ${countdown}...`;
        }
      }, 1000);
    }
    
    this.showOverlay(OVERLAYS.ROUND_END);
  }

  // ═══════════════════════════════════════════════════════════
  // OVERLAY MATCH END
  // ═══════════════════════════════════════════════════════════

  showMatchEnd(winner, scores, players) {
    const title = document.getElementById('matchTitle');
    const name = document.getElementById('matchWinner');
    
    title.textContent = '¡CAMPEÓN!';
    title.style.color = winner.color;
    title.style.textShadow = `0 0 30px ${winner.color}`;
    
    name.textContent = winner.name;
    name.style.color = winner.color;
    
    document.getElementById('matchScore').innerHTML = this.createScoreHTML(scores, players);
    
    this.showOverlay(OVERLAYS.MATCH_END);
  }

  createScoreHTML(scores, players) {
    return `
      <div class="sbbl">
        <div class="snum" style="color:${players[0]?.color || '#fff'}">${scores[0]}</div>
        <div class="snm">${players[0]?.name || 'P1'}</div>
      </div>
      <div class="svs">VS</div>
      <div class="sbbl">
        <div class="snum" style="color:${players[1]?.color || '#fff'}">${scores[1]}</div>
        <div class="snm">${players[1]?.name || 'P2'}</div>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // COUNTDOWN
  // ═══════════════════════════════════════════════════════════

  async runCountdown() {
    return new Promise(resolve => {
      const overlay = this.overlays.get(OVERLAYS.COUNTDOWN);
      const numberEl = overlay.querySelector('.cdnum');
      
      this.showOverlay(OVERLAYS.COUNTDOWN);
      
      let count = 3;
      numberEl.textContent = count;
      numberEl.className = 'cdnum cdnum-anim';
      
      const step = () => {
        count--;
        
        if (count <= 0) {
          this.hideOverlay(OVERLAYS.COUNTDOWN);
          resolve();
          return;
        }
        
        numberEl.className = 'cdnum';
        // Force reflow
        void numberEl.offsetWidth;
        numberEl.className = 'cdnum cdnum-anim';
        numberEl.textContent = count;
        
        setTimeout(step, 900);
      };
      
      setTimeout(step, 900);
    });
  }

  // ═══════════════════════════════════════════════════════════
  // UTILIDADES
  // ═══════════════════════════════════════════════════════════

  showToast(message, duration = 2400) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('off');
    
    clearTimeout(this._toastTimeout);
    this._toastTimeout = setTimeout(() => {
      toast.classList.add('off');
    }, duration);
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('¡Código copiado!');
    } catch (err) {
      // Fallback
      const input = document.createElement('input');
      input.value = text;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.showToast('¡Código copiado!');
    }
  }
}
