"use client";

import { Hud } from "@/game/ui/Hud";
import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from "react";
import io, { Socket } from "socket.io-client";
import { Joystick } from "@/game/ui/Joystick";
import { useJoystick } from "@/game/ui/useJoystick";
import { WaitingRoom } from "@/components/WaitingRoom";

const GameRoot = dynamic(() => import("../game/GameRoot").then(m => m.GameRoot), { ssr: false });

function Page() {
  const [skinIndex, setSkinIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [villagersFound, setVillagersFound] = useState(0);
  const [totalVillagers, setTotalVillagers] = useState(8);
  const [showStartMenu, setShowStartMenu] = useState(true);
  const [joined, setJoined] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);
  const setJoystick = useJoystick((s) => s.set);
  const [queueName, setQueueName] = useState("");
  const [queueJoined, setQueueJoined] = useState(false);
  const [queuePlayers, setQueuePlayers] = useState<{ id: string; name: string }[]>([]);
  const socketRef = useRef<Socket | null>(null);

  // Conectar socket para fila na tela inicial
  useEffect(() => {
    if (!showStartMenu) return;
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    socketRef.current = io("/", { transports: ["websocket"] });
    const socket = socketRef.current;
    socket.on("players", (data: any[]) => setQueuePlayers(data));
    socket.on("joined", () => setJoined(true));
    return () => {
      socket.off("players");
      socket.off("joined");
      socket.disconnect();
    };
  }, [showStartMenu]);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const handleVillagerFound = (event: CustomEvent) => {
      setVillagersFound(event.detail.found);
      setTotalVillagers(event.detail.total);
    };
    window.addEventListener('villagerFound', handleVillagerFound as EventListener);
    return () => {
      window.removeEventListener('villagerFound', handleVillagerFound as EventListener);
    };
  }, []);

  useEffect(() => {
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('touchmove', preventDefault, { passive: false });
    document.addEventListener('wheel', preventDefault, { passive: false });
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          }
        } catch (err) {
          console.log('Fullscreen not supported or denied');
        }
      };
      const handleFirstTouch = () => {
        enterFullscreen();
        document.removeEventListener('touchstart', handleFirstTouch);
      };
      document.addEventListener('touchstart', handleFirstTouch);
      return () => {
        document.removeEventListener('touchstart', handleFirstTouch);
      };
    }
    return () => {
      document.removeEventListener('touchmove', preventDefault);
      document.removeEventListener('wheel', preventDefault);
    };
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-gray-900 text-white relative">
      {showStartMenu ? (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-[#23272e] via-[#4e7c3a] to-[#a7d948] animate-fade-in">
          <div className="flex flex-col items-center gap-8 px-10 py-12 rounded-3xl border-8 border-yellow-400 shadow-[0_0_64px_#222] pixel-border relative" style={{ fontFamily: 'Press Start 2P, monospace', background: 'rgba(30,32,34,0.96)' }}>
            <span className="text-5xl font-extrabold tracking-wide text-yellow-300 drop-shadow-lg text-center w-full pixel-shadow animate-title-glow">Floresta dos Esquecidos</span>
            <span className="text-lg text-yellow-100 mb-2 text-center">Jogo de Esconde-Esconde</span>
            <div className="flex flex-row gap-6 items-center justify-center mb-8">
              <div className="w-20 h-20 bg-[#7ec850] border-4 border-[#4e7c3a] rounded pixel-shadow flex items-end justify-center animate-bounce-slow">
                <div className="w-10 h-10 bg-[#267a2b] rounded-full mb-2 animate-pulse"></div>
                <div className="w-5 h-8 bg-[#7a4b1e] rounded-b-lg"></div>
              </div>
              <div className="w-20 h-20 bg-[#bdbdbd] border-4 border-[#757575] rounded pixel-shadow flex items-center justify-center animate-float">
                <div className="w-12 h-10 bg-[#757575] rounded"></div>
              </div>
              <div className="w-20 h-20 bg-[#4fc3f7] border-4 border-[#1976d2] rounded pixel-shadow flex items-center justify-center animate-float-reverse">
                <div className="w-12 h-8 bg-[#1976d2] rounded-full"></div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-4 w-full mt-2 mb-2">
              <input
                className="text-lg px-4 py-2 rounded bg-gray-800 text-yellow-200 border-2 border-yellow-400 text-center pixel-shadow w-64"
                placeholder="Digite seu nome para jogar..."
                value={queueName}
                onChange={e => setQueueName(e.target.value)}
                maxLength={16}
                style={{ fontFamily: 'inherit' }}
                autoFocus
              />
            </div>
            {queuePlayers.length > 0 && (
              <div className="w-full flex flex-col items-center mt-2 mb-2">
                <span className="text-yellow-200 text-sm mb-1">Jogadores conectados:</span>
                <ul className="flex flex-col gap-1 items-center w-full">
                  {queuePlayers.map((p) => (
                    <li key={p.id} className="bg-gray-800 text-yellow-300 px-3 py-1 rounded pixel-shadow text-center w-48 text-xs truncate">
                      {p.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="mt-4 bg-gradient-to-br from-green-400 to-green-700 hover:from-green-500 hover:to-green-800 text-white font-extrabold text-3xl px-12 py-5 rounded-full shadow-2xl transition-all duration-150 pixel-shadow border-4 border-green-900 animate-pop disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => {
                if (queueName.trim()) {
                  if (socketRef.current) {
                    socketRef.current.emit("join", queueName.trim());
                  }
                  setJoined(true);
                  setShowStartMenu(false);
                }
              }}
              disabled={!queueName.trim()}
              autoFocus
            >
              ▶ Start
            </button>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              className="hidden"
              id="mapUpload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (reader.result) {
                      localStorage.setItem('customMap', reader.result as string);
                      alert('Mapa carregado! Clique em Start para jogar no seu mapa personalizado.');
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
            <button
              className="mt-4 bg-gradient-to-br from-blue-400 to-blue-700 hover:from-blue-500 hover:to-blue-800 text-white font-bold text-lg px-8 py-3 rounded-full shadow-xl transition-all duration-150 pixel-shadow border-4 border-blue-900"
              onClick={() => document.getElementById('mapUpload')?.click()}
            >
              📸 Carregar Mapa PNG
            </button>
            {showInstall && (
              <>
                <button
                  className="mt-6 bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-xl px-8 py-4 rounded-full shadow pixel-shadow border-4 border-yellow-700 animate-pop"
                  onClick={async () => {
                    if (deferredPrompt) {
                      deferredPrompt.prompt();
                      const { outcome } = await deferredPrompt.userChoice;
                      if (outcome === 'accepted') setShowInstall(false);
                    }
                  }}
                >
                  Instalar App
                </button>
                <span className="text-xs text-yellow-200 mt-2 text-center animate-fade-in">Toque em "Instalar App" para jogar offline!</span>
              </>
            )}
            <span className="text-xs text-yellow-300 mt-6 text-center opacity-80">Powered by Next.js + Phaser</span>
            <div className="absolute -inset-2 border-4 border-yellow-400 rounded-3xl pointer-events-none pixel-border-glow"></div>
          </div>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
            .pixel-shadow { text-shadow: 2px 2px 0 #222, 4px 4px 0 #000; }
            .pixel-border { box-shadow: 0 0 0 4px #222, 0 0 0 8px #facc15, 0 0 32px #000 inset; }
            .pixel-border-glow { box-shadow: 0 0 32px 8px #facc15, 0 0 0 8px #facc15 inset; border-radius: 2rem; }
            .animate-title-glow { animation: title-glow 2s infinite alternate; }
            @keyframes title-glow { 0% { text-shadow: 2px 2px 0 #222, 4px 4px 0 #000, 0 0 8px #facc15; } 100% { text-shadow: 2px 2px 0 #222, 4px 4px 0 #000, 0 0 32px #facc15; } }
            .animate-bounce-slow { animation: bounce 2.5s infinite; }
            .animate-float { animation: float 3s ease-in-out infinite alternate; }
            .animate-float-reverse { animation: float 3s ease-in-out infinite alternate-reverse; }
            .animate-pop { animation: pop 0.7s cubic-bezier(.68,-0.55,.27,1.55) 1; }
            @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-18px); } }
            @keyframes float { 0% { transform: translateY(0); } 100% { transform: translateY(-10px); } }
            @keyframes pop { 0% { transform: scale(0.7); } 80% { transform: scale(1.1); } 100% { transform: scale(1); } }
            .animate-fade-in { animation: fade-in 1.2s both; }
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          `}</style>
        </div>
      ) : (
        <>
          <Hud villagersFound={villagersFound} totalVillagers={totalVillagers} />
          <Joystick onMove={setJoystick} />
          <div className="fixed top-4 right-4 z-20">
            <button
              className="bg-blue-600 rounded-full w-14 h-14 flex items-center justify-center shadow-lg focus:outline-none"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Abrir menu"
            >
              <span className="text-2xl">☰</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white text-gray-900 rounded-lg shadow-xl border-2 border-blue-800 p-4 z-30 flex flex-col gap-2" style={{ fontFamily: 'Press Start 2P, monospace' }}>
                <span className="text-lg font-bold mb-2 text-blue-900">
                  🎮 Menu do Jogo
                </span>
                <ul className="flex flex-col gap-2">
                  <li><button className="w-full py-2 px-4 rounded bg-blue-100 hover:bg-blue-200 font-semibold" onClick={() => window.location.reload()}>Reiniciar Jogo</button></li>
                  <li><button className="w-full py-2 px-4 rounded bg-green-100 hover:bg-green-200 font-semibold" onClick={() => setShowWaitingRoom(true)}>Entrar na Sala de Espera</button></li>
                  <li><button className="w-full py-2 px-4 rounded bg-yellow-100 hover:bg-yellow-200 font-semibold" onClick={() => alert('Em breve: Configurações!')}>Configurações</button></li>
                  <li><button className="w-full py-2 px-4 rounded bg-gray-300 hover:bg-gray-400 font-bold" onClick={() => setMenuOpen(false)}>Fechar</button></li>
                </ul>
              </div>
            )}
          </div>
          <div className="absolute inset-0 z-0">
            <GameRoot />
          </div>
          {showWaitingRoom && (
            <WaitingRoom show={showWaitingRoom} onClose={() => setShowWaitingRoom(false)} />
          )}
        </>
      )}
    </main>
  );
}

export default Page;
