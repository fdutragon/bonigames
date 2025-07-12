import React, { useState } from 'react';
import { gameSync } from '../lib/gameStore';

interface GameLobbyProps {
  onGameStart: () => void;
}

export default function GameLobby({ onGameStart }: GameLobbyProps) {
  const [roomCode, setRoomCode] = useState('boni_game_room');
  const [playerName, setPlayerName] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinGame = async () => {
    if (!playerName.trim()) {
      alert('Digite seu nome!');
      return;
    }

    setIsJoining(true);
    
    try {
      await gameSync.joinRoom(roomCode, playerName.trim());
      onGameStart();
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      alert('Erro ao conectar. Tente novamente.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-green-400 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">🏝️ Boni Games</h1>
          <p className="text-gray-600">Encontre os moradores escondidos!</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Seu Nome
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Digite seu nome..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código da Sala
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Código da sala..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleJoinGame}
            disabled={isJoining || !playerName.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            {isJoining ? 'Conectando...' : 'Entrar no Jogo'}
          </button>
        </div>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>💡 Dica: Use o mesmo código de sala para jogar com amigos!</p>
        </div>
      </div>
    </div>
  );
}
