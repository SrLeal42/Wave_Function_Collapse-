import * as B from "@babylonjs/core"; 

import { Cell } from "./Cell";
import { Tileset } from "../interfaces/TilesSet";

import { PriorityQueue } from "./PriorityQueue";
import { LoadTileset, DIRECTIONS } from "../Utilities";


export class WFC{

    public scene : B.Scene;

    public grid: Map<string, Cell> = new Map();
    private entropyQueue: PriorityQueue;
    
    public renderDistance = 1;

    public tilesetName : string;
    public tileset! : Tileset;

    constructor(scene : B.Scene, renderDistance : number, tilesetName : string){
    
        this.scene = scene;
        
        this.renderDistance = renderDistance;
        
        this.tilesetName = tilesetName;

        this.entropyQueue = new PriorityQueue();
        
        // this.Initialize();

    }


    public async Initialize() : Promise<void>{

        this.tileset = await LoadTileset(this.tilesetName);

        this.InitializeGrid();

        this.CollapseCell(this.grid.get('0,0')!);
        // console.log(this.FindCellWithLowestEntropy());
    }


    private InitializeGrid() : void {

        for(let y = -this.renderDistance; y < this.renderDistance; y++){
            for (let x = -this.renderDistance; x < this.renderDistance; x++){
                
                const newCell = new Cell(this.scene, x, y, this.tileset.tiles);
                this.grid.set(`${x},${y}`, newCell);

                this.entropyQueue.insert(newCell);

            }
        }

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


    public Step(): boolean {
        const cellToCollapse = this.FindCellWithLowestEntropy();

        if (!cellToCollapse) {
            console.log("WFC Concluído!");
            return false;
        }

        this.CollapseCell(cellToCollapse);
        return true;
    }


    private CollapseCell(cellToChange : Cell) : void {
        cellToChange.Collapse();
        this.Propagate(cellToChange);
    }

    private Propagate(cellChanged : Cell) : void {
        
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
                const result = neighbor.Constrain(allowedIDs);

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
                    
                    break; // Sai do loop 'for (const dir...)'
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
    
    
    }




}