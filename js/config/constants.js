/**

- Configuración global del juego
- Valores balanceados para gameplay óptimo en móvil
  */

export const CONFIG = Object.freeze({
// Player
PLAYER_RADIUS: 22,
MAX_SPEED: 300,
FRICTION: 0.87,
MOVE_FORCE: 480,

// Combat
JAB_IMPULSE: 300,
SMASH_MIN_IMPULSE: 480,
SMASH_MAX_IMPULSE: 860,
SMASH_CHARGE_TIME: 600,      // ms para empezar a cargar
SMASH_MAX_CHARGE_TIME: 1200, // ms para carga máxima

// Cooldowns (ms)
PARRY_COOLDOWN: 5000,
PARRY_DURATION: 500,
PARRY_STUN_DURATION: 1500,
DASH_COOLDOWN: 3000,
DASH_IMPULSE: 580,
DASH_INVULN_DURATION: 300,
SMASH_COOLDOWN: 1500,
STUN_DURATION: 900,

// Round
ROUND_DURATION: 90,          // segundos
SHRINK_START_TIME: 55,       // segundos restantes para empezar a reducir
PLATFORM_WARNING_TIME: 3,  // segundos de advertencia antes de caer
WIN_ROUNDS: 2,

// Physics
FIXED_TIMESTEP: 1 / 60,
MAX_DELTA_TIME: 0.05,        // previene lag spikes

// Visual
MAX_PARTICLES: 120,
CAMERA_SMOOTHING: 0.09,
CAMERA_ZOOM_SMOOTHING: 0.05,

// Input
JOYSTICK_MAX_RADIUS: 80,
JOYSTICK_DEADZONE: 0.08,
DOUBLE_TAP_WINDOW: 220,      // ms
JAB_MAX_DURATION: 300,       // ms
SMASH_MIN_DURATION: 600,     // ms

// Arena
ARENA_RADIUS_RATIO: 0.47,    // de la pantalla más pequeña
PLAYER_SPAWN_RATIO: 0.38,    // aumentado para separar jugadores al spawn
});

export const COLORS = Object.freeze([
‘#00f5ff’, // cyan
‘#ff00aa’, // magenta
‘#ffd700’, // gold
‘#39ff14’, // lime
]);

export const GAME_STATES = Object.freeze({
HOME: ‘home’,
LOBBY: ‘lobby’,
COUNTDOWN: ‘countdown’,
PLAYING: ‘playing’,
ROUND_END: ‘roundEnd’,
MATCH_END: ‘matchEnd’,
});

export const PLAYER_STATES = Object.freeze({
NORMAL: ‘normal’,
STUN: ‘stun’,
PARRY: ‘parry’,
DEAD: ‘dead’,
});

export const INPUT_TYPES = Object.freeze({
JAB: ‘jab’,
SMASH: ‘smash’,
PARRY: ‘parry’,
DASH: ‘dash’,
});