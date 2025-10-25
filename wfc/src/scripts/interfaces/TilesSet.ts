import { TileDefinition } from "./TilesDefinition";
import { TileRules } from "./TilesRules";

export interface Tileset {
  name: string;
  tiles: TileDefinition[];
  rules: TileRules;
}