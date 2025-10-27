import * as B from "@babylonjs/core"; 

import { Camera } from "./Camera";

import { MaterialInstance } from "./managers/MaterialManager";
import { InputsInstance } from "./managers/InputsManager";

import { WFC } from "./wfc/WFC";

import { TILESET_REGISTRY } from "./wfc/TilesetRegistry";

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
        await InputsInstance.Initialize(scene);

        this.wfc = new WFC(scene, 9, 'grasslands');
        await this.wfc.Initialize();
        

        scene.onBeforeRenderObservable.add(() => {
            // console.log(InputsInstance.Space);
            if (InputsInstance.Space)
                this.wfc!.Step();
        });

        return scene;
    }

}