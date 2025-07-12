import { Server } from 'socket.io';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';

interface PlayerState {
  id: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  angle: number;
  color: string;
  alive: boolean;
  health: number;
  maxHealth: number;
  name: string;
}

// eslint-disable-next-line prefer-const
let players: Record<string, PlayerState> = {};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // @ts-expect-error Next.js custom server type
  const server: HTTPServer & { io?: Server } = res.socket?.server;
  if (!server) {
    res.status(500).end('Server not available');
    return;
  }
  if (!server.io) {
    const io = new Server(server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    });
    io.on('connection', (socket) => {
      const id = socket.id;
      // Cria player imediatamente, nome vazio
      players[id] = {
        id,
        x: 550,
        y: 500,
        tx: 550,
        ty: 500,
        angle: 0,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16),
        alive: true,
        health: 100,
        maxHealth: 100,
        name: '',
      };
      io.emit('players', players);
      socket.on('join', (data: { name: string }) => {
        if (players[id]) {
          players[id].name = data.name || '';
          io.emit('players', players);
        }
      });
      socket.on('move', (data) => {
        if (players[id]) {
          // Atualiza nome se vier no payload
          const update: Partial<PlayerState> = { ...data };
          if (typeof data.name === 'string' && data.name.trim() !== '') {
            update.name = data.name;
          } else {
            delete update.name;
          }
          players[id] = { ...players[id], ...update };
          io.emit('players', players);
        }
      });
      socket.on('disconnect', () => {
        delete players[id];
        io.emit('players', players);
      });
    });
    server.io = io;
  }
  res.status(200).end();
}
