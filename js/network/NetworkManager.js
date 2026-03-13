/**
 * Gestor de red P2P + Signaling
 * WebRTC DataChannels para gameplay en tiempo real
 */

const SIGNALING_URL = 'wss://thumb-titans-signal.glitch.me';

export class NetworkManager {
  constructor() {
    this.ws = null;
    this.peers = new Map(); // id -> RTCPeerConnection
    this.channels = new Map(); // id -> RTCDataChannel
    this.roomCode = null;
    this.myId = null;
    this.isHost = false;
    this.onPlayerJoined = null;
    this.onPlayerLeft = null;
    this.onGameStart = null;
    this.onDataReceived = null;
    this.onError = null;
  }

  get connected() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get peerCount() {
    return this.channels.size;
  }

  // ═══════════════════════════════════════════════════════════
  // SIGNALING
  // ═══════════════════════════════════════════════════════════

  connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(SIGNALING_URL);
        
        this.ws.onopen = () => resolve();
        this.ws.onerror = () => reject(new Error('WebSocket connection failed'));
        this.ws.onmessage = (event) => this.handleSignal(JSON.parse(event.data));
        this.ws.onclose = () => this.cleanup();
        
      } catch (err) {
        reject(err);
      }
    });
  }

  handleSignal(message) {
    switch (message.type) {
      case 'ROOM_CREATED':
        this.myId = message.payload.playerId;
        this.roomCode = message.payload.roomCode;
        this.isHost = true;
        if (this.onPlayerJoined) {
          this.onPlayerJoined({
            id: this.myId,
            isLocal: true
          });
        }
        break;
        
      case 'ROOM_JOINED':
        this.myId = message.payload.playerId;
        this.roomCode = message.payload.roomCode;
        this.isHost = false;
        // Conectar con peers existentes
        message.payload.players?.forEach(player => {
          this.initiateConnection(player.playerId);
        });
        break;
        
      case 'PLAYER_JOINED':
        if (this.onPlayerJoined) {
          this.onPlayerJoined({
            id: message.payload.playerId,
            name: message.payload.playerName,
            color: message.payload.playerColor,
            isLocal: false
          });
        }
        if (this.isHost) {
          this.initiateConnection(message.payload.playerId);
        }
        break;
        
      case 'PLAYER_LEFT':
        this.removePeer(message.payload.playerId);
        if (this.onPlayerLeft) {
          this.onPlayerLeft(message.payload.playerId);
        }
        break;
        
      case 'WEBRTC_OFFER':
        this.handleOffer(message.payload);
        break;
        
      case 'WEBRTC_ANSWER':
        this.handleAnswer(message.payload);
        break;
        
      case 'ICE_CANDIDATE':
        this.handleIceCandidate(message.payload);
        break;
        
      case 'GAME_START':
        if (this.onGameStart) this.onGameStart();
        break;
        
      case 'ERROR':
        if (this.onError) this.onError(message.payload.message);
        break;
    }
  }

  sendSignal(data) {
    if (this.connected) {
      this.ws.send(JSON.stringify(data));
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ROOM MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  createRoom(playerName, playerColor) {
    this.sendSignal({
      type: 'CREATE_ROOM',
      payload: { playerName, playerColor }
    });
  }

  joinRoom(code, playerName, playerColor) {
    this.sendSignal({
      type: 'JOIN_ROOM',
      payload: { roomCode: code, playerName, playerColor }
    });
  }

  startGame() {
    this.sendSignal({
      type: 'GAME_START',
      payload: { roomCode: this.roomCode }
    });
    
    // También enviar por P2P a todos
    this.broadcast({ type: 'GAME_START' });
  }

  leaveRoom() {
    this.cleanup();
  }

  // ═══════════════════════════════════════════════════════════
  // WEBRTC P2P
  // ═══════════════════════════════════════════════════════════

  createPeerConnection(peerId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ICE_CANDIDATE',
          payload: {
            roomCode: this.roomCode,
            targetPlayerId: peerId,
            candidate: event.candidate
          }
        });
      }
    };
    
    pc.ondatachannel = (event) => {
      this.setupDataChannel(event.channel, peerId);
    };
    
    this.peers.set(peerId, pc);
    return pc;
  }

  initiateConnection(peerId) {
    const pc = this.createPeerConnection(peerId);
    
    const channel = pc.createDataChannel('game', {
      ordered: false,
      maxRetransmits: 0
    });
    
    this.setupDataChannel(channel, peerId);
    
    pc.createOffer()
      .then(offer => {
        pc.setLocalDescription(offer);
        this.sendSignal({
          type: 'WEBRTC_OFFER',
          payload: {
            roomCode: this.roomCode,
            targetPlayerId: peerId,
            sdp: offer
          }
        });
      });
  }

  async handleOffer(payload) {
    const pc = this.createPeerConnection(payload.senderId);
    
    await pc.setRemoteDescription(payload.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    
    this.sendSignal({
      type: 'WEBRTC_ANSWER',
      payload: {
        roomCode: this.roomCode,
        targetPlayerId: payload.senderId,
        sdp: answer
      }
    });
  }

  handleAnswer(payload) {
    const pc = this.peers.get(payload.senderId);
    if (pc) {
      pc.setRemoteDescription(payload.sdp);
    }
  }

  handleIceCandidate(payload) {
    const pc = this.peers.get(payload.senderId);
    if (pc) {
      pc.addIceCandidate(payload.candidate);
    }
  }

  setupDataChannel(channel, peerId) {
    this.channels.set(peerId, channel);
    
    channel.onopen = () => {
      console.log(`DataChannel open with ${peerId}`);
    };
    
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (this.onDataReceived) {
          this.onDataReceived(data, peerId);
        }
      } catch (err) {
        // Datos binarios o malformados
      }
    };
    
    channel.onclose = () => {
      this.removePeer(peerId);
    };
  }

  removePeer(peerId) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    this.channels.delete(peerId);
  }

  // ═══════════════════════════════════════════════════════════
  // COMUNICACIÓN DE JUEGO
  // ═══════════════════════════════════════════════════════════

  send(data, targetId = null) {
    const message = JSON.stringify(data);
    
    if (targetId) {
      const channel = this.channels.get(targetId);
      if (channel?.readyState === 'open') {
        channel.send(message);
      }
    } else {
      this.broadcast(data);
    }
  }

  broadcast(data) {
    const message = JSON.stringify(data);
    for (const [id, channel] of this.channels) {
      if (channel.readyState === 'open') {
        channel.send(message);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════
  // LIMPIEZA
  // ═══════════════════════════════════════════════════════════

  cleanup() {
    // Cerrar todos los peers
    for (const [id, pc] of this.peers) {
      pc.close();
    }
    this.peers.clear();
    this.channels.clear();
    
    // Cerrar WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.roomCode = null;
    this.myId = null;
    this.isHost = false;
  }
}
