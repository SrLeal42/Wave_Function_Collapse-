export interface TileDefinition {
    id: string;                                 // Nome ou ID único do tile
    matKey: string;                             // Caminho da textura (ou nome do material)
    weight?: number;                            // Probabilidade relativa (default = 1)
    height?: number;                            // Altura do modelo do tile no grid 
    affinities?: { [tileId: string]: number };  // Tiles com maior probabilidades de aparecerem juntos
}