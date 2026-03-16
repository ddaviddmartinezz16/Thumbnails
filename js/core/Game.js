/**

- Núcleo del juego
- Orquesta todos los sistemas y mantiene el estado global
  */

import { CONFIG, GAME_STATES, PLAYER_STATES, COLORS } from ‘../config/constants.js’;
import { Utils } from ‘../utils/Helpers.js’;
import { Storage } from ‘../utils/Storage.js’;
import { Camera } from ‘./Camera.js’;
import { Renderer } from ‘./Renderer.js’;
import { ParticleSystem } from ‘../entities/ParticleSystem.js’;
import { Player, createPlayer } from ‘../entities/Player.js’;
import { Platform, createPlatformLayout } from ‘../entities/Platform.js’;
import { AIController } from ‘../entities/AIController.js’;
import { TouchController } from ‘../input/TouchController.js’;
import { CombatSystem } from ‘../combat/CombatSystem.js’;
import { PhysicsEngine } from ‘../physics/PhysicsEngine.js’;
import { ScreenManager } from ‘../ui/ScreenManager.js’;
import { HUD } from ‘../ui/HUD.js’;
import { NetworkManager } from ‘../network/NetworkManager.js’;

export class Game {
constructor() {
this.canvas = document.getElementById(‘gameCanvas’);
this.state = GAME_STATES.HOME;

```
// Dimensiones
this.width = 0;
this.height = 0;

// Sistemas
this.camera = new Camera();
this.renderer = new Renderer(this.canvas);
this.particles = new ParticleSystem();
this.physics = new PhysicsEngine();
this.combat = new CombatSystem(this.particles, this.camera);
this.screens = new ScreenManager();
this.hud = new HUD();
this.network = new NetworkManager();

// Input
this.touch = null;

// Entidades
this.players = [];
this.platforms = [];
this.ai = null;

// Estado de ronda
this.roundTimer = CONFIG.ROUND_DURATION;
this.roundActive = false;
this.currentRound = 1;
this.matchScores = [0, 0];
this.shrinkTimer = 0;
this.nextShrinkInterval = 5;

// Loop
this.rafId = null;
this.lastTime = 0;
this.accumulator = 0;

// Configuración jugador
this.playerName = 'TITAN';
this.playerColor = COLORS[0];
this.gameMode = 'solo'; // 'solo' | 'online'

this.init();
```

}

init() {
// Setup canvas
this.resize();
window.addEventListener(‘resize’, () => this.resize());

```
// Cargar preferencias
this.loadPreferences();

// Setup UI event listeners
this.setupUI();

// Iniciar loop
this.lastTime = performance.now();
this.loop();
```

}

resize() {
const dims = this.renderer.resize();
this.width = dims.width;
this.height = dims.height;
}

loadPreferences() {
const prefs = Storage.load();
if (prefs) {
this.playerName = prefs.name || ‘TITAN’;
this.playerColor = prefs.color || COLORS[0];

```
  // Aplicar a inputs
  const nameInput = document.getElementById('inputName');
  if (nameInput) nameInput.value = this.playerName;

  // Seleccionar color
  document.querySelectorAll('.cdot').forEach(dot => {
    dot.classList.toggle('sel', dot.dataset.c === this.playerColor);
  });
}
```

}

savePreferences() {
const nameInput = document.getElementById(‘inputName’);
this.playerName = (nameInput?.value.trim() || ‘TITAN’).toUpperCase();

```
Storage.save({
  name: this.playerName,
  color: this.playerColor
});
```

}

setupUI() {
// Modo de juego
document.getElementById(‘btnSolo’)?.addEventListener(‘click’, () => this.setMode(‘solo’));
document.getElementById(‘btnOnline’)?.addEventListener(‘click’, () => this.setMode(‘online’));

```
// Acciones principales
document.getElementById('btnPlay')?.addEventListener('click', () => this.startLocalGame());
document.getElementById('btnCreate')?.addEventListener('click', () => this.createOnlineRoom());
document.getElementById('btnJoin')?.addEventListener('click', () => this.joinOnlineRoom());

// Lobby
document.getElementById('lobbyCode')?.addEventListener('click', () => {
  this.screens.copyToClipboard(this.network.roomCode);
});
document.getElementById('btnStart')?.addEventListener('click', () => this.startOnlineGame());
document.getElementById('btnLeave')?.addEventListener('click', () => this.leaveLobby());

// Post-match
document.getElementById('btnRematch')?.addEventListener('click', () => this.rematch());
document.getElementById('btnHome')?.addEventListener('click', () => this.returnToMenu());

// Selector de color
document.getElementById('colorPicker')?.addEventListener('click', (e) => {
  const dot = e.target.closest('.cdot');
  if (!dot) return;

  document.querySelectorAll('.cdot').forEach(d => d.classList.remove('sel'));
  dot.classList.add('sel');
  this.playerColor = dot.dataset.c;
  this.savePreferences();
});
```

}

setMode(mode) {
this.gameMode = mode;

```
document.getElementById('btnSolo')?.classList.toggle('on', mode === 'solo');
document.getElementById('btnOnline')?.classList.toggle('on', mode === 'online');

const soloSection = document.getElementById('sectionSolo');
const onlineSection = document.getElementById('sectionOnline');

if (soloSection) {
  soloSection.style.display = mode === 'solo' ? 'block' : 'none';
}
if (onlineSection) {
  onlineSection.style.display = mode === 'online' ? 'flex' : 'none';
}
```

}

// ═══════════════════════════════════════════════════════════
// INICIO DE PARTIDA
// ═══════════════════════════════════════════════════════════

async startLocalGame() {
this.savePreferences();
this.gameMode = ‘solo’;
this.matchScores = [0, 0];
this.currentRound = 1;

```
this.canvas.style.pointerEvents = 'auto';
this.screens.hideAll();
await this.screens.runCountdown();
this.startRound();
```

}

async createOnlineRoom() {
this.savePreferences();

```
try {
  await this.network.connect();
  this.network.onPlayerJoined = (player) => this.onNetworkPlayerJoined(player);
  this.network.onPlayerLeft = (id) => this.onNetworkPlayerLeft(id);
  this.network.onGameStart = () => this.onNetworkGameStart();
  this.network.onError = (msg) => this.screens.showToast(msg);

  this.network.createRoom(this.playerName, this.playerColor);
  this.showLobby();
} catch (err) {
  this.screens.showToast('No se pudo conectar al servidor');
}
```

}

async joinOnlineRoom() {
this.savePreferences();

```
const code = document.getElementById('inputCode')?.value.trim().toUpperCase();
if (code.length !== 4) {
  this.screens.showToast('Código inválido');
  return;
}

try {
  await this.network.connect();
  this.network.onPlayerJoined = (player) => this.onNetworkPlayerJoined(player);
  this.network.onPlayerLeft = (id) => this.onNetworkPlayerLeft(id);
  this.network.onGameStart = () => this.onNetworkGameStart();
  this.network.onError = (msg) => this.screens.showToast(msg);

  this.network.joinRoom(code, this.playerName, this.playerColor);
  this.showLobby();
} catch (err) {
  this.screens.showToast('No se pudo conectar al servidor');
}
```

}

showLobby() {
this.screens.show(‘screenLobby’);
this.updateLobbyUI();
}

updateLobbyUI() {
const players = [{
id: this.network.myId,
name: this.playerName,
color: this.playerColor
}];
// Añadir peers conectados…

```
this.screens.updateLobbyCode(this.network.roomCode || '----');
this.screens.updateLobbyPlayers(players, this.network.myId);
this.screens.updateLobbyStatus(1);
this.screens.setStartButtonEnabled(this.network.isHost && this.network.peerCount > 0);
```

}

onNetworkPlayerJoined(player) {
this.updateLobbyUI();
}

onNetworkPlayerLeft(id) {
this.updateLobbyUI();
}

onNetworkGameStart() {
this.screens.hideAllOverlays();
this.matchScores = [0, 0];
this.currentRound = 1;
this.screens.runCountdown().then(() => this.startRound());
}

startOnlineGame() {
if (!this.network.isHost) return;
this.network.startGame();
}

leaveLobby() {
this.network.leaveRoom();
this.screens.show(‘screenHome’);
}

// ═══════════════════════════════════════════════════════════
// RONDA Y MATCH
// ═══════════════════════════════════════════════════════════

startRound() {
this.state = GAME_STATES.PLAYING;
this.roundTimer = CONFIG.ROUND_DURATION;
this.roundActive = true;
this.shrinkTimer = 0;
this.nextShrinkInterval = 5;

```
// Limpiar estado anterior
this.particles.clear();
this.combat.clear();

// Crear entidades
this.setupPlayers();
this.setupPlatforms();

// Setup cámara
this.camera.reset(this.width / 2, this.height / 2);

// Setup input
this.setupInput();

// Mostrar HUD
this.hud.show();

// Ocultar hint después de unos segundos
setTimeout(() => {
  const hint = document.getElementById('touchHint');
  if (hint) hint.style.opacity = '0';
}, 5000);

// Timer de ronda
this.startRoundTimer();
```

}

setupPlayers() {
this.players = [];
const centerX = this.width / 2;
const centerY = this.height / 2;
const spawnRadius = Math.min(this.width, this.height) * CONFIG.PLAYER_SPAWN_RATIO;

```
// Jugador local
this.players.push(createPlayer(
  0,
  this.playerName,
  this.playerColor,
  centerX - spawnRadius,
  centerY,
  true
));

// CPU o jugador online
if (this.gameMode === 'solo') {
  const aiColor = COLORS.find(c => c !== this.playerColor) || COLORS[1];
  this.players.push(createPlayer(
    1,
    'CPU',
    aiColor,
    centerX + spawnRadius,
    centerY,
    false
  ));

  this.ai = new AIController();
}
```

}

setupPlatforms() {
this.platforms = createPlatformLayout(
this.width / 2,
this.height / 2,
this.getArenaRadius()
);

```
// Setup física
this.physics.setArena(
  this.width / 2,
  this.height / 2,
  this.getArenaRadius()
);
```

}

setupInput() {
if (this.touch) {
this.touch.unbindEvents();
}

```
this.touch = new TouchController(this.canvas);

// ARREGLO CRÍTICO: Sincronizar chargeStartTime
this.touch.onInputStart = () => {
  const localPlayer = this.players.find(p => p.isLocal);
  if (localPlayer) {
    localPlayer.startCharge();
    // ARREGLO: Sincronizar con TouchController
    this.touch.setChargeStartTime(localPlayer.chargeStartTime);
  }
};

this.touch.onInputMove = (nx, ny) => {
  const localPlayer = this.players.find(p => p.isLocal);
  if (localPlayer) {
    localPlayer.updateCharge();
    // ARREGLO: Actualizar carga en TouchController
    this.touch.updateCharge();
  }
};

this.touch.onInputEnd = (inputType, dirX, dirY, charge) => {
  const localPlayer = this.players.find(p => p.isLocal);
  if (!localPlayer || !localPlayer.canAttack) return;

  if (inputType?.type === 'jab') {
    this.combat.createJab(localPlayer, dirX, dirY);
  } else if (inputType?.type === 'smash') {
    this.combat.createSmash(localPlayer, dirX, dirY, inputType.charge);
  }

  localPlayer.cancelCharge();
};

this.touch.onParry = () => {
  const localPlayer = this.players.find(p => p.isLocal);
  if (localPlayer) {
    localPlayer.startParry();
  }
};

this.touch.onDash = (dirX, dirY) => {
  const localPlayer = this.players.find(p => p.isLocal);
  if (localPlayer) {
    localPlayer.dash(dirX, dirY);
  }
};
```

}

getArenaRadius() {
return Math.min(this.width, this.height) * CONFIG.ARENA_RADIUS_RATIO;
}

startRoundTimer() {
// Usar interval para el timer de segundos
this.roundTimerInterval = setInterval(() => {
if (!this.roundActive) return;

```
  this.roundTimer--;
  if (this.roundTimer <= 0) {
    this.roundTimer = 0;
    this.checkRoundEnd();
  }
}, 1000);
```

}

// ═══════════════════════════════════════════════════════════
// GAME LOOP
// ═══════════════════════════════════════════════════════════

loop() {
this.rafId = requestAnimationFrame(() => this.loop());

```
const now = performance.now();
const deltaTime = Math.min((now - this.lastTime) / 1000, CONFIG.MAX_DELTA_TIME);
this.lastTime = now;

if (this.roundActive) {
  this.accumulator += deltaTime;

  while (this.accumulator >= CONFIG.FIXED_TIMESTEP) {
    this.fixedUpdate(CONFIG.FIXED_TIMESTEP);
    this.accumulator -= CONFIG.FIXED_TIMESTEP;
  }
}

this.render(now);
```

}

fixedUpdate(deltaTime) {
const localPlayer = this.players.find(p => p.isLocal);

```
// Input local
if (localPlayer && localPlayer.canMove) {
  localPlayer.applyInput(this.touch.normalizedX, this.touch.normalizedY, deltaTime);
}

// IA
if (this.gameMode === 'solo' && this.ai && this.players[1]) {
  this.ai.update(
    this.players[1],
    this.players[0],
    this.getArenaRadius(),
    this.width / 2,
    this.height / 2,
    deltaTime
  );
}

// Física de jugadores
for (const player of this.players) {
  this.physics.updatePlayer(player, this.platforms, deltaTime);
}

// Combate
this.combat.update(deltaTime, this.players);

// Plataformas (shrinking)
this.updateShrinking(deltaTime);

// Partículas
this.particles.update(deltaTime);

// Cámara
this.camera.update(this.players, this.width, this.height);

// HUD
this.hud.update(this.roundTimer, this.players, localPlayer);

// Verificar fin de ronda
this.checkRoundEnd();
```

}

updateShrinking(deltaTime) {
if (this.roundTimer > CONFIG.SHRINK_START_TIME) return;

```
this.shrinkTimer += deltaTime;

if (this.shrinkTimer >= this.nextShrinkInterval) {
  this.shrinkTimer = 0;
  this.nextShrinkInterval = 4 + Math.random() * 3;

  const activePlatforms = this.platforms.filter(p => p.active && !p.warning);
  if (activePlatforms.length > 2) {
    const victim = activePlatforms[Math.floor(Math.random() * activePlatforms.length)];
    victim.startWarning();

    // Mostrar advertencia visual
    const warningEl = document.getElementById('phaseWarning');
    warningEl?.classList.remove('show');
    void warningEl?.offsetWidth;
    warningEl?.classList.add('show');
  }
}

// Actualizar plataformas en warning
for (const platform of this.platforms) {
  const result = platform.update(deltaTime);
  if (result === 'destroyed') {
    this.particles.platformBreak(platform.x, platform.y);
  }
}
```

}

checkRoundEnd() {
if (!this.roundActive) return;

```
const alivePlayers = this.players.filter(p => p.isAlive);

if (alivePlayers.length <= 1 || this.roundTimer <= 0) {
  this.endRound(alivePlayers);
}
```

}

endRound(alivePlayers) {
this.roundActive = false;
clearInterval(this.roundTimerInterval);

```
let winner = null;

if (alivePlayers.length === 1) {
  winner = alivePlayers[0];
} else if (alivePlayers.length > 1) {
  // Por kills si hay timeout
  winner = this.players.reduce((a, b) => (a.kills > b.kills) ? a : b);
}

if (winner) {
  this.matchScores[winner.id]++;
}

this.showRoundEnd(winner);
```

}

showRoundEnd(winner) {
const isMatchEnd = this.matchScores[0] >= CONFIG.WIN_ROUNDS ||
this.matchScores[1] >= CONFIG.WIN_ROUNDS;

```
this.screens.showRoundEnd(
  this.currentRound,
  winner,
  this.matchScores,
  this.players,
  isMatchEnd,
  () => {
    this.currentRound++;
    this.startRound();
  }
);

if (isMatchEnd) {
  setTimeout(() => this.showMatchEnd(), 3000);
}
```

}

showMatchEnd() {
const winner = this.matchScores[0] > this.matchScores[1]
? this.players[0]
: this.players[1];

```
this.screens.showMatchEnd(winner, this.matchScores, this.players);

// Confeti
this.spawnConfetti(winner.color);
```

}

spawnConfetti(color) {
const layer = document.getElementById(‘confettiLayer’);
if (!layer) return;

```
const colors = [color, '#fff', '#ffd700', '#ff00aa', '#00f5ff'];

for (let i = 0; i < 55; i++) {
  const el = document.createElement('div');
  const c = colors[i % colors.length];
  el.style.cssText = `
    position: absolute;
    width: ${4 + Math.random() * 6}px;
    height: ${8 + Math.random() * 10}px;
    background: ${c};
    border-radius: 2px;
    left: ${Math.random() * 100}%;
    top: -20px;
    animation: confetti-fall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 1.5}s forwards;
    transform: rotate(${Math.random() * 360}deg);
  `;
  layer.appendChild(el);
}

// CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes confetti-fall {
    to {
      top: 110%;
      transform: rotate(${720 + Math.random() * 720}deg);
    }
  }
`;
layer.appendChild(style);

setTimeout(() => layer.innerHTML = '', 6000);
```

}

render(time) {
this.renderer.clear();
this.renderer.drawBackground(this.width, this.height);

```
if (this.state === GAME_STATES.PLAYING ||
  this.state === GAME_STATES.ROUND_END ||
  this.state === GAME_STATES.MATCH_END) {

  this.camera.apply(this.renderer.ctx, this.width, this.height);

  this.renderer.drawArena(
    this.width / 2,
    this.height / 2,
    this.getArenaRadius()
  );

  this.renderer.drawPlatforms(this.platforms, time);
  this.renderer.drawParticleSystem(this.particles);
  this.renderer.drawPlayers(this.players, time);

  this.camera.restore(this.renderer.ctx);

  // Joystick en espacio de pantalla
  if (this.touch) {
    this.renderer.drawJoystick(this.touch);
  }
}
```

}

// ═══════════════════════════════════════════════════════════
// POST-MATCH
// ═══════════════════════════════════════════════════════════

rematch() {
this.matchScores = [0, 0];
this.currentRound = 1;
this.screens.hideAllOverlays();
this.screens.runCountdown().then(() => this.startRound());
}

returnToMenu() {
this.roundActive = false;
clearInterval(this.roundTimerInterval);

```
this.players = [];
this.platforms = [];
this.particles.clear();

this.canvas.style.pointerEvents = 'none';
document.getElementById('confettiLayer').innerHTML = '';

this.hud.hide();
this.screens.hideAllOverlays();
this.screens.show('screenHome');

this.state = GAME_STATES.HOME;
```

}
}