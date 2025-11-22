export interface TileRules {
  [tileId: string]: {
    up: string[];
    down: string[];
    left: string[];
    right: string[];
  };
}

// export interface TileRulesNumeric {
//   [tileId: string]: {
//     up: number[];
//     down: number[];
//     left: number[];
//     right: number[];
//   };
// }
export interface TileRulesNumeric {
    up: number[];
    down: number[];
    left: number[];
    right: number[];
    forward?: number[];
    back?: number[];
}