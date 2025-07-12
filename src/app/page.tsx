"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import GameLobby from '../components/GameLobby';

// Importação dinâmica para evitar problemas de SSR
const GameRoot = dynamic(() => import('../game/GameRoot').then(m => ({ default: m.GameRoot })), { ssr: false });

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);

  if (!gameStarted) {
    return <GameLobby onGameStart={() => setGameStarted(true)} />;
  }

  return (
    <main className="w-full h-screen">
      <GameRoot />
    </main>
  );
}
