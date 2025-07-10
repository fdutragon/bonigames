'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Vec2 { x: number; y: number; }
interface Player {
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  alive: boolean;
  size: number;
  angle: number;
  health: number;
  maxHealth: number;
}
interface RemotePlayer extends Player {
  id: string;
  name: string;
}

const CW = 1100;
const CH = 1000;
const IR = Math.min(CW, CH) / 2 - 50;
const ICX = CW / 2;
const ICY = CH / 2;
const PLAYER_SIZE = 20;
const PLAYER_COLOR = '#fff';
const PLAYER_SPEED = 6;
const SOCKET_PATH = '/api/socketio';

function clampToIsland(x: number, y: number): Vec2 {
  const dx = x - ICX;
  const dy = y - ICY;
  const dist = Math.hypot(dx, dy);
  if (dist > IR - PLAYER_SIZE) {
    const ratio = (IR - PLAYER_SIZE) / dist;
    return { x: ICX + dx * ratio, y: ICY + dy * ratio };
  }
  return { x, y };
}

export function GameCanvas({ width = CW, height = CH }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Player & { name: string }>({
    x: ICX,
    y: ICY,
    tx: ICX,
    ty: ICY,
    color: PLAYER_COLOR,
    alive: true,
    size: PLAYER_SIZE,
    angle: 0,
    health: 100,
    maxHealth: 100,
    name: '',
  });
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [inputName, setInputName] = useState('');

  // Conexão socket.io
  useEffect(() => {
    if (!joined) return;
    const s = io({ path: SOCKET_PATH });
    setSocket(s);
    s.emit('join', { name: player.name });
    s.on('players', (remotePlayers: Record<string, RemotePlayer>) => {
      setPlayers(remotePlayers);
      setWaiting(Object.keys(remotePlayers).length < 2);
    });
    return () => { s.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  // Movimento com mouse
  useEffect(() => {
    if (!socket || !joined || waiting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (e.button === 0) {
        setPlayer((p) => {
          const next = { ...p, tx: mx, ty: my };
          socket.emit('move', { tx: mx, ty: my });
          return next;
        });
      }
    };
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => {
      canvas.removeEventListener('mousedown', handleClick);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [player.x, player.y, socket, joined, waiting]);

  // Loop principal
  useEffect(() => {
    if (!joined || waiting) return;
    let anim: number;
    const step = () => {
      setPlayer((p) => {
        if (!p.alive) return p;
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        const dist = Math.hypot(dx, dy);
        let nx = p.x, ny = p.y, angle = p.angle;
        if (dist > 1) {
          angle = Math.atan2(dy, dx);
          nx += PLAYER_SPEED * Math.cos(angle);
          ny += PLAYER_SPEED * Math.sin(angle);
          if (Math.hypot(nx - p.tx, ny - p.ty) > dist) {
            nx = p.tx;
            ny = p.ty;
          }
        }
        const clamped = clampToIsland(nx, ny);
        if (socket) socket.emit('move', { x: clamped.x, y: clamped.y, angle });
        return { ...p, x: clamped.x, y: clamped.y, angle };
      });
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [socket, joined, waiting]);

  // Renderização
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);
    ctx.beginPath();
    ctx.arc(ICX, ICY, IR, 0, 2 * Math.PI);
    ctx.fillStyle = '#2e7d32';
    ctx.fill();
    // Outros players
    Object.values(players).forEach((rp) => {
      if (!rp.alive) return;
      ctx.save();
      ctx.translate(rp.x, rp.y);
      ctx.rotate(rp.angle);
      ctx.fillStyle = rp.color;
      ctx.beginPath();
      ctx.moveTo(-PLAYER_SIZE / 2, -PLAYER_SIZE / 2);
      ctx.lineTo(PLAYER_SIZE, 0);
      ctx.lineTo(-PLAYER_SIZE / 2, PLAYER_SIZE / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#f00';
      ctx.fillRect(rp.x - 20, rp.y - 30, 40, 5);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(rp.x - 20, rp.y - 30, 40 * (rp.health / rp.maxHealth), 5);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(rp.name, rp.x - 20, rp.y - 40);
    });
    // Player local
    if (player.alive && joined) {
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.moveTo(-player.size / 2, -player.size / 2);
      ctx.lineTo(player.size, 0);
      ctx.lineTo(-player.size / 2, player.size / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = '#f00';
      ctx.fillRect(player.x - 20, player.y - 30, 40, 5);
      ctx.fillStyle = '#0f0';
      ctx.fillRect(player.x - 20, player.y - 30, 40 * (player.health / player.maxHealth), 5);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(player.name, player.x - 20, player.y - 40);
    }
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.fillText('Jogo BR na Ilha (React/Next.js)', 40, 60);
    ctx.font = '18px sans-serif';
    if (!joined) {
      ctx.fillText('Digite seu nome e entre na sala', 40, 90);
    } else if (waiting) {
      ctx.fillText('Aguardando outro jogador entrar...', 40, 90);
    }
  }, [player, players, width, height, joined, waiting]);

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Sala de Espera</h2>
          <input
            className="p-2 rounded bg-gray-700 text-white"
            placeholder="Seu nome"
            value={inputName}
            onChange={e => setInputName(e.target.value)}
            maxLength={16}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => {
              if (inputName.trim()) {
                setPlayer(p => ({ ...p, name: inputName.trim() }));
                setJoined(true);
              }
            }}
          >Entrar</button>
        </div>
      </div>
    );
  }
  if (waiting) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Aguardando outro jogador entrar...</h2>
          <div className="text-gray-300">Compartilhe o link e aguarde.</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center">
      <canvas ref={canvasRef} width={width} height={height} className="rounded-lg border border-gray-700 bg-black" />
    </div>
  );
}