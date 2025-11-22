import * as B from "@babylonjs/core"; 

import { Cell } from "./Cell";

import { WFCChangeNumeric, WFCStateNumeric } from "../interfaces/WFCState";
import { AffinitiesNumeric } from "../interfaces/AffinitiesNumeric";
import { TileRulesNumeric } from "../interfaces/TilesRules";

import { Player } from "../Player/Player";

import { PriorityQueue } from "./PriorityQueue";
import { LoadTileset, DIRECTIONS, type CollapsedNeighbors } from "../Utilities";

export abstract class WFC_Base {

    public scene: B.Scene;
    public grid: Map<string, Cell> = new Map();
    protected entropyQueue: PriorityQueue;
    private disposeCellQueue: string[] = [];
    
    public renderDistanceX: number;
    public renderDistanceY: number;
    public renderDistanceZ: number;
    public cellSize: number;
    public tilesetName: string;
    public player: Player | null;

    protected totalNumTiles = 0; // 'tiles' ou 'patterns'
    protected weights!: number[]; 
    protected rules!: TileRulesNumeric[]; //{ [key: number]: { [dir: string]: number[] } };

    private stateStack: WFCStateNumeric[] = [];

    private forceRollback = false;

    public isInicialized = false;

    constructor(scene : B.Scene, renderDistanceX : number, renderDistanceY : number, renderDistanceZ : number, cellSize: number, tilesetName : string, player: Player | null){
    
        this.scene = scene;
        
        this.cellSize = cellSize;

        this.renderDistanceX = renderDistanceX;
        this.renderDistanceY = renderDistanceY;
        this.renderDistanceZ = renderDistanceZ;
        
        this.tilesetName = tilesetName;

        this.entropyQueue = new PriorityQueue();
        
        this.player = player;

    }


    /**
     * Carrega o JSON e preenche as propriedades 
     * (weights, rules, totalNumTiles, e qualquer outra)
     */
    protected abstract LoadTilesetData(tileset: any): void;

    /**
     * Pega o ID de um tile/padrão colapsado e informa à Célula
     * qual modelo/material deve ser renderizado.
     */
    protected abstract UpdateCellVisual(cell: Cell, chosenID: number): void;

    /**
     * Obtém as afinidades (se houver) para passar para a Célula.
     * (O Overlapping pode só retornar {}).
     */
    protected abstract GetAffinities(): AffinitiesNumeric;

    public async Initialize(): Promise<void> {
        const tileset = await LoadTileset(this.tilesetName);
        
        this.LoadTilesetData(tileset);
        
        this.InitializeGrid();
        this.Step();

        this.isInicialized = true; 
    }

    private InitializeGrid(): void {

        for(let x = -this.renderDistanceX; x < this.renderDistanceX; x++){
            for (let y = -this.renderDistanceY; y < this.renderDistanceY; y++){
                for(let z = -this.renderDistanceZ; z < this.renderDistanceZ; z++){ // Z é profundidade
                    this.CreateCell(x, y, z);
                }
            }
        }

    }

   public Update(playerPosition: B.Vector3 | undefined) : void {

        if (!this.isInicialized)
            return;

        const playerCell = playerPosition ? this.GetCellCoordinates(playerPosition) : this.GetCellCoordinates(new B.Vector3(0,0,0));

        this.grid.forEach((cell, cellKey) => {
            if (
                Math.abs(cell.x - playerCell.x) > this.renderDistanceX ||
                Math.abs(cell.y - playerCell.y) > this.renderDistanceY ||
                Math.abs(cell.z - playerCell.z) > this.renderDistanceZ
            ) {
                this.disposeCellQueue.push(cellKey);
            }
        });


        for (let x = playerCell.x - this.renderDistanceX; x <= playerCell.x + this.renderDistanceX; x++) {
            for (let y = playerCell.y - this.renderDistanceY; y <= playerCell.y + this.renderDistanceY; y++) {
                for (let z = playerCell.z - this.renderDistanceZ; z <= playerCell.z + this.renderDistanceZ; z++) {
                    
                    const cellKey = `${x},${y},${z}`;
                    
                    if (!this.grid.has(cellKey)) {
                        this.CreateCell(x, y, z, true);
                    }

                }
            }
        }

        while (this.disposeCellQueue.length > 0) {
            const cellKey = this.disposeCellQueue.pop()!;
            const cell = this.grid.get(cellKey);
            
            if (cell){
                cell.meshNode.dispose();
                this.grid.delete(cellKey);
            }
        }


        // for(let i = 0; i < this.disposeCellQueue.length; i++){
        //     const cellKey = this.disposeCellQueue.pop()!;
        //     const cell = this.grid.get(cellKey);
            
        //     if (cell){
        //         cell.meshNode.dispose();
        //         this.grid.delete(cellKey);
        //     }
        // }

    }

