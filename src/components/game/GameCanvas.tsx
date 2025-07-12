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

const CW = 400;
const CH = 700;
const IR = Math.min(CW, CH) / 2 - 50;
const ICX = CW / 2;
const ICY = CH / 2;
const PLAYER_SIZE = 20;
// const PLAYER_COLOR = '#fff';
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

// Skins disponíveis
export const SKINS = [
  { name: 'Azul', color: '#4fc3f7', draw: (ctx: CanvasRenderingContext2D, size: number) => {
    // Fantasma azul
    ctx.beginPath();
    ctx.moveTo(-size, size);
    ctx.lineTo(-size, 0);
    ctx.quadraticCurveTo(-size, -size, 0, -size);
    ctx.quadraticCurveTo(size, -size, size, 0);
    ctx.lineTo(size, size);
    for (let i = 3; i >= -3; i -= 2) {
      ctx.quadraticCurveTo(i * size / 6, size * 1.2, (i - 1) * size / 6, size);
    }
    ctx.closePath();
    ctx.fillStyle = '#4fc3f7';
    ctx.fill();
    // Olhos
    ctx.beginPath();
    ctx.arc(-size / 3, -size / 3, size / 5, 0, 2 * Math.PI);
    ctx.arc(size / 3, -size / 3, size / 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Pupilas
    ctx.beginPath();
    ctx.arc(-size / 3, -size / 3, size / 10, 0, 2 * Math.PI);
    ctx.arc(size / 3, -size / 3, size / 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();
  } },
  { name: 'Laranja', color: '#ffb300', draw: (ctx: CanvasRenderingContext2D, size: number) => {
    // Fantasma laranja
    ctx.beginPath();
    ctx.moveTo(-size, size);
    ctx.lineTo(-size, 0);
    ctx.quadraticCurveTo(-size, -size, 0, -size);
    ctx.quadraticCurveTo(size, -size, size, 0);
    ctx.lineTo(size, size);
    for (let i = 3; i >= -3; i -= 2) {
      ctx.quadraticCurveTo(i * size / 6, size * 1.2, (i - 1) * size / 6, size);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffb300';
    ctx.fill();
    // Olhos
    ctx.beginPath();
    ctx.arc(-size / 3, -size / 3, size / 5, 0, 2 * Math.PI);
    ctx.arc(size / 3, -size / 3, size / 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Pupilas
    ctx.beginPath();
    ctx.arc(-size / 3, -size / 3, size / 10, 0, 2 * Math.PI);
    ctx.arc(size / 3, -size / 3, size / 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();
  } },
  { name: 'Rosa', color: '#e573c7', draw: (ctx: CanvasRenderingContext2D, size: number) => {
    // Fantasma rosa
    ctx.beginPath();
    ctx.moveTo(-size, size);
    ctx.lineTo(-size, 0);
    ctx.quadraticCurveTo(-size, -size, 0, -size);
    ctx.quadraticCurveTo(size, -size, size, 0);
    ctx.lineTo(size, size);
    for (let i = 3; i >= -3; i -= 2) {
      ctx.quadraticCurveTo(i * size / 6, size * 1.2, (i - 1) * size / 6, size);
    }
    ctx.closePath();
    ctx.fillStyle = '#e573c7';
    ctx.fill();
    // Olhos
    ctx.beginPath();
    ctx.arc(-size / 3, -size / 3, size / 5, 0, 2 * Math.PI);
    ctx.arc(size / 3, -size / 3, size / 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff';
    ctx.fill();
    // Pupilas
    ctx.beginPath();
    ctx.arc(-size / 3, -size / 3, size / 10, 0, 2 * Math.PI);
    ctx.arc(size / 3, -size / 3, size / 10, 0, 2 * Math.PI);
    ctx.fillStyle = '#222';
    ctx.fill();
  } },
  { name: 'Abóbora', color: '#ff9800', draw: (ctx: CanvasRenderingContext2D, size: number) => {
    // Corpo abóbora
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.95, size * 0.95, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff9800';
    ctx.shadowColor = '#ffb300';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Gomos
    ctx.strokeStyle = '#e65100';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.7, size * 0.95, i * 0.18, 0, 2 * Math.PI);
      ctx.stroke();
    }
    // Olhos e boca (jack-o-lantern)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.15);
    ctx.lineTo(-size * 0.15, -size * 0.35);
    ctx.lineTo(0, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(size * 0.3, -size * 0.15);
    ctx.lineTo(size * 0.15, -size * 0.35);
    ctx.lineTo(0, -size * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-size * 0.18, size * 0.18);
    ctx.lineTo(0, size * 0.28);
    ctx.lineTo(size * 0.18, size * 0.18);
    ctx.lineTo(0, size * 0.22);
    ctx.closePath();
    ctx.fill();
    // Cabinho
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.95);
    ctx.lineTo(0, -size * 1.15);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#6d4c41';
    ctx.stroke();
    ctx.restore();
  } },
  { name: 'Abacaxi', color: '#ffe066', draw: (ctx: CanvasRenderingContext2D, size: number) => {
    // Corpo abacaxi
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, 0, size * 0.9, size * 1.1, 0, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = '#ffd54f';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Textura quadriculada
    ctx.strokeStyle = '#e1a800';
    ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.9 + i * size * 0.3, -size * 1.1);
      ctx.lineTo(-size * 0.9 + i * size * 0.3, size * 1.1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-size, -size * 0.7 + i * size * 0.3);
      ctx.lineTo(size, -size * 0.7 + i * size * 0.3);
      ctx.stroke();
    }
    // Folhas
    ctx.beginPath();
    ctx.moveTo(0, -size * 1.1);
    ctx.lineTo(-size * 0.2, -size * 1.4);
    ctx.lineTo(0, -size * 1.25);
    ctx.lineTo(size * 0.2, -size * 1.4);
    ctx.lineTo(0, -size * 1.1);
    ctx.closePath();
    ctx.fillStyle = '#388e3c';
    ctx.fill();
    ctx.restore();
  } },
];

// Recebe skinIndex como prop obrigatória
export function GameCanvas({ skinIndex = 0 }: { skinIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState<Player & { name: string; skinIndex: number }>(
    {
      x: CW / 2,
      y: CH / 2,
      tx: CW / 2,
      ty: CH / 2,
      color: SKINS[0].color,
      alive: true,
      size: PLAYER_SIZE,
      angle: 0,
      health: 100,
      maxHealth: 100,
      name: '',
      skinIndex: 0,
    }
  );
  const [players, setPlayers] = useState<Record<string, RemotePlayer>>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [joined, setJoined] = useState(false);
  const [inputName, setInputName] = useState('');
  const [dimensions, setDimensions] = useState({ width: CW, height: CH });
// const [skinIndexState, setSkinIndex] = useState(0);
  // Efeito de neve
  const SNOW_COUNT = 60;
  const [snow, setSnow] = useState<{x:number,y:number,r:number,speed:number}[]>(() =>
    Array.from({length: SNOW_COUNT}, () => ({
      x: Math.random() * CW,
      y: Math.random() * CH,
      r: 2 + Math.random() * 2,
      speed: 0.7 + Math.random() * 1.2
    }))
  );

  // Força modo retrato mobile
  useEffect(() => {
    const update = () => {
      const isMobile = window.innerWidth <= 600;
      if (!isMobile) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;width:100vw;font-size:2rem;text-align:center;">Acesse pelo celular em modo vertical</div>';
        return;
      }
      if (window.innerHeight < window.innerWidth) {
        document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;width:100vw;font-size:2rem;text-align:center;">Vire o celular para o modo vertical</div>';
        return;
      }
      setDimensions({ width: CW, height: CH });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Conexão socket.io
  useEffect(() => {
    if (!joined) return;
    const s = io({ path: SOCKET_PATH });
    setSocket(s);
    s.emit('join', { name: player.name });
    s.on('players', (remotePlayers: Record<string, RemotePlayer>) => {
      setPlayers(remotePlayers);
    });
    return () => { s.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joined]);

  // Movimento com mouse e toque (mobile)
  useEffect(() => {
    if (!socket || !joined) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (e.button === 0) {
        setPlayer((p) => {
          const next = { ...p, tx: mx, ty: my };
          socket.emit('move', { tx: mx, ty: my, name: p.name });
          return next;
        });
      }
    };
    // Suporte a toque para mobile
    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const mx = e.touches[0].clientX - rect.left;
        const my = e.touches[0].clientY - rect.top;
        setPlayer((p) => {
          const next = { ...p, tx: mx, ty: my };
          socket.emit('move', { tx: mx, ty: my, name: p.name });
          return next;
        });
      }
    };
    canvas.addEventListener('mousedown', handleClick);
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    return () => {
      canvas.removeEventListener('mousedown', handleClick);
      canvas.removeEventListener('touchstart', handleTouch);
      canvas.removeEventListener('touchmove', handleTouch);
      canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
    };
  }, [player.x, player.y, socket, joined]);

  // Loop principal
  useEffect(() => {
    if (!joined) return;
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
        if (socket) socket.emit('move', { x: clamped.x, y: clamped.y, angle, name: p.name });
        return { ...p, x: clamped.x, y: clamped.y, angle };
      });
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [socket, joined]);

  // Atualiza neve
  useEffect(() => {
    if (!joined) return;
    let anim: number;
    const step = () => {
      setSnow((flakes) => flakes.map(f => {
        let ny = f.y + f.speed;
        const nx = f.x + Math.sin(ny / 18) * 1.2;
        if (ny > CH) ny = CH;
        return { ...f, x: nx, y: ny };
      }));
      anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
    return () => cancelAnimationFrame(anim);
  }, [joined]);

  // Renderização
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    ctx.fillStyle = '#2e7d32'; // fundo verde
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    // Neve acumulada
    ctx.save();
    ctx.fillStyle = '#fff';
    snow.forEach(f => {
      if (f.y >= CH - 2) {
        ctx.beginPath();
        ctx.arc(f.x, CH - 2, f.r, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    ctx.restore();
    // Neve caindo
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#fff';
    snow.forEach(f => {
      if (f.y < CH - 2) {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
    ctx.restore();
    // Coração central mais bonito
    ctx.save();
    ctx.translate(CW / 2, CH / 2);
    ctx.scale(8, 8);
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.bezierCurveTo(2, -2, 8, -2, 8, 3);
    ctx.bezierCurveTo(8, 8, 0, 12, 0, 16);
    ctx.bezierCurveTo(0, 12, -8, 8, -8, 3);
    ctx.bezierCurveTo(-8, -2, -2, -2, 0, 2);
    ctx.closePath();
    ctx.shadowColor = '#fff';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#e63946';
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
    // Texto central mais destacado
    ctx.save();
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#e63946';
    ctx.lineWidth = 6;
    ctx.strokeText('papai te ama!', CW / 2, CH / 2 + 90);
    ctx.fillText('papai te ama!', CW / 2, CH / 2 + 90);
    ctx.restore();
    // Árvores
    const trees = [
      { x: 80, y: 120, s: 1.1 },
      { x: 320, y: 200, s: 1.2 },
      { x: 100, y: 600, s: 1 },
      { x: 350, y: 500, s: 1.3 },
      { x: 200, y: 350, s: 0.9 },
    ];
    trees.forEach(({ x, y, s }) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s, s);
      // Tronco
      ctx.beginPath();
      ctx.rect(-7, 20, 14, 30);
      ctx.fillStyle = '#8d5524';
      ctx.fill();
      // Copa
      ctx.beginPath();
      ctx.arc(0, 10, 28, 0, 2 * Math.PI);
      ctx.fillStyle = '#388e3c';
      ctx.shadowColor = '#2e7d32';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    });
    // Casa
    ctx.save();
    ctx.translate(300, 120);
    ctx.scale(1.2, 1.2);
    // Corpo
    ctx.beginPath();
    ctx.rect(-30, 0, 60, 50);
    ctx.fillStyle = '#ffe082';
    ctx.fill();
    // Telhado
    ctx.beginPath();
    ctx.moveTo(-36, 0);
    ctx.lineTo(0, -32);
    ctx.lineTo(36, 0);
    ctx.closePath();
    ctx.fillStyle = '#b71c1c';
    ctx.fill();
    // Porta
    ctx.beginPath();
    ctx.rect(-8, 25, 16, 25);
    ctx.fillStyle = '#6d4c41';
    ctx.fill();
    // Janela
    ctx.beginPath();
    ctx.arc(15, 20, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#90caf9';
    ctx.fill();
    ctx.restore();
    // Outros players
    Object.values(players).forEach((rp) => {
      if (!rp.alive) return;
      ctx.save();
      ctx.translate(rp.x, rp.y);
      const skin = SKINS.find(s => s.color === rp.color) || SKINS[0];
      skin.draw(ctx, PLAYER_SIZE);
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(rp.name, rp.x - 20, rp.y - 40);
    });
    // Player local
    if (player.alive && joined) {
      ctx.save();
      ctx.translate(player.x, player.y);
      const skin = SKINS[player.skinIndex ?? skinIndex] || SKINS[0];
      skin.draw(ctx, player.size);
      ctx.restore();
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(player.name, player.x - 20, player.y - 40);
    }
    // Efeitos visuais extras: brilho no fantasma local
    if (player.alive && joined) {
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(player.x, player.y, player.size * 1.7, 0, 2 * Math.PI);
      ctx.fillStyle = '#fffde7';
      ctx.shadowColor = '#fffde7';
      ctx.shadowBlur = 18;
      ctx.fill();
      ctx.restore();
    }
  }, [player, players, dimensions, joined, skinIndex, snow]);

  // Atualiza cor e skin do player ao trocar skinIndex
  useEffect(() => {
    setPlayer((p) => ({
      ...p,
      color: SKINS[skinIndex].color,
      skinIndex
    }));
  }, [skinIndex, setPlayer]);

  if (!joined) {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-green-700">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-4">
          <h2 className="text-xl font-bold text-white">Entrar no Jogo</h2>
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
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-green-700">
      <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} className="block w-full h-full" />
    </div>
  );
}

// Preview de skin (canvas inline)
export function SkinPreview({ skin, selected }: { skin: typeof SKINS[0]; selected: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 48, 48);
    skin.draw(ctx, 18);
    if (selected) {
      ctx.save();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#1976d2';
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }
  }, [skin, selected]);
  return <canvas ref={ref} width={48} height={48} style={{ background: 'transparent', borderRadius: 12 }} />;
}