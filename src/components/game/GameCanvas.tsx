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
interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  active: boolean;
  color: string;
}
interface RemotePlayer extends Player {
  id: string;
}

const CW = 1100;
const CH = 1000;
const IR = Math.min(CW, CH) / 2 - 50;
const ICX = CW / 2;
const ICY = CH / 2;
const PLAYER_SIZE = 20;
const PLAYER_COLOR = '#fff';
const PLAYER_SPEED = 6;
const BULLET_SPEED = 12;
const BULLET_RADIUS = 5;
const BULLET_COLOR = '#ff0';
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
  const [player, setPlayer] = useState<Player>({
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
  });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const [socket, setSocket] = useState<Socket | null>(null);

  // Conexão socket.io
  useEffect(() => {
    const s = io({ path: SOCKET_PATH });
    setSocket(s);
    s.on('players', (remotePlayers: Record<string, RemotePlayer>) => {
      setPlayers(remotePlayers);
    });
    return () => { s.disconnect(); };
  }, []);

  // Movimento com mouse
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !socket) return;
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
      } else if (e.button === 2) {
        setBullets((prev) => {
          const angle = Math.atan2(my - player.y, mx - player.x);
          return [
            ...prev,
            {
              x: player.x,
              y: player.y,
              vx: BULLET_SPEED * Math.cos(angle),
              vy: BULLET_SPEED * Math.sin(angle),
              active: true,
              color: BULLET_COLOR,
            },
          ];
        });
      }
    };
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => {
      canvas.removeEventListener('mousedown', handleClick);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [player.x, player.y, socket]);

  // Loop principal
  useEffect(() => {
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
      setBullets((prev) =>
        prev
          .map((b) => {
            if (!b.active) return b;
            const nx = b.x + b.vx;
            const ny = b.y + b.vy;
            if (Math.hypot(nx - ICX, ny - ICY) > IR) {
              return { ...b, active: false };
            }
            return { ...b, x: nx, y: ny };
          })
          .filter((b) => b.active)
      );
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [socket]);

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
    });
    // Player local
    if (player.alive) {
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
    }
    bullets.forEach((b) => {
      ctx.beginPath();
      ctx.arc(b.x, b.y, BULLET_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = b.color;
      ctx.fill();
    });
    ctx.fillStyle = '#fff';
    ctx.font = '32px sans-serif';
    ctx.fillText('Jogo BR na Ilha (React/Next.js)', 40, 60);
    ctx.font = '18px sans-serif';
    ctx.fillText('Compartilhe seu IP local para jogar com seu filho!', 40, 90);
  }, [player, players, bullets, width, height]);

  return (
    <div className="flex flex-col items-center justify-center">
      <canvas ref={canvasRef} width={width} height={height} className="rounded-lg border border-gray-700 bg-black" />
      <div className="mt-4 text-gray-300">Acesse: http://SEU_IP_LOCAL:3000 em outro dispositivo na mesma rede</div>
    </div>
  );
}