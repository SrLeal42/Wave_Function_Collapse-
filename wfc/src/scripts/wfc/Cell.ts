import * as B from "@babylonjs/core"; 

// import { TileDefinition } from "../interfaces/TilesDefinition";
import { AffinitiesNumeric } from "../interfaces/AffinitiesNumeric";
import { WFCChange, WFCChangeNumeric } from "../interfaces/WFCState";

// import { MaterialInstance } from "../managers/MaterialManager";
import { ModelsInstance } from "../managers/ModelsManager";

import { ChooseWeightedRandomBy, CollapsedNeighbors, Direction } from "../Utilities";

export class Cell {
    
    public scene : B.Scene;

    public x: number;
    public y: number;

    public possibleTilesStart: Set<number>;
    public possibleTiles: Set<number>;
    public collapsed: boolean;
    public chosenTile: number | null;
  
    public cellSize = 10; // 15; //50;
    public meshSize = this.cellSize * .5;
    public meshNode!: B.TransformNode;
    // public meshNode!: B.Mesh;

    constructor(
        scene: B.Scene,
        x: number,
        y: number,
        totalNumTiles: number,
        cellSize: number,
    ) {

        this.scene = scene;

        this.x = x;
        this.y = y;

        const allPossibleNumericIDs = new Set<number>();
        for (let i = 0; i < totalNumTiles; i++) {
            allPossibleNumericIDs.add(i);
        }

        this.possibleTilesStart = new Set(allPossibleNumericIDs);
        this.possibleTiles = new Set(allPossibleNumericIDs);

        this.collapsed = false;
        this.chosenTile = null;

        this.cellSize = cellSize;
        this.meshSize = cellSize * .5;

        this.ChangeMesh('defaultUnlit');

        this.meshNode.position.x = (x * this.cellSize );
        this.meshNode.position.y = (y * this.cellSize );

        // this.meshNode = B.MeshBuilder.CreatePlane(
        // `cell_${x}_${y}`,
        // { size: Cell.cellSize },
        // scene
        // );

        // this.meshNode.position.x = (x * Cell.cellSize)
        // this.meshNode.position.y = (y * Cell.cellSize)
        // this.meshNode.position.z = 0;

        // this.meshNode.material = MaterialInstance.GetMaterial('defaultUnlit');

    }


    public ChangeMesh(key:string, x = 0, y = 0) : void {
        // this.meshNode.material = MaterialInstance.GetMaterial(key);
        if (this.meshNode)
            this.meshNode.dispose();
        this.meshNode = ModelsInstance.CreateInstance(key)!;
        
        if (this.meshNode == null)
            console.log(key);
        
        this.meshNode.scaling = new B.Vector3(this.meshSize, this.meshSize, this.meshSize);
        this.meshNode.rotation = new B.Vector3(-(Math.PI/2), 0, 0);
        this.meshNode.position = new B.Vector3((this.x * this.cellSize ), (this.y * this.cellSize ), 0);
    }


    public Collapse(
        neighbors: CollapsedNeighbors, 
        changeLog : WFCChangeNumeric[],
        allWeights: number[],
        allAffinities: AffinitiesNumeric
    ) : number | null{
    
        if (this.collapsed || this.possibleTiles.size === 0) return null;

        const getDynamicWeight = (tileId: number): number => {
            let dynamicWeight = allWeights[tileId] ?? 1;

            const affinitiesForThisTile = allAffinities[tileId];
            if (!affinitiesForThisTile) {
                return Math.max(0.1, dynamicWeight);
            }
            
            for (const dir in neighbors) {
                const neighborCell = neighbors[dir as Direction];
                
                if (neighborCell && neighborCell.chosenTile) {
                    const neighborTileID = neighborCell.chosenTile;
                    
                    const multiplier = affinitiesForThisTile[neighborTileID]
                        ? affinitiesForThisTile[neighborTileID]
                        : 1;
                        
                    dynamicWeight *= multiplier;
                    
                }
            }

            return Math.max(0.1, dynamicWeight);
        };

        // Converte o Set de possibilidades para um Array para o sorteio
        const possibleTilesArray = Array.from(this.possibleTiles);
        const chosenTileID = ChooseWeightedRandomBy(possibleTilesArray, getDynamicWeight);

        changeLog.push({ cell: this, oldTiles: this.possibleTiles });

        this.chosenTile = chosenTileID;
        this.possibleTiles = new Set([chosenTileID]);
        this.collapsed = true;

        // this.mesh.material = MaterialInstance.GetMaterial(this.chosenTile.matKey);
        // this.ChangeMesh(this.chosenTile.modelKey);
        // this.meshNode.position.z = chosenTile.height ? chosenTile.height*-1 : 0;
            
        return chosenTileID;

    }

