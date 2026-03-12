/**
 * Gestión de persistencia local
 */

const STORAGE_KEY = 'thumbTitans';

export const Storage = {
  /**
   * Guarda datos en localStorage
   */
  save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.warn('Storage save failed:', e);
      return false;
    }
  },

  /**
   * Carga datos de localStorage
   */
  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('Storage load failed:', e);
      return null;
    }
  },

  /**
   * Obtiene valor específico con default
   */
  get(key, defaultValue = null) {
    const data = this.load();
    return data?.[key] ?? defaultValue;
  },

  /**
   * Guarda valor específico preservando resto
   */
  set(key, value) {
    const data = this.load() || {};
    data[key] = value;
    return this.save(data);
  },

  /**
   * Limpia todo el storage
   */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (e) {
      return false;
    }
  },
};
