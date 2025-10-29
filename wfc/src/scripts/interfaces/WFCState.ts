import { TileDefinition } from "./TilesDefinition";
import { Cell } from "../wfc/Cell";

// Esta é a nova interface para UMA alteração
export interface WFCChange {
    cell: Cell;
    oldTiles: TileDefinition[];
}

export interface WFCState {
    // 'snapshot' agora é 'changes' e é um array de WFCChange
    changes: WFCChange[];                   // O log de "undo" para este passo
    failedCell: Cell;                       // A célula que foi colapsada
    failedTile: TileDefinition;             // O tile que foi escolhido
}