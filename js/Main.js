/**
 * Punto de entrada de Thumb Titans
 * Inicializa el juego cuando el DOM está listo
 */

import { Game } from './core/Game.js';

// Prevenir comportamientos por defecto problemáticos en móvil
document.addEventListener('touchmove', (e) => {
  if (e.target.tagName !== 'INPUT') {
    e.preventDefault();
  }
}, { passive: false });

// Mantener pantalla encendida
if ('wakeLock' in navigator) {
  navigator.wakeLock.request('screen').catch(() => {});
}

// Iniciar juego
window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  
  // Exponer para debugging
  window.game = game;
});
