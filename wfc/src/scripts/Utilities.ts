
import { TILESET_REGISTRY } from "./wfc/TilesetRegistry";
import { Tileset, TilesetNumeric } from "./interfaces/TilesSet";
import { Cell } from "./wfc/Cell";


export type MaterialsType = 'simple' | 'textured'

export type Direction = 'up' | 'down' | 'left' | 'right' | 'forward' | 'back';

export const DIRECTIONS: { name: Direction, dx: number, dy: number, dz: number, opposite: Direction }[] = [
    { name: 'up',    dx: 0, dy: 1, dz: 0, opposite: 'down' },
    { name: 'down',  dx: 0, dy:-1, dz: 0, opposite: 'up' },
    { name: 'left',  dx:-1, dy: 0, dz: 0, opposite: 'right' },
    { name: 'right', dx: 1, dy: 0, dz: 0, opposite: 'left' },
    { name: 'forward', dx: 0, dy: 0, dz: 1, opposite: 'back' },
    { name: 'back',    dx: 0, dy: 0, dz:-1, opposite: 'forward' },
];

export type CollapsedNeighbors = { [key in Direction]?: Cell };

export async function LoadTileset(name: string): Promise<any> {
  const path = TILESET_REGISTRY.get(name);
  if (!path) {
    throw new Error(`Tileset "${name}" não encontrado no registro.`);
  }

  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Erro ao carregar tileset "${name}": ${response.statusText}`);
  }

  const json = await response.json();

  // if (json.type === "numeric")
  //   return json as TilesetNumeric;
  // else
  //   return json as Tileset;


  return json;
}

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