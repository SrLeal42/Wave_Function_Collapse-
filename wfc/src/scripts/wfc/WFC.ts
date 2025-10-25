import * as B from "@babylonjs/core"; 

import { Cell } from "./Cell";


export class WFC{

    public scene : B.Scene;

    public grid : Cell[][] = [];
    
    public width : number;
    public height : number;

    constructor(scene : B.Scene, width : number, height : number){
    
        this.scene = scene;
        
        this.width = width;
        this.height = height;
    
        this.InitializeGrid();
    }


    public InitializeGrid() : void {

        for (let y = -(this.height/2); y < this.height/2; y++) {

            this.grid[y] = [];

            for (let x = -(this.width/2); x < this.width/2; x++) {
                this.grid[y][x] = new Cell(this.scene, x, y, ['0', '1', '2'], 50);
            }

        }

    }



}