export interface TileRules {
  [tileId: string]: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
  };
}