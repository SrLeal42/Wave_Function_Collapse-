import * as B from "@babylonjs/core"; 

import { TileDefinition } from "../interfaces/TilesDefinition";
import { WFCChange } from "../interfaces/WFCState";

import { MaterialInstance } from "../managers/MaterialManager";
import { ModelsInstance } from "../managers/ModelsManager";

import { ChooseWeightedRandomBy, CollapsedNeighbors, Direction } from "../Utilities";

export class Cell {
    
    public scene : B.Scene;

    public x: number;
    public y: number;

    public possibleTilesStart: TileDefinition[];
    public possibleTiles: TileDefinition[];
    public collapsed: boolean;
    public chosenTile: TileDefinition | null;
  
    public static cellSize = 10; // 15; //50;
    public meshSize = Cell.cellSize * .5;
    public meshNode!: B.TransformNode;
    // public meshNode!: B.Mesh;

    constructor(
        scene: B.Scene,
        x: number,
        y: number,
        possibleTiles: TileDefinition[],
    ) {

        this.scene = scene;

        this.x = x;
        this.y = y;

        this.possibleTilesStart = [...possibleTiles];
        this.possibleTiles = [...possibleTiles];
        this.collapsed = false;
        this.chosenTile = null;

        this.ChangeMesh('defaultUnlit');

        this.meshNode.position.x = (x * Cell.cellSize );
        this.meshNode.position.y = (y * Cell.cellSize );

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
        this.meshNode.scaling = new B.Vector3(this.meshSize, 0, this.meshSize);
        this.meshNode.rotation = new B.Vector3(-(Math.PI/2), 0, 0);
        this.meshNode.position = new B.Vector3((this.x * Cell.cellSize ), (this.y * Cell.cellSize ), 0);
    }


    public Collapse(
        neighbors: CollapsedNeighbors, 
        changeLog : WFCChange[]
    ) : TileDefinition | null{
    
        if (this.collapsed || this.possibleTiles.length === 0) return null;

        const getDynamicWeight = (tile: TileDefinition): number => {
            let dynamicWeight = tile.weight ?? 1;
            
            for (const dir in neighbors) {
                const neighborCell = neighbors[dir as Direction];
                
                if (neighborCell && neighborCell.chosenTile) {
                    const neighborTile = neighborCell.chosenTile;

                    // if (neighborTile.id === tile.id) 
                    //     dynamicWeight *= 2;

                    if (!tile.affinities) 
                        continue;
                    
                    const multiplier = tile.affinities[neighborTile.id] ? tile.affinities[neighborTile.id] : 1;
                    dynamicWeight *= multiplier;
                    
                }
            }

            return Math.max(0.1, dynamicWeight);
        };


        const chosenTile = ChooseWeightedRandomBy(this.possibleTiles, getDynamicWeight);

        changeLog.push({ cell: this, oldTiles: this.possibleTiles });

        this.chosenTile = chosenTile;
        this.possibleTiles = [this.chosenTile];
        this.collapsed = true;

        // this.mesh.material = MaterialInstance.GetMaterial(this.chosenTile.matKey);
        this.ChangeMesh(this.chosenTile.modelKey);
        this.meshNode.position.z = chosenTile.height ? chosenTile.height*-1 : 0;
            
        return chosenTile;

    }

    public Constrain(
        allowedTileIDs: Set<string>,
        changeLog: WFCChange[]
    ) : { success : boolean, changed : boolean} {

        const initialCount = this.possibleTiles.length;
        // const setAllowedTileIDs = new Set(allowedTileIDs);

        const newPossibleTiles = this.possibleTiles.filter(tile => {
            return allowedTileIDs.has(tile.id);
        });

        const newCount = newPossibleTiles.length;
        const changed = newCount < initialCount;

        if (changed) {
            changeLog.push({ cell: this, oldTiles: this.possibleTiles });
            this.possibleTiles = newPossibleTiles;
        }

        if (newCount === 0 && initialCount > 0) {
            console.error(`Contradição na célula (${this.x}, ${this.y})!`);
            return { success: false, changed: true};
        }

        return { success: true, changed: newCount < initialCount};
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


    public RestoreTiles(tiles: TileDefinition[]): void {
        this.possibleTiles = [...tiles]; // Restaura uma cópia
        this.collapsed = (tiles.length === 1);
        this.chosenTile = (tiles.length === 1) ? tiles[0] : null;

        // Redefine o material visual
        if (this.collapsed && this.chosenTile) {
            this.ChangeMesh(this.chosenTile.modelKey);
            this.meshNode.position.z = this.chosenTile.height ? this.chosenTile.height*-1 : 0;

        } else {
            this.ChangeMesh('defaultUnlit');
            this.meshNode.position.z = 0;
            // this.mesh.material = MaterialInstance.GetMaterial('defaultUnlit');
        }
    }
    

    public BanTile(
        tileToBan: TileDefinition,
        changeLog: WFCChange[]
    ): { success: boolean, changed: boolean } {
        
        const idToBan = tileToBan.id;
        const currentPossibleIDs = new Set(this.possibleTiles.map(t => t.id));

        if (currentPossibleIDs.has(idToBan)) {
            currentPossibleIDs.delete(idToBan);
            return this.Constrain(currentPossibleIDs, changeLog);
        }
        
        return { success: true, changed: false };
    }


    public Reset() : void {

        this.possibleTiles = this.possibleTilesStart;
        this.collapsed = false;
        this.chosenTile = null;

        this.ChangeMesh('defaultUnlit');
        this.meshNode.position.z = 0;

        // this.mesh.material = MaterialInstance.GetMaterial('defaultUnlit');

    }

    get entropy(): number {
        return this.possibleTiles.length;
    }


}
