import { TileDefinition, TileDefinitionNumeric } from "./TilesDefinition";
import { Cell } from "../wfc/Cell";

// Esta é a nova interface para UMA alteração
export interface WFCChange {
    cell: Cell;
    oldTiles: TileDefinition[];
}

// Precisamos atualizar WFCChange para usar números
export interface WFCChangeNumeric {
    cell: Cell;
    oldTiles: Set<number>; // <-- MUDANÇA: Era TileDefinition[]
}

export interface WFCState {
    // 'snapshot' agora é 'changes' e é um array de WFCChange
    changes: WFCChange[];                   // O log de "undo" para este passo
    failedCell: Cell;                       // A célula que foi colapsada
    failedTile: TileDefinition;             // O tile que foi escolhido
}

export interface WFCStateNumeric {
    // 'snapshot' agora é 'changes' e é um array de WFCChange
    changes: WFCChangeNumeric[];                   // O log de "undo" para este passo
    failedCell: Cell;                       // A célula que foi colapsada
    failedTile: number;             // O tile que foi escolhido
}