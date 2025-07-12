import { create } from 'zustand';
import { supabase } from './supabaseClient';

interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  color: string;
  lastUpdate: number;
}

interface GameState {
  players: Map<string, Player>;
  myPlayerId: string;
  roomCode: string;
  isConnected: boolean;
  addPlayer: (player: Player) => void;
  updatePlayer: (id: string, data: Partial<Player>) => void;
  removePlayer: (id: string) => void;
  setMyPlayerId: (id: string) => void;
  setRoomCode: (code: string) => void;
  setConnected: (connected: boolean) => void;
}

export const useGameStore = create<GameState>((set) => ({
  players: new Map(),
  myPlayerId: '',
  roomCode: '',
  isConnected: false,
  
  addPlayer: (player) => set((state) => {
    const newPlayers = new Map(state.players);
    newPlayers.set(player.id, player);
    return { players: newPlayers };
  }),
  
  updatePlayer: (id, data) => set((state) => {
    const newPlayers = new Map(state.players);
    const existing = newPlayers.get(id);
    if (existing) {
      newPlayers.set(id, { ...existing, ...data });
    }
    return { players: newPlayers };
  }),
  
  removePlayer: (id) => set((state) => {
    const newPlayers = new Map(state.players);
    newPlayers.delete(id);
    return { players: newPlayers };
  }),
  
  setMyPlayerId: (id) => set({ myPlayerId: id }),
  setRoomCode: (code) => set({ roomCode: code }),
  setConnected: (connected) => set({ isConnected: connected })
}));

// Sistema de sincronização em tempo real
export class GameSync {
  private channel: ReturnType<typeof supabase.channel> | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  
  async joinRoom(roomCode: string, playerName: string): Promise<string> {
    const playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Configurar canal Supabase
    this.channel = supabase.channel(`game_room_${roomCode}`)
      .on('broadcast', { event: 'player_update' }, (payload) => {
        const { player } = payload.payload;
        if (player.id !== useGameStore.getState().myPlayerId) {
          useGameStore.getState().updatePlayer(player.id, player);
        }
      })
      .on('broadcast', { event: 'player_left' }, (payload) => {
        const { playerId } = payload.payload;
        useGameStore.getState().removePlayer(playerId);
      })
      .subscribe();
    
    // Registrar presença
    await this.channel.track({
      id: playerId,
      name: playerName,
      x: 400,
      y: 300,
      color: this.generatePlayerColor(),
      lastUpdate: Date.now()
    });
    
    useGameStore.getState().setMyPlayerId(playerId);
    useGameStore.getState().setRoomCode(roomCode);
    useGameStore.getState().setConnected(true);
    
    return playerId;
  }
  
  async updateMyPosition(x: number, y: number) {
    const { myPlayerId } = useGameStore.getState();
    if (!this.channel || !myPlayerId) return;
    
    const player = {
      id: myPlayerId,
      x: Math.round(x),
      y: Math.round(y),
      lastUpdate: Date.now()
    };
    
    await this.channel.send({
      type: 'broadcast',
      event: 'player_update',
      payload: { player }
    });
  }
  
  async leaveRoom() {
    const { myPlayerId } = useGameStore.getState();
    
    if (this.channel && myPlayerId) {
      await this.channel.send({
        type: 'broadcast',
        event: 'player_left',
        payload: { playerId: myPlayerId }
      });
      
      await this.channel.unsubscribe();
      this.channel = null;
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    useGameStore.getState().setConnected(false);
  }
  
  private generatePlayerColor(): string {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', '#FF9FF3', '#54A0FF'];
    return colors[Math.floor(Math.random() * colors.length)];
  }
}

export const gameSync = new GameSync();
