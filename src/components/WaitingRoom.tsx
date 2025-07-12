import { useEffect, useState } from "react";
import io, { Socket } from "socket.io-client";

interface Player {
  id: string;
  name: string;
}

let socket: Socket | null = null;

export function WaitingRoom({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!show) return;
    if (!socket) socket = io("/", { transports: ["websocket"] });
    socket.on("players", (data: Player[]) => setPlayers(data));
    return () => {
      socket?.off("players");
    };
  }, [show]);

  const handleJoin = () => {
    if (name.trim() && socket) {
      socket.emit("join", name.trim());
      setJoined(true);
    }
  };

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90">
      <div className="flex flex-col items-center gap-6 px-8 py-6 rounded-xl border-4 border-yellow-400 shadow-2xl" style={{ fontFamily: 'Press Start 2P, monospace' }}>
        <span className="text-3xl text-yellow-300 mb-2 pixel-shadow">Sala de Espera</span>
        {!joined ? (
          <>
            <input
              className="text-lg px-4 py-2 rounded bg-gray-800 text-yellow-200 border-2 border-yellow-400 text-center mb-4 pixel-shadow"
              placeholder="Digite seu nome..."
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={16}
              autoFocus
              style={{ fontFamily: 'inherit' }}
            />
            <button
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-xl px-8 py-3 rounded-full shadow-xl pixel-shadow"
              onClick={handleJoin}
            >
              Entrar
            </button>
          </>
        ) : (
          <>
            <span className="text-lg text-yellow-200 mb-2">Jogadores conectados:</span>
            <ul className="flex flex-col gap-2 items-center">
              {players.map((p) => (
                <li key={p.id} className="bg-gray-800 text-yellow-300 px-4 py-2 rounded pixel-shadow text-center w-48">
                  {p.name}
                </li>
              ))}
            </ul>
            <button
              className="bg-red-600 hover:bg-red-700 text-white font-bold text-xl px-8 py-3 rounded-full shadow-xl mt-6 pixel-shadow"
              onClick={onClose}
            >
              Sair
            </button>
          </>
        )}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        .pixel-shadow { text-shadow: 2px 2px 0 #222, 4px 4px 0 #000; }
      `}</style>
    </div>
  );
}
