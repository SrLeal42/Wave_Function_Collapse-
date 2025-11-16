import * as B from "@babylonjs/core"; 

import { Cell } from "./Cell";
import { Tileset, TilesetNumeric } from "../interfaces/TilesSet";
import { TileDefinitionNumeric } from "../interfaces/TilesDefinition";
import { TileRulesNumeric } from "../interfaces/TilesRules";
import { WFCState, WFCChange, WFCChangeNumeric, WFCStateNumeric } from "../interfaces/WFCState";
import { AffinitiesNumeric } from "../interfaces/AffinitiesNumeric";

import { Player } from "../Player/Player";

import { PriorityQueue } from "./PriorityQueue";
import { LoadTileset, DIRECTIONS, type CollapsedNeighbors } from "../Utilities";


export class WFCSimpleTiled{

    public scene : B.Scene;

    public grid: Map<string, Cell> = new Map();
    private entropyQueue: PriorityQueue;
    
    private disposeCellQueue: string[] = [];

    private totalNumTiles = 0;

    private tileData!: TileDefinitionNumeric[]; // Array de dados (modelKey, height)
    private rules!: TileRulesNumeric; // Regras numéricas

    private weights!: number[]; // Array de pesos (ex: [100, 30, 25])
    private affinities!: AffinitiesNumeric; // Afinidades numéricas

    public cellSize: number;
    public renderDistance = 1;

    public tilesetName : string;
    // public tileset! : Tileset;
    public tilesetNumeric! : TilesetNumeric;

    private stateStack: WFCStateNumeric[] = [];

    public player : Player | null;


    constructor(scene : B.Scene, renderDistance : number,  cellSize: number, tilesetName : string, player: Player | null){
    
        this.scene = scene;
        
        this.cellSize = cellSize;

        this.renderDistance = renderDistance;
        
        this.tilesetName = tilesetName;

        this.entropyQueue = new PriorityQueue();
        
        this.player = player;

        // this.Initialize();

    }


    public async Initialize() : Promise<void>{

        this.tilesetNumeric = await LoadTileset(this.tilesetName) as TilesetNumeric;

        this.tileData = this.tilesetNumeric.tileData;
        this.weights = this.tilesetNumeric.weights;
        this.rules = this.tilesetNumeric.rules;
        this.affinities = this.tilesetNumeric.affinities;
        this.totalNumTiles = this.tileData.length;

        this.InitializeGrid();

        this.Step();
        
    }


    private InitializeGrid() : void {

        for(let y = -this.renderDistance; y < this.renderDistance; y++){
            for (let x = -this.renderDistance; x < this.renderDistance; x++){
                this.CreateCell(x,y);
            }
        }

    }


    public Update(playerPosition: B.Vector3 | undefined) : void {

        const playerCell = playerPosition ? this.GetCellCoordinates(playerPosition) : this.GetCellCoordinates(new B.Vector3(0,0,0));

        this.grid.forEach((cell, cellKey) => {
            // const [cellX, cellY] = [cell.x!, cell.y!];

            if (
                (Math.abs(cell.x - playerCell.x) > this.renderDistance ||
                 Math.abs(cell.y - playerCell.y) > this.renderDistance)
            ) {
                this.disposeCellQueue.push(cellKey);
            }
        });


        for (let x = playerCell.x - this.renderDistance; x <= playerCell.x + this.renderDistance; x++) {
            for (let y = playerCell.y - this.renderDistance; y <= playerCell.y + this.renderDistance; y++) {

                const cellKey = `${x},${y}`;
                
                if (!this.grid.has(cellKey)) {
                    this.CreateCell(x, y, true);
                } 
                
            }
        }


        for(let i = 0; i < this.disposeCellQueue.length; i++){
            const cellKey = this.disposeCellQueue.pop()!;
            const cell = this.grid.get(cellKey);
            
            if (cell){
                cell.meshNode.dispose();
                this.grid.delete(cellKey);
            }
        }

        // if (this.disposeCellQueue.length > 0){
        //     const cellKey = this.disposeCellQueue.pop()!;
        //     const cell = this.grid.get(cellKey);
            
        //     if (cell){
        //         cell.mesh.dispose();
        //         this.grid.delete(cellKey);
        //     }

        // }



    }


    public GetCellCoordinates(position: B.Vector3): { x: number, y: number } {
        const x = Math.floor((position.x + this.cellSize * .5) / this.cellSize);
        const y = Math.floor((position.y + this.cellSize * .5) / this.cellSize);
        return { x, y };
    }


