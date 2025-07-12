// Entidade Morador com sistema de esconderijo inteligente
export interface Villager {
  id: string;
  x: number;
  y: number;
  found: boolean;
  hidingSpotType: string;
  isVisible: boolean;
  detectionRadius: number;
}

// Spawn moradores apenas em locais de esconderijo
export const spawnVillagers = (count: number, hidingSpots: { x: number; y: number; type: string }[]): Villager[] => {
  const villagers: Villager[] = [];
  
  // Shuffle hiding spots para distribuição aleatória
  const shuffledSpots = [...hidingSpots].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < Math.min(count, shuffledSpots.length); i++) {
    const spot = shuffledSpots[i];
    villagers.push({
      id: `villager-${i}`,
      x: spot.x + 16, // Centralizar no tile
      y: spot.y + 16,
      found: false,
      hidingSpotType: spot.type,
      isVisible: false, // Inicialmente invisível
      detectionRadius: getDetectionRadius(spot.type)
    });
  }
  
  return villagers;
};

// Raio de detecção baseado no tipo de esconderijo
const getDetectionRadius = (spotType: string): number => {
  switch (spotType) {
    case 'tree': return 40; // Mais difícil de encontrar
    case 'bush': return 35;
    case 'rock': return 45;
    case 'house': return 50; // Mais fácil de encontrar
    default: return 40;
  }
};

// Função para verificar se o morador deve ficar visível
export const updateVillagerVisibility = (villager: Villager, playerX: number, playerY: number): boolean => {
  if (villager.found) return false;
  
  const distance = Math.hypot(villager.x - playerX, villager.y - playerY);
  const shouldBeVisible = distance <= villager.detectionRadius;
  
  // Adiciona um pouco de aleatoriedade para simular movimento
  if (shouldBeVisible && Math.random() < 0.1) {
    villager.isVisible = true;
  } else if (!shouldBeVisible) {
    villager.isVisible = false;
  }
  
  return villager.isVisible;
};