    public GetCellCoordinates(position: B.Vector3): { x: number, y: number, z: number } {
        return {
            x: Math.floor((position.x + this.cellSize * .5) / this.cellSize),
            y: Math.floor((position.y + this.cellSize * .5) / this.cellSize),
            z: Math.floor((position.z + this.cellSize * .5) / this.cellSize)
        };
    }

    private CreateCell(x: number, y: number, z: number, constrain = false) : boolean {
        const cellKey = `${x},${y},${z}`;

        const newCell = new Cell(this.scene, x, y, z, this.totalNumTiles, this.cellSize);
        this.grid.set(cellKey, newCell);
        this.entropyQueue.insert(newCell);

        if (!constrain)
            return true;

        const changeLog: WFCChangeNumeric[] = [];

        let allowedIDs = new Set<number>();
        for(let i=0; i<this.totalNumTiles; i++) allowedIDs.add(i);

        for (const dir of DIRECTIONS) {
            const nx = newCell.x + dir.dx;
            const ny = newCell.y + dir.dy;
            const nz = newCell.z + dir.dz;
            const neighbor = this.grid.get(`${nx},${ny},${nz}`);

            if (!neighbor || (nx === newCell.x && ny === newCell.y && nz === newCell.z)) continue;

            const neighborAllows = new Set<number>();
            
            for (const tileID of neighbor.possibleTiles) {
                const rules = this.rules[tileID];
                const rulesForDir = rules[dir.opposite]; 
                
                rulesForDir?.forEach(id => neighborAllows.add(id));
            }

            allowedIDs = new Set(
                [...allowedIDs].filter(id => neighborAllows.has(id))
            );
        }

        const result = newCell.Constrain(allowedIDs, changeLog);

        if (!result.success) {
            console.error(`CreateCell falhou em (${x},${y}). Forçando rollback...`);
            console.log(allowedIDs)
            this.forceRollback = true;
            return false;
        }

        this.Propagate(newCell, changeLog);

        return true;
    }

    private FindCellWithLowestEntropy(): Cell | undefined {
        return this.entropyQueue.extractMin() ?? undefined;
    }

    public Step(): { success: boolean, finish: boolean } {

        if (this.forceRollback) {
            console.warn("Rollback forçado iniciado por CreateCell...");
            this.forceRollback = false;
            
            return this.DoRollback(); 
        }


        let cellToCollapse = this.FindCellWithLowestEntropy();

        while (
            cellToCollapse && 
            !this.grid.has(`${cellToCollapse.x},${cellToCollapse.y},${cellToCollapse.z}`)
        ) {
            cellToCollapse = this.FindCellWithLowestEntropy();
        }

        if (!cellToCollapse) {
            return { success: true, finish: true }; 
        }

        const changeLog: WFCChangeNumeric[] = []; 
        
        // Chama o método abstrato para obter afinidades
        const affinities = this.GetAffinities(); 
        
        const chosenID = this.CollapseCell(cellToCollapse, changeLog, affinities);

        if (chosenID !== null) {
            // Chama o método abstrato para renderizar
            this.UpdateCellVisual(cellToCollapse, chosenID); 
        }

        const success = this.Propagate(cellToCollapse, changeLog);

        if (success) {
            this.stateStack.push({
                changes: changeLog,
                failedCell: cellToCollapse!,
                failedTile: chosenID!
            });
        } else {
            
            return this.DoRollback();
        }
        return { success: true, finish: false };
    }

