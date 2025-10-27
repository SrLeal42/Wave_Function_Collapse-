import * as B from "@babylonjs/core"; 

import { TileDefinition } from "../interfaces/TilesDefinition";

import { MaterialInstance } from "../managers/MaterialManager";

export class Cell {
    
    public scene : B.Scene;

    public x: number;
    public y: number;

    public possibleTiles: TileDefinition[];
    public collapsed: boolean;
    public chosenTile: TileDefinition | null;
  
    public static cellSize = 50;
    public plane: B.Mesh;

    constructor(
        scene: B.Scene,
        x: number,
        y: number,
        possibleTiles: TileDefinition[],
    ) {

        this.scene = scene;

        this.x = x;
        this.y = y;

        this.possibleTiles = possibleTiles; // [...possibleTiles];
        this.collapsed = false;
        this.chosenTile = null;

        this.plane = B.MeshBuilder.CreatePlane(
        `cell_${x}_${y}`,
        { size: Cell.cellSize },
        scene
        );

        this.plane.position.x = (x * Cell.cellSize)
        this.plane.position.y = (y * Cell.cellSize)
        this.plane.position.z = 0;

        this.plane.material = MaterialInstance.GetMaterial('defaultUnlit');
        // this.plane.material = (x + y) % 2 != 0? MaterialInstance.GetMaterial('defaultUnlit') : MaterialInstance.GetMaterial('sandUnlit');

        // const index = Math.floor(Math.random() * possibleTiles.length);
        // this.plane.material = MaterialInstance.GetMaterial(possibleTiles[index].matKey);
    }


    public Collapse() : void {
        if (this.collapsed || this.possibleTiles.length === 0) return;

        const index = Math.floor(Math.random() * this.possibleTiles.length);
        this.chosenTile = this.possibleTiles[index];
        this.possibleTiles = [this.chosenTile];
        this.collapsed = true;

        this.plane.material = MaterialInstance.GetMaterial(this.chosenTile.matKey);

    }

    public Constrain(allowedTileIDs: Set<string>) : { success : boolean, changed : boolean} {
        const initialCount = this.possibleTiles.length;

        const setAllowedTileIDs = new Set(allowedTileIDs);

        this.possibleTiles = this.possibleTiles.filter(tile => {
            return setAllowedTileIDs.has(tile.id);
        });

        const newCount = this.possibleTiles.length;

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
    

    get entropy(): number {
        return this.possibleTiles.length;
    }


}
