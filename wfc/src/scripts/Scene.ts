import * as B from "@babylonjs/core"; 

import { Camera } from "./Camera";

import { MaterialInstance } from "./managers/MaterialManager";

import { Cell } from "./wfc/Cell";
import { WFC } from "./wfc/WFC";

export class Scene{

    public engine : B.Engine;
    public canvas : HTMLCanvasElement;
    public scene? : B.Scene;

    public camera? : Camera;

    public wfc? : WFC;

    constructor(engine : B.Engine, canvas : HTMLCanvasElement){

        this.engine = engine;
        this.canvas = canvas;
    }

    public async CreateScene() : Promise<B.Scene> {
        const scene = new B.Scene(this.engine);

        this.scene = scene;

        this.camera = new Camera(scene);

        await MaterialInstance.Initialize(scene);

        this.wfc = new WFC(scene,18,18);

        return scene;
    }

}