    private CreateCell(x: number, y: number, constrain = false) : boolean {
        const cellKey = `${x},${y}`;

        const newCell = new Cell(this.scene, x, y, this.totalNumTiles, this.cellSize);
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
            const neighbor = this.grid.get(`${nx},${ny}`);

            if (!neighbor) continue;

            const neighborAllows = new Set<number>();
            
            for (const tileID of neighbor.possibleTiles) {
                const rules = this.rules[tileID]; // Acessa a regra numérica
                const rulesForDir = rules[dir.opposite]; 
                
                rulesForDir.forEach(id => neighborAllows.add(id)); // id já é um número
            }

            allowedIDs = new Set(
                [...allowedIDs].filter(id => neighborAllows.has(id))
            );
        }

        const result = newCell.Constrain(allowedIDs, changeLog);

        if (!result.success) {
            console.error(`CREATECELL FALHOU: Contradição na célula (${x},${y})`);
            return false;
        }

        this.Propagate(newCell, changeLog);

        return true;
    }



    private FindCellWithLowestEntropy(): Cell | undefined {
        return this.entropyQueue.extractMin() ?? undefined;
    }

    // private FindCellWithLowestEntropy(): Cell | undefined {
    //     let minEntropy = Infinity;
    //     let cellToPick: Cell | undefined = undefined;

    //     // let test = false;
    //     // console.log(this.grid.size);

    //     for (const cell of this.grid.values()) {
    //         // test = true;
    //         if (!cell.collapsed) {
    //             const entropy = cell.entropy;
    //             if (entropy > 0 && entropy < minEntropy) {
    //                 minEntropy = entropy;
    //                 cellToPick = cell;
    //             }
    //         }
    //     }
        
        

    //     return cellToPick;
    // }

    public Step(): { success: boolean, finish: boolean } {

        let cellToCollapse = this.FindCellWithLowestEntropy();

        // Se a célula que puxamos não está mais no grid, ela é um "fantasma".
        // Nós a descartamos e pegamos a próxima, até encontrar uma válida ou a fila acabar.
        while (
            cellToCollapse && 
            !this.grid.has(`${cellToCollapse.x},${cellToCollapse.y}`)
        ) {
            // Célula "fantasma" detectada. Descarte-a.
            cellToCollapse = this.FindCellWithLowestEntropy();
        }
        // console.log(cellToCollapse)

        if (!cellToCollapse) {
            // console.log(`WFC Concluído com sucesso!`);
            return { success: true, finish: true }; 
        }

        const changeLog: WFCChangeNumeric[] = []; 
        
        const chosenTileID = this.CollapseCell(cellToCollapse, changeLog);
        
        // Se o colapso for bem-sucedido, o WFC atualiza o visual
        if (chosenTileID !== null) {
            const tileData = this.tileData[chosenTileID]; // Acessa o array de dados
            cellToCollapse.ChangeMesh(tileData.modelKey);
            cellToCollapse.meshNode.position.z = tileData.height ? tileData.height * -1 : 0;
        }

        const success = this.Propagate(cellToCollapse, changeLog);

        if (success) {

            this.stateStack.push({
                changes: changeLog,
                failedCell: cellToCollapse!,
                failedTile: chosenTileID!
            });

        } else {
            console.warn(`Contradição detectada em (${cellToCollapse.x}, ${cellToCollapse.y}) ao tentar ${chosenTileID}.`);

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
                            failedCell: lastGoodState.failedCell, // Célula fictícia
                            failedTile: lastGoodState.failedTile // Tile fictício
                        });

                        rollbackSuccess = true;
                        console.log("Rollback bem-sucedido. Continuando...");
                    }
                }

            }

            if (!rollbackSuccess) {
                console.error("FALHA CATASTRÓFICA: A pilha de rollback está vazia e a contradição persiste.");
                return { success: false, finish: true };
            }
        }


        return { success: true, finish: false };
    }


    // public Step(): boolean {
    //     const cellToCollapse = this.FindCellWithLowestEntropy();

    //     if (!cellToCollapse) {
    //         console.log("WFC Concluído!");
    //         return false;
    //     }

    //     this.CollapseCell(cellToCollapse);
    //     return true;
    // }


    private CollapseCell(
        cellToChange : Cell, 
        changeLog: WFCChangeNumeric[]
    ) : number | null {
        
        const neighbors: CollapsedNeighbors = {};
        for (const dir of DIRECTIONS) {
            const nx = cellToChange.x + dir.dx;
            const ny = cellToChange.y + dir.dy;
            const neighbor = this.grid.get(`${nx},${ny}`);

            if (neighbor && neighbor.collapsed) {
                neighbors[dir.name] = neighbor;
            }
        }

        const chosenTileID = cellToChange.Collapse(
            neighbors, 
            changeLog,
            this.weights, // Injeta o array de pesos
            this.affinities // Injeta o objeto de afinidades
        );
        // this.Propagate(cellToChange);

        return chosenTileID;
    }

    private Propagate(
        cellChanged : Cell, 
        changeLog: WFCChangeNumeric[]
    ) : boolean {
        
        const stack: Cell[] = [cellChanged];
        const inStack: Set<Cell> = new Set([cellChanged]);

        while (stack.length > 0) {

            const currentCell = stack.pop()!;
            inStack.delete(currentCell);

            // 1. Obter todos os tiles possíveis da célula ATUAL
            // e as regras que eles impõem aos vizinhos
            const possibleTiles = currentCell.possibleTiles;

            // 2. Iterar sobre todas as 4 direções (Norte, Sul, Leste, Oeste)
            for (const dir of DIRECTIONS) {
                const nx = currentCell.x + dir.dx;
                const ny = currentCell.y + dir.dy;
                const neighborKey = `${nx},${ny}`;

                const neighbor = this.grid.get(neighborKey);

                // Se o vizinho não existir ou já estiver colapsado, pule
                if (!neighbor || neighbor.collapsed) {
                    continue;
                }

                // 3. Calcular a lista de tiles VÁLIDOS para este vizinho
                const allowedIDs = new Set<number>();

                // Para cada tile possível na célula ATUAL...
                for (const tileID of possibleTiles) {
                    // ... pegue a regra para a direção que estamos olhando (ex: 'North') ...
                    // (Estou assumindo que 'tile.rules' existe e tem o formato { North: string[], ... })
                    const rules = this.rules[tileID] // this.tileset.rules[tile.id];
                    const rulesForDir = rules[dir.name]; 
                    
                    // ... e adicione todos os IDs permitidos ao Set.
                    rulesForDir.forEach(id => allowedIDs.add(id));
                }

                // 5. Aplicar a restrição no vizinho (A SUA IDEIA!) 
                const result = neighbor.Constrain(allowedIDs, changeLog);

                // Se a restrição levou a uma contradição (entropy = 0), pare tudo.
                if (!result.success) {
                    // A geração falhou.
                    // Você precisa de uma forma de parar o WFC e talvez tentar novamente.
                    console.error("PROPAGAÇÃO FALHOU: Contradição encontrada.");
                    
                    // Limpa a pilha para parar o loop while
                    stack.length = 0; 

                    while (!this.entropyQueue.isEmpty()) {
                        this.entropyQueue.extractMin();
                    }
                    
                    // (O ideal seria definir um 'flag' no WFC como 'this.failed = true'
                    // e parar o loop 'Step' principal)
                    
                    return false;
                    // break; // Sai do loop 'for (const dir...)'
                }

                // 6. Se o vizinho mudou (perdeu possibilidades)...
                // ... e ele ainda não estiver na pilha, adicione-o.
                // Se o vizinho mudou (perdeu possibilidades)...
                if (result.changed) {
                    // --- 7. AVISE A FILA DE PRIORIDADE! ---
                    // Isso atualiza a posição do vizinho na fila.
                    this.entropyQueue.update(neighbor);
                    
                    // ... e adicione-o à pilha de propagação se ainda não estiver lá
                    if (!inStack.has(neighbor)) {
                        stack.push(neighbor);
                        inStack.add(neighbor);
                    }
                }
                
            }
        
    
        }


        return true;
    
    
    }


    // private TakeSnapshot(): Map<string, TileDefinition[]> {
    //     const snapshot = new Map<string, TileDefinition[]>();

    //     for (const [key, cell] of this.grid.entries()) {
    //         snapshot.set(key, [...cell.possibleTiles]); 
    //     }

    //     return snapshot;
    // }


    private RestoreState(changes: WFCChangeNumeric[]): void {
        console.warn("--- Iniciando Rollback (Otimizado) ---");

        for (let i = changes.length - 1; i >= 0; i--) {
            const change = changes[i];
            const cell = change.cell;
            
            cell.RestoreTiles(change.oldTiles);

            if (cell.collapsed && cell.chosenTile !== null) {
                const tileData = this.tileData[cell.chosenTile];
                cell.ChangeMesh(tileData.modelKey);
                cell.meshNode.position.z = tileData.height ? tileData.height * -1 : 0;
            } else {
                cell.ChangeMesh('defaultUnlit');
                cell.meshNode.position.z = 0;
            }

            if (!cell.collapsed) {
                this.entropyQueue.insert(cell);
            }
        }

    }


    // private RestoreState(snapshot: Map<string, TileDefinition[]>): void {
    //     console.warn("--- Iniciando Rollback ---");

    //     for (const [key, cell] of this.grid.entries()) {
    //         const oldTiles = snapshot.get(key);

    //         if (oldTiles) {
    //             cell.RestoreTiles(oldTiles);

    //             if (!cell.collapsed) {
    //                 this.entropyQueue.insert(cell);
    //             }

    //         }

    //     }
    // }


    public Reset() : void {

        this.entropyQueue = new PriorityQueue();
        this.stateStack = [];

        this.grid.forEach((cell) => {
            cell.Reset();
            this.entropyQueue.insert(cell);
        })

        this.Step();

    }




}