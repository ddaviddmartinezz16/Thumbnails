/**
 * Funciones utilitarias generales
 */

// ARREGLO: Import movido al inicio del archivo
import { COLORS } from '../config/constants.js';

export const Utils = {
  /**
   * Genera ID aleatorio de caracteres
   */
  generateId(length = 4) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  },

  /**
   * Limita un valor entre min y max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Interpolación lineal
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  },

  /**
   * Distancia euclidiana
   */
  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * Vector normalizado
   */
  normalize(x, y) {
    const len = Math.sqrt(x * x + y * y);
    if (len === 0) return { x: 0, y: -1 };
    return { x: x / len, y: y / len };
  },

  /**
   * Ángulo entre dos vectores en grados
   */
  angleBetween(x1, y1, x2, y2) {
    const dot = x1 * x2 + y1 * y2;
    const det = x1 * y2 - y1 * x2;
    return Math.atan2(det, dot) * (180 / Math.PI);
  },

  /**
   * Formatea tiempo en segundos a MM:SS
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Selecciona color disponible (no usado por otros)
   */
  selectAvailableColor(usedColors) {
    return COLORS.find(c => !usedColors.includes(c)) || COLORS[0];
  },

  /**
   * Crea elemento DOM con atributos
   */
  createElement(tag, attributes = {}) {
    const el = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'textContent') {
        el.textContent = value;
      } else if (key === 'innerHTML') {
        el.innerHTML = value;
      } else {
        el.setAttribute(key, value);
      }
    });
    return el;
  },

  /**
   * Debounce para eventos
   */
  debounce(fn, ms) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), ms);
    };
  },

  /**
   * Throttle para eventos
   */
  throttle(fn, ms) {
    let last = 0;
    return (...args) => {
      const now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn(...args);
      }
    };
  },
};

// ELIMINADO: Import que estaba aquí al final
// import { COLORS } from '../config/constants.js';
