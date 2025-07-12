// Mapa pequeno otimizado para esconde-esconde (1.280 x 1.280 px)
// Focado em criar muitas áreas de esconderijo

export type Biome = 'forest' | 'mountain' | 'lake' | 'village' | 'desert' | 'clearing';

export interface Tile {
  x: number;
  y: number;
  type: 'grass' | 'tree' | 'dirt' | 'water' | 'sand' | 'rock' | 'house' | 'bush';
  biome: Biome;
  isHidingSpot?: boolean;
}

export interface MapData {
  width: number;
  height: number;
  tiles: Tile[];
  hidingSpots: { x: number; y: number; type: string }[];
}

// Gera grupos de árvores para criar esconderijos naturais
const generateTreeCluster = (centerX: number, centerY: number, radius: number): { x: number; y: number }[] => {
  const trees: { x: number; y: number }[] = [];
  const treeCount = Math.floor(radius / 20) + 3;
  
  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2;
    const distance = Math.random() * radius;
    const x = centerX + Math.cos(angle) * distance;
    const y = centerY + Math.sin(angle) * distance;
    trees.push({ x: Math.round(x / 32) * 32, y: Math.round(y / 32) * 32 });
  }
  
  return trees;
};

export const generateProceduralMap = (width = 1280, height = 1280): MapData => {
  const tiles: Tile[] = [];
  const hidingSpots: { x: number; y: number; type: string }[] = [];
  
  // Criar clusters de árvores (esconderijos)
  const treeClusters = [
    { x: width * 0.2, y: height * 0.2, r: 80 },
    { x: width * 0.7, y: height * 0.3, r: 60 },
    { x: width * 0.3, y: height * 0.6, r: 70 },
    { x: width * 0.8, y: height * 0.7, r: 50 },
    { x: width * 0.1, y: height * 0.8, r: 40 },
    { x: width * 0.6, y: height * 0.1, r: 45 },
  ];
  
  const treePositions = new Set<string>();
  treeClusters.forEach(cluster => {
    const trees = generateTreeCluster(cluster.x, cluster.y, cluster.r);
    trees.forEach(tree => {
      treePositions.add(`${tree.x},${tree.y}`);
      hidingSpots.push({ x: tree.x, y: tree.y, type: 'tree' });
    });
  });
  
  // Define regiões principais (menores para mapa compacto)
  const biomes: { biome: Biome; x: number; y: number; r: number }[] = [
    { biome: 'forest', x: width * 0.25, y: height * 0.25, r: 200 },
    { biome: 'mountain', x: width * 0.75, y: height * 0.2, r: 150 },
    { biome: 'lake', x: width * 0.5, y: height * 0.5, r: 120 },
    { biome: 'village', x: width * 0.3, y: height * 0.75, r: 100 },
    { biome: 'clearing', x: width * 0.7, y: height * 0.8, r: 80 },
  ];
  
  for (let y = 0; y < height; y += 32) {
    for (let x = 0; x < width; x += 32) {
      // Verifica se há árvore nesta posição
      if (treePositions.has(`${x},${y}`)) {
        tiles.push({ x, y, type: 'tree', biome: 'forest', isHidingSpot: true });
        continue;
      }
      
      // Descobre o bioma dominante
      let closest = biomes[0];
      let minDist = Number.MAX_VALUE;
      for (const b of biomes) {
        const dist = Math.hypot(x - b.x, y - b.y) / b.r;
        if (dist < minDist) {
          minDist = dist;
          closest = b;
        }
      }
      
      let type: Tile['type'] = 'grass';
      let isHidingSpot = false;
      
      switch (closest.biome) {
        case 'forest':
          if (Math.random() < 0.3) {
            type = 'bush';
            isHidingSpot = true;
            hidingSpots.push({ x, y, type: 'bush' });
          } else {
            type = 'grass';
          }
          break;
        case 'mountain':
          if (Math.random() < 0.4) {
            type = 'rock';
            isHidingSpot = true;
            hidingSpots.push({ x, y, type: 'rock' });
          } else {
            type = 'dirt';
          }
          break;
        case 'lake':
          type = 'water';
          break;
        case 'village':
          if (Math.random() < 0.15) {
            type = 'house';
            isHidingSpot = true;
            hidingSpots.push({ x, y, type: 'house' });
          } else {
            type = 'dirt';
          }
          break;
        case 'clearing':
          type = 'grass';
          break;
        default:
          type = 'grass';
      }
      
      tiles.push({ x, y, type, biome: closest.biome, isHidingSpot });
    }
  }
  
  return { width, height, tiles, hidingSpots };
};
