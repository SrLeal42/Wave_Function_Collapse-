import * as B from "@babylonjs/core"; 

import { TileDefinition } from "../interfaces/TilesDefinition";

import { MaterialInstance } from "../managers/MaterialManager";

export class Cell {
    
    public scene : B.Scene;

    public x: number;
    public y: number;

    public possibleTiles: TileDefinition[];
    public collapsed: boolean;
    public chosenTile: string | null;
  
    public plane: B.Mesh;

    constructor(
        scene: B.Scene,
        x: number,
        y: number,
        possibleTiles: TileDefinition[],
        cellSize: number
    ) {

        this.scene = scene;

        this.x = x;
        this.y = y;

        this.possibleTiles = possibleTiles; // [...possibleTiles];
        this.collapsed = false;
        this.chosenTile = null;

        this.plane = B.MeshBuilder.CreatePlane(
        `cell_${x}_${y}`,
        { size: cellSize },
        scene
        );

        this.plane.position.x = (x * cellSize)
        this.plane.position.y = (y * cellSize)
        this.plane.position.z = 0;

        // this.plane.material = MaterialInstance.GetMaterial('defaultUnlit');
        // this.plane.material = (x + y) % 2 != 0? MaterialInstance.GetMaterial('defaultUnlit') : MaterialInstance.GetMaterial('sandUnlit');

        const index = Math.floor(Math.random() * possibleTiles.length);
        this.plane.material = MaterialInstance.GetMaterial(possibleTiles[index].matKey);
    }

    get entropy(): number {
        return this.possibleTiles.length;
    }

    // public Collapse(): void {
    //     if (this.collapsed || this.possibleTiles.length === 0) return;

    //     const index = Math.floor(Math.random() * this.possibleTiles.length);
    //     this.chosenTile = this.possibleTiles[index];
    //     this.possibleTiles = [this.chosenTile];
    //     this.collapsed = true;

    //     // Muda a cor do material para representar visualmente
    //     const mat = this.plane.material as B.StandardMaterial;
    //     mat.diffuseColor = new B.Color3(Math.random(), Math.random(), Math.random());
    // }


}
