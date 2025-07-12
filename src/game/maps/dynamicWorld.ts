// Sistema de geração de mundo dinâmico 2.5D
// Com árvores, casas, profundidade e elementos interativos

export interface WorldObject {
  x: number;
  y: number;
  type: 'tree' | 'house' | 'rock' | 'bush' | 'flower' | 'lamp' | 'well' | 'fence';
  size: 'small' | 'medium' | 'large';
  depth: number; // Para depth sorting
  isInteractive?: boolean;
  hidingSpot?: boolean;
  color?: string;
  variant?: number; // Para diferentes sprites/modelos
}

export interface WorldRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'forest' | 'village' | 'field' | 'garden' | 'plaza';
  density: number; // 0.1 a 1.0
}

export interface DynamicWorld {
  width: number;
  height: number;
  objects: WorldObject[];
  regions: WorldRegion[];
  paths: { x: number; y: number }[][]; // Caminhos entre áreas
}

// Gera clusters orgânicos de objetos
const generateCluster = (
  centerX: number, 
  centerY: number, 
  radius: number, 
  type: WorldObject['type'],
  count: number
): WorldObject[] => {
  const objects: WorldObject[] = [];
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    objects.push({
      x: Math.round(x / 32) * 32,
      y: Math.round(y / 32) * 32,
      type,
      size: Math.random() > 0.7 ? 'large' : Math.random() > 0.4 ? 'medium' : 'small',
      depth: y, // Y-sorting para 2.5D
      hidingSpot: type === 'tree' || type === 'bush' || type === 'rock',
      variant: Math.floor(Math.random() * 3) + 1,
      color: type === 'flower' ? ['#ff6b9d', '#4ecdc4', '#ffe66d', '#ff8b6b'][Math.floor(Math.random() * 4)] : undefined
    });
  }
  
  return objects;
};

// Gera uma vila com casas organizadas
const generateVillage = (centerX: number, centerY: number, size: number): WorldObject[] => {
  const objects: WorldObject[] = [];
  const houseCount = Math.floor(size / 100) + 3;
  
  // Casas em formato de círculo/praça
  for (let i = 0; i < houseCount; i++) {
    const angle = (i / houseCount) * Math.PI * 2;
    const distance = size * 0.6;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    objects.push({
      x: Math.round(x / 64) * 64,
      y: Math.round(y / 64) * 64,
      type: 'house',
      size: ['small', 'medium', 'large'][Math.floor(Math.random() * 3)] as 'small' | 'medium' | 'large',
      depth: y,
      isInteractive: true,
      hidingSpot: true,
      variant: Math.floor(Math.random() * 4) + 1
    });
  }
  
  // Adicionar elementos decorativos da vila
  const decorCount = Math.floor(size / 80);
  for (let i = 0; i < decorCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * size * 0.4;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    
    const decorTypes: WorldObject['type'][] = ['lamp', 'well', 'flower', 'fence'];
    objects.push({
      x: Math.round(x / 32) * 32,
      y: Math.round(y / 32) * 32,
      type: decorTypes[Math.floor(Math.random() * decorTypes.length)],
      size: 'small',
      depth: y,
      isInteractive: Math.random() > 0.7,
      variant: Math.floor(Math.random() * 2) + 1
    });
  }
  
  return objects;
};

// Gera caminhos naturais entre regiões
const generatePath = (from: { x: number; y: number }, to: { x: number; y: number }): { x: number; y: number }[] => {
  const path: { x: number; y: number }[] = [];
  const steps = Math.floor(Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2) / 32);
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Adicionar curvatura natural
    const curve = Math.sin(t * Math.PI) * 50;
    const x = from.x + (to.x - from.x) * t + Math.cos(t * Math.PI * 4) * curve;
    const y = from.y + (to.y - from.y) * t + Math.sin(t * Math.PI * 2) * curve * 0.5;
    
    path.push({
      x: Math.round(x / 16) * 16,
      y: Math.round(y / 16) * 16
    });
  }
  
  return path;
};