    private CollapseCell(
        cellToChange : Cell, 
        changeLog: WFCChangeNumeric[],
        affinities: AffinitiesNumeric // Recebe as afinidades
    ) : number | null {
        
        const neighbors: CollapsedNeighbors = {};
        for (const dir of DIRECTIONS) {
            const nx = cellToChange.x + dir.dx;
            const ny = cellToChange.y + dir.dy;
            const nz = cellToChange.z + dir.dz;
            const neighbor = this.grid.get(`${nx},${ny},${nz}`);
            
            if (neighbor && neighbor.collapsed) {
                neighbors[dir.name] = neighbor;
            }
        }

        const chosenTileID = cellToChange.Collapse(
            neighbors, 
            changeLog,
            this.weights, // Passa os pesos
            affinities    // Passa as afinidades
        );
        
        return chosenTileID;
    }

    private Propagate(cellChanged: Cell, changeLog: WFCChangeNumeric[]): boolean {
        const stack: Cell[] = [cellChanged];
        const inStack: Set<Cell> = new Set([cellChanged]);

        while (stack.length > 0) {
            const currentCell = stack.pop()!;
            inStack.delete(currentCell);
            const possibleTiles = currentCell.possibleTiles;

            for (const dir of DIRECTIONS) {
                const neighborKey = `${currentCell.x + dir.dx},${currentCell.y + dir.dy},${currentCell.z + dir.dz}`;
                const neighbor = this.grid.get(neighborKey);
                
                if (!neighbor || neighbor.collapsed) continue;

                const allowedIDs = new Set<number>();
                for (const tileID of possibleTiles) {
                    const rules = this.rules[tileID];
                    if (!rules) continue;
                    const rulesForDir = rules[dir.name]; 
                    rulesForDir?.forEach(id => allowedIDs.add(id));
                }
                
                const result = neighbor.Constrain(allowedIDs, changeLog);

                if (!result.success) {
                    console.error("PROPAGAÇÃO FALHOU");
                    stack.length = 0; 
                    while (!this.entropyQueue.isEmpty()) this.entropyQueue.extractMin();
                    return false;
                }

                if (result.changed) {
                    this.entropyQueue.update(neighbor);
                    if (!inStack.has(neighbor)) {
                        stack.push(neighbor);
                        inStack.add(neighbor);
                    }
                }
            }
        }
        return true;
    }

    private RestoreState(changes: WFCChangeNumeric[]): void {
        console.warn("--- Iniciando Rollback ---");
        for (let i = changes.length - 1; i >= 0; i--) {
            const change = changes[i];
            const cell = change.cell;
            
            cell.RestoreTiles(change.oldTiles);
            
            // Chama o método abstrato para restaurar o visual
            if (cell.collapsed && cell.chosenTile !== null) {
                this.UpdateCellVisual(cell, cell.chosenTile);
            } else {
                cell.ChangeMesh('defaultUnlit');
            }

            if (!cell.collapsed) {
                this.entropyQueue.insert(cell);
            }
        }
    }


    private DoRollback(): { success: boolean, finish: boolean } {
        let rollbackSuccess = false;
        
        while (!rollbackSuccess && this.stateStack.length > 0) {
            const lastGoodState = this.stateStack.pop()!;
            this.RestoreState(lastGoodState.changes);
            
            const banLog: WFCChangeNumeric[] = [];
            const result = lastGoodState.failedCell.BanTile(lastGoodState.failedTile, banLog);
            this.entropyQueue.update(lastGoodState.failedCell);

            if (result.success) {
                if (this.Propagate(lastGoodState.failedCell, banLog)) {
                    this.stateStack.push({
                        changes: banLog,
                        failedCell: lastGoodState.failedCell,
                        failedTile: lastGoodState.failedTile
                    });
                    rollbackSuccess = true;
                }
            }
        }

        if (!rollbackSuccess) {
            console.error("FALHA CATASTRÓFICA: Rollback falhou.");
            return { success: false, finish: true };
        }
        
        return { success: true, finish: false };
    }

    public Reset(): void {
        this.entropyQueue = new PriorityQueue();
        this.stateStack = [];
        this.grid.forEach((cell) => {
            cell.Reset();
            this.entropyQueue.insert(cell);
        });
        this.Step();
    }
}