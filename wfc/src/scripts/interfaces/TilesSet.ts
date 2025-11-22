import { TileDefinition, TileDefinitionNumeric } from "./TilesDefinition";
import { TileRules, TileRulesNumeric } from "./TilesRules";
import { AffinitiesNumeric } from "./AffinitiesNumeric";

export interface Tileset {
  name: string;
  tiles: TileDefinition[];
  rules: TileRules;
}

export interface TilesetNumeric {
    name: string;
    type: string;
    idMap: { [key: string]: number }; 
    tileData: TileDefinitionNumeric[];
    weights: number[]; 
    rules: TileRulesNumeric[]; 
    affinities: AffinitiesNumeric;
}