    public Constrain(
        allowedTileIDs: Set<number>,
        changeLog: WFCChangeNumeric[]
    ) : { success : boolean, changed : boolean} {

        const initialCount = this.possibleTiles.size;
        let changed = false;

        for (const tileID of this.possibleTiles) {
            if (!allowedTileIDs.has(tileID)) {
                if (!changed) {
                    // Se esta é a primeira mudança, registre o estado "antigo"
                    changeLog.push({ cell: this, oldTiles: new Set(this.possibleTiles) });
                    changed = true;
                }
                this.possibleTiles.delete(tileID);
            }
        }

        const newCount = this.possibleTiles.size;
        // const changed = newCount < initialCount;

        if (newCount === 0 && initialCount > 0) {
            console.error(`Contradição na célula (${this.x}, ${this.y})!`);
            return { success: false, changed: true};
        }

        return { success: true, changed: changed};
    }

    // public Constrain(allowedTiles: TileDefinition[]) : { success : boolean, changed : boolean} {
    //     const initialCount = this.possibleTiles.length;

    //     const allowedTileIDs = new Set(allowedTiles.map(tile => tile.id));

    //     this.possibleTiles = this.possibleTiles.filter(tile => {
    //         return allowedTileIDs.has(tile.id);
    //     });

    //     const newCount = this.possibleTiles.length;

    //     if (newCount === 0 && initialCount > 0) {
    //         console.error(`Contradição na célula (${this.x}, ${this.y})!`);
    //         return { success: false, changed: true};
    //     }

    //     return { success: true, changed: newCount < initialCount};
    // }


    public RestoreTiles(tiles: Set<number>): void {
        this.possibleTiles = new Set(tiles); // Restaura uma cópia
        this.collapsed = (tiles.size === 1);
        this.chosenTile = (tiles.size === 1) ? tiles[0] : null;

        if (this.collapsed) {
            // Pega o único item do Set
            this.chosenTile = this.possibleTiles.values().next().value ? this.possibleTiles.values().next().value! : null;
        } else {
            this.chosenTile = null;
        }

    }
    

    public BanTile(
        tileToBan: number,
        changeLog: WFCChangeNumeric[]
    ): { success: boolean, changed: boolean } {
        
        if (this.possibleTiles.has(tileToBan)) {
            // Crie um novo Set sem o tile banido
            const newPossibleIDs = new Set(this.possibleTiles);
            newPossibleIDs.delete(tileToBan);
            
            // Chame Constrain com o novo set (que registrará a mudança)
            return this.Constrain(newPossibleIDs, changeLog);
        }
        
        return { success: true, changed: false };
    }


    public Reset() : void {

        this.possibleTiles = new Set(this.possibleTilesStart);
        this.collapsed = false;
        this.chosenTile = null;

        this.ChangeMesh('defaultUnlit');
        this.meshNode.position.z = 0;

        // this.mesh.material = MaterialInstance.GetMaterial('defaultUnlit');

    }

    get entropy(): number {
        return this.possibleTiles.size;
    }


}
