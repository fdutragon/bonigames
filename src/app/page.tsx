import { GameCanvas } from "@/components/game/GameCanvas";

export function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">BR na Ilha (Next.js)</h1>
      <GameCanvas />
    </main>
  );
}

export default Home;
