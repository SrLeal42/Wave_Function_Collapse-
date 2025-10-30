import * as B from "@babylonjs/core"; 

import { Cell } from "./Cell";
import { Tileset } from "../interfaces/TilesSet";
import { TileDefinition } from "../interfaces/TilesDefinition";
import { WFCState, WFCChange } from "../interfaces/WFCState";

import { Player } from "../Player/Player";

import { PriorityQueue } from "./PriorityQueue";
import { LoadTileset, DIRECTIONS, type CollapsedNeighbors } from "../Utilities";


export class WFC{

    public scene : B.Scene;

    public grid: Map<string, Cell> = new Map();
    private entropyQueue: PriorityQueue;
    
    private disposeCellQueue: string[] = [];

    public renderDistance = 1;

    public tilesetName : string;
    public tileset! : Tileset;

    private stateStack: WFCState[] = [];

    public player : Player;


    constructor(scene : B.Scene, renderDistance : number, tilesetName : string, player: Player){
    
        this.scene = scene;
        
        this.renderDistance = renderDistance;
        
        this.tilesetName = tilesetName;

        this.entropyQueue = new PriorityQueue();
        
        this.player = player;

        // this.Initialize();

    }


    public async Initialize() : Promise<void>{

        this.tileset = await LoadTileset(this.tilesetName);

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


    public Update(playerPosition: B.Vector3) : void {

        const playerCell = this.GetCellCoordinates(playerPosition);

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
                cell.plane.dispose();
                this.grid.delete(cellKey);
            }
        }

        // if (this.disposeCellQueue.length > 0){
        //     const cellKey = this.disposeCellQueue.pop()!;
        //     const cell = this.grid.get(cellKey);
            
        //     if (cell){
        //         cell.plane.dispose();
        //         this.grid.delete(cellKey);
        //     }

        // }



    }


    public GetCellCoordinates(position: B.Vector3): { x: number, y: number } {
        const x = Math.floor((position.x + Cell.cellSize * .5) / Cell.cellSize);
        const y = Math.floor((position.y + Cell.cellSize * .5) / Cell.cellSize);
        return { x, y };
    }


    private CreateCell(x: number, y: number, constrain = false) : boolean {
        const cellKey = `${x},${y}`;

        const newCell = new Cell(this.scene, x, y, this.tileset.tiles);
        this.grid.set(cellKey, newCell);

        this.entropyQueue.insert(newCell);

        if (!constrain)
            return true;

        const changeLog: WFCChange[] = []; 

        // 1. Comece com um Set contendo TODOS os IDs de tile possíveis
        let allowedIDs = new Set(newCell.possibleTiles.map(t => t.id));

        // 2. Itere sobre todas as direções para encontrar vizinhos
        for (const dir of DIRECTIONS) {
            const nx = newCell.x + dir.dx;
            const ny = newCell.y + dir.dy;
            const neighbor = this.grid.get(`${nx},${ny}`);

            // Se não houver vizinho, ele não pode nos restringir. Continue.
            if (!neighbor)
                continue;

            // 3. Calcule o conjunto de IDs que ESTE vizinho permite
            const neighborAllows = new Set<string>();
            
            // Para cada tile possível do vizinho...
            for (const tile of neighbor.possibleTiles) {
                // ...pegue suas regras para a direção OPOSTA (virada para a newCell)
                const rules = this.tileset.rules[tile.id];
                const rulesForDir = rules[dir.opposite]; // Ex: vizinho 'up' -> regra 'down'
                
                // Adicione todos os IDs permitidos por essa regra
                rulesForDir.forEach(id => neighborAllows.add(id));
            }

            // 4. FAÇA A INTERSEÇÃO.
            // Mantenha em 'allowedIDs' apenas os IDs que
            // também existem em 'neighborAllows'.
            allowedIDs = new Set(
                [...allowedIDs].filter(id => neighborAllows.has(id))
            );
        }

        // 5. Agora, 'allowedIDs' contém apenas tiles permitidos
        // por TODOS os vizinhos. Aplique a restrição.
        // console.log(`Nova célula (${x},${y}) restrita para:`, allowedIDs);
        const result = newCell.Constrain(allowedIDs, changeLog);

        if (!result.success) {
            console.error(`CREATECELL FALHOU: Contradição na célula (${x},${y})`);
            return false;
        }

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

        const cellToCollapse = this.FindCellWithLowestEntropy();

        if (!cellToCollapse) {
            // console.log(`WFC Concluído com sucesso!`);
            return { success: true, finish: true }; 
        }

        const changeLog: WFCChange[] = []; 

        const chosenTile = this.CollapseCell(cellToCollapse, changeLog); 
        const success = this.Propagate(cellToCollapse, changeLog);

        if (success) {

            this.stateStack.push({
                changes: changeLog,
                failedCell: cellToCollapse,
                failedTile: chosenTile!
            });

        } else {
            console.warn(`Contradição detectada em (${cellToCollapse.x}, ${cellToCollapse.y}) ao tentar ${chosenTile!.id}.`);

            let rollbackSuccess = false;
            
            while (!rollbackSuccess && this.stateStack.length > 0) {
                
                const lastGoodState = this.stateStack.pop()!;
                
                this.RestoreState(lastGoodState.changes);
                
                const banLog: WFCChange[] = [];
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
        changeLog: WFCChange[]
    ) : TileDefinition | null {
        
        const neighbors: CollapsedNeighbors = {};
        for (const dir of DIRECTIONS) {
            const nx = cellToChange.x + dir.dx;
            const ny = cellToChange.y + dir.dy;
            const neighbor = this.grid.get(`${nx},${ny}`);

            if (neighbor && neighbor.collapsed) {
                neighbors[dir.name] = neighbor;
            }
        }


        const chosenTile = cellToChange.Collapse(neighbors, changeLog);
        
        // this.Propagate(cellToChange);

        return chosenTile;
    }

    private Propagate(
        cellChanged : Cell, 
        changeLog: WFCChange[]
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
                const allowedIDs = new Set<string>();

                // Para cada tile possível na célula ATUAL...
                for (const tile of possibleTiles) {
                    // ... pegue a regra para a direção que estamos olhando (ex: 'North') ...
                    // (Estou assumindo que 'tile.rules' existe e tem o formato { North: string[], ... })
                    const rules = this.tileset.rules[tile.id];
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


    private RestoreState(changes: WFCChange[]): void {
        console.warn("--- Iniciando Rollback (Otimizado) ---");

        // Reverte as alterações na ORDEM OPOSTA em que foram feitas
        for (let i = changes.length - 1; i >= 0; i--) {
            const change = changes[i];
            const cell = change.cell;
            
            cell.RestoreTiles(change.oldTiles);

            // Adiciona de volta à fila de entropia, pois seu estado mudou
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