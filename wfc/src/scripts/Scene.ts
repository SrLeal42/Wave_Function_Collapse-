import * as B from "@babylonjs/core"; 

import { Camera } from "./Camera";

export class Scene{

    public engine : B.Engine;
    public canvas : HTMLCanvasElement;
    public scene? : B.Scene;

    public camera? : Camera;


    constructor(engine : B.Engine, canvas : HTMLCanvasElement){

        this.engine = engine;
        this.canvas = canvas;
    }

    public async CreateScene() : Promise<B.Scene> {
        const scene = new B.Scene(this.engine);

        this.scene = scene;

        this.camera = new Camera(scene);

        return scene;
    }

}