// Função principal para gerar mundo dinâmico
export const generateDynamicWorld = (width = 1600, height = 1200): DynamicWorld => {
  const objects: WorldObject[] = [];
  const regions: WorldRegion[] = [];
  const paths: { x: number; y: number }[][] = [];
  
  // Definir regiões principais
  const mainRegions = [
    { x: width * 0.2, y: height * 0.2, w: 200, h: 200, type: 'village' as const },
    { x: width * 0.7, y: height * 0.3, w: 300, h: 250, type: 'forest' as const },
    { x: width * 0.3, y: height * 0.7, w: 250, h: 200, type: 'garden' as const },
    { x: width * 0.8, y: height * 0.8, w: 180, h: 180, type: 'plaza' as const },
    { x: width * 0.1, y: height * 0.6, w: 220, h: 280, type: 'forest' as const }
  ];
  
  // Gerar objetos para cada região
  mainRegions.forEach(region => {
    regions.push({
      x: region.x,
      y: region.y,
      width: region.w,
      height: region.h,
      type: region.type,
      density: Math.random() * 0.4 + 0.6
    });
    
    switch (region.type) {
      case 'village':
        objects.push(...generateVillage(region.x, region.y, Math.min(region.w, region.h)));
        break;
        
      case 'forest':
        // Múltiplos clusters de árvores
        const clusters = Math.floor(Math.min(region.w, region.h) / 80) + 2;
        for (let i = 0; i < clusters; i++) {
          const clusterX = region.x + (Math.random() - 0.5) * region.w * 0.8;
          const clusterY = region.y + (Math.random() - 0.5) * region.h * 0.8;
          const clusterSize = Math.random() * 60 + 40;
          const treeCount = Math.floor(clusterSize / 15) + 4;
          objects.push(...generateCluster(clusterX, clusterY, clusterSize, 'tree', treeCount));
          
          // Arbustos entre árvores
          objects.push(...generateCluster(clusterX, clusterY, clusterSize * 1.3, 'bush', Math.floor(treeCount / 2)));
        }
        break;
        
      case 'garden':
        // Flores organizadas + algumas árvores
        const flowerPatches = 4;
        for (let i = 0; i < flowerPatches; i++) {
          const patchX = region.x + (Math.random() - 0.5) * region.w * 0.6;
          const patchY = region.y + (Math.random() - 0.5) * region.h * 0.6;
          objects.push(...generateCluster(patchX, patchY, 30, 'flower', 8));
        }
        objects.push(...generateCluster(region.x, region.y, Math.min(region.w, region.h) * 0.4, 'tree', 3));
        break;
        
      case 'plaza':
        // Área aberta com alguns elementos decorativos
        objects.push(...generateCluster(region.x, region.y, 40, 'lamp', 3));
        objects.push(...generateCluster(region.x, region.y, 60, 'flower', 6));
        break;
    }
  });
  
  // Gerar caminhos entre regiões
  for (let i = 0; i < mainRegions.length - 1; i++) {
    const from = { x: mainRegions[i].x, y: mainRegions[i].y };
    const to = { x: mainRegions[i + 1].x, y: mainRegions[i + 1].y };
    paths.push(generatePath(from, to));
  }
  
  // Adicionar objetos aleatórios pelo mapa (pedras, arbustos isolados)
  const randomObjects = width * height / 15000; // Densidade baseada no tamanho
  for (let i = 0; i < randomObjects; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    // Evitar sobreposição com regiões principais
    const inRegion = mainRegions.some(r => 
      x > r.x - r.w/2 && x < r.x + r.w/2 && y > r.y - r.h/2 && y < r.y + r.h/2
    );
    
    if (!inRegion) {
      const objectTypes: WorldObject['type'][] = ['rock', 'bush', 'tree'];
      objects.push({
        x: Math.round(x / 32) * 32,
        y: Math.round(y / 32) * 32,
        type: objectTypes[Math.floor(Math.random() * objectTypes.length)],
        size: Math.random() > 0.8 ? 'large' : 'small',
        depth: y,
        hidingSpot: true,
        variant: Math.floor(Math.random() * 3) + 1
      });
    }
  }
  
  // Ordenar objetos por profundidade para renderização 2.5D
  objects.sort((a, b) => a.depth - b.depth);
  
  return {
    width,
    height,
    objects,
    regions,
    paths
  };
};

// Utilitário para verificar se uma posição está livre para spawn
export const isPositionFree = (x: number, y: number, objects: WorldObject[], minDistance = 64): boolean => {
  return !objects.some(obj => {
    const distance = Math.sqrt((obj.x - x) ** 2 + (obj.y - y) ** 2);
    return distance < minDistance;
  });
};

// Encontrar spots seguros para spawn do jogador
export const findSafeSpawnPoints = (world: DynamicWorld, count = 5): { x: number; y: number }[] => {
  const spawnPoints: { x: number; y: number }[] = [];
  let attempts = 0;
  
  while (spawnPoints.length < count && attempts < 100) {
    const x = Math.random() * (world.width - 200) + 100;
    const y = Math.random() * (world.height - 200) + 100;
    
    if (isPositionFree(x, y, world.objects, 80)) {
      spawnPoints.push({ x, y });
    }
    attempts++;
  }
  
  return spawnPoints;
};
