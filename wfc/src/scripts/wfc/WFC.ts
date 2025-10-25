import * as B from "@babylonjs/core"; 

import { Cell } from "./Cell";
import { Tileset } from "../interfaces/TilesSet";

import { LoadTileset } from "../Utilities";


export class WFC{

    public scene : B.Scene;

    public grid : Cell[][] = [];
    
    public width : number;
    public height : number;

    public tilesetName : string;
    public tileset! : Tileset;

    constructor(scene : B.Scene, width : number, height : number, tilesetName : string){
    
        this.scene = scene;
        
        this.width = width;
        this.height = height;
        
        this.tilesetName = tilesetName;
        
        this.Initialize();

    }


    public async Initialize() : Promise<void>{

        this.tileset = await LoadTileset(this.tilesetName);
        // console.log(this.tileset);

        this.InitializeGrid();

    }


    public InitializeGrid() : void {

        for (let y = -(this.height/2); y < this.height/2; y++) {

            this.grid[y] = [];

            for (let x = -(this.width/2); x < this.width/2; x++) {
                this.grid[y][x] = new Cell(this.scene, x, y, this.tileset.tiles, 50);
            }

        }

    }



}