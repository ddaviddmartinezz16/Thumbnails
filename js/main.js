/**

- Punto de entrada de Thumb Titans
- Inicializa el juego cuando el DOM está listo
  */

import { Game } from ‘./core/Game.js’;

// Prevenir scroll/zoom solo dentro del canvas (no en botones ni menús)
document.addEventListener(‘touchmove’, (e) => {
if (e.target.tagName === ‘CANVAS’) {
e.preventDefault();
}
}, { passive: false });

// Mantener pantalla encendida
if (‘wakeLock’ in navigator) {
navigator.wakeLock.request(‘screen’).catch(() => {});
}

// Iniciar juego
window.addEventListener(‘DOMContentLoaded’, () => {
const game = new Game();

// Exponer para debugging
window.game = game;
});