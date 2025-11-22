import * as B from "@babylonjs/core";

import { WFC_Base } from "./WFC_Base"; 

import { Cell } from "./Cell";

import { AffinitiesNumeric } from "../interfaces/AffinitiesNumeric";


export class WFCOverlapping extends WFC_Base {

    private N!: number;
    private centerIndex!: number;
    private patternData!: string[][][];
    private tileLegend!: { [id: string]: { modelKey: string, height: number } };

    /**
     * Preenche a lacuna "LoadTilesetData"
     */
    protected LoadTilesetData(tileset: any): void {
        this.N = tileset.N;
        this.centerIndex = Math.floor(this.N / 2);
        this.tileLegend = tileset.tileLegend;
        this.patternData = tileset.patternData;
        this.weights = tileset.weights;
        this.rules = tileset.rules;
        this.totalNumTiles = this.patternData.length;
    }

    /**
     * Preenche a lacuna "UpdateCellVisual"
     */
    protected UpdateCellVisual(cell: Cell, chosenID: number): void {
        const pattern = this.patternData[chosenID];
        const centerTileName = pattern[this.centerIndex][this.centerIndex]; 
        const tileData = this.tileLegend[centerTileName]; 
        
        if (tileData) 
            cell.ChangeMesh(tileData.modelKey);

    }

    /**
     * Preenche a lacuna "GetAffinities"
     */
    protected GetAffinities(): AffinitiesNumeric {
        return {}; 
    }

}