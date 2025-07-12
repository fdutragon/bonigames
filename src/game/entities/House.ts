// Entidade Casa
export interface House {
  id: string;
  x: number;
  y: number;
  rebuilt: boolean;
}

export const spawnHouses = (count: number, mapWidth: number, mapHeight: number): House[] => {
  const houses: House[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * (mapWidth - 256)) + 128;
    const y = Math.floor(Math.random() * (mapHeight - 256)) + 128;
    houses.push({ id: `house-${i}`, x, y, rebuilt: false });
  }
  return houses;
};
