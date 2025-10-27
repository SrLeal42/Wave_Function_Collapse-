
import { TILESET_REGISTRY } from "./wfc/TilesetRegistry";
import { Tileset } from "./interfaces/TilesSet";

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
