
import { TILESET_REGISTRY } from "./wfc/TilesetRegistry";
import { Tileset } from "./interfaces/TilesSet";
import { Cell } from "./wfc/Cell";

export async function LoadTileset(name: string): Promise<Tileset> {
  const path = TILESET_REGISTRY.get(name);
  if (!path) {
    throw new Error(`Tileset "${name}" não encontrado no registro.`);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Erro ao carregar tileset "${name}": ${response.statusText}`);
  }

  return (await response.json()) as Tileset;
}

export type Direction = 'up' | 'down' | 'right' | 'left';
export const DIRECTIONS: { name: Direction, dx: number, dy: number, opposite: Direction }[] = [
    { name: 'up', dx: 0,  dy: 1,  opposite: 'down' },
    { name: 'down', dx: 0,  dy: -1, opposite: 'up' },
    { name: 'right',  dx: 1,  dy: 0,  opposite: 'left'  },
    { name: 'left',  dx: -1, dy: 0,  opposite: 'right'  },
];
export type CollapsedNeighbors = { [key in Direction]?: Cell };

export function ChooseWeightedRandom<T extends { weight?: number }>(items: T[]): T {
  if (items.length === 0) {
    throw new Error("chooseWeightedRandom: items array is empty");
  }

  const totalWeight = items.reduce((sum, item) => sum + (item.weight ?? 1), 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const item of items) {
    cumulative += (item.weight ?? 1);
    if (random < cumulative) {
      return item;
    }
  }

  // fallback (não deve acontecer, mas evita erro de TS)
  return items[items.length - 1];
}

export function ChooseWeightedRandomBy<T>(items: T[], getWeight: (item: T) => number): T {
  const totalWeight = items.reduce((sum, item) => sum + getWeight(item), 0);
  const random = Math.random() * totalWeight;

  let cumulative = 0;
  for (const item of items) {
    cumulative += getWeight(item);
    if (random < cumulative) {
      return item;
    }
  }

  return items[items.length - 1];
}