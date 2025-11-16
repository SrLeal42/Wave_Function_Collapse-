import * as B from "@babylonjs/core";

import { WFC_Base } from "./WFC_Base"; 

import { Cell } from "./Cell";

import { TileDefinitionNumeric } from "../interfaces/TilesDefinition";
import { TilesetNumeric } from "../interfaces/TilesSet";
import { AffinitiesNumeric } from "../interfaces/AffinitiesNumeric";


export class WFCSimpleTiled extends WFC_Base {

    // Guarda os dados específicos deste algoritmo
    private tileData!: TileDefinitionNumeric[];
    private affinities!: AffinitiesNumeric;

    /**
     * Preenche a lacuna "LoadTilesetData"
     */
    protected LoadTilesetData(tileset: any): void {
        const ts = tileset as TilesetNumeric; // Faz o cast
        
        this.tileData = ts.tileData;
        this.weights = ts.weights;
        this.rules = ts.rules;
        this.affinities = ts.affinities;
        this.totalNumTiles = ts.tileData.length;
    }

    /**
     * Preenche a lacuna "UpdateCellVisual"
     */
    protected UpdateCellVisual(cell: Cell, chosenID: number): void {
        const tileData = this.tileData[chosenID];
        if (tileData) {
            cell.ChangeMesh(tileData.modelKey);
            cell.meshNode.position.z = tileData.height ? tileData.height * -1 : 0;
        }
    }

    /**
     * Preenche a lacuna "GetAffinities"
     */
    protected GetAffinities(): AffinitiesNumeric {
        // Simple Tiled usa afinidades
        return this.affinities;
    }
}