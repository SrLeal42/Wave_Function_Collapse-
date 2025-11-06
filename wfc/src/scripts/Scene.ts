import * as B from "@babylonjs/core"; 

import { Camera } from "./Camera";

import { MaterialInstance } from "./managers/MaterialManager";
import { InputsInstance } from "./managers/InputsManager";
import { ModelsInstance } from "./managers/ModelsManager";

import { WFC } from "./wfc/WFC";
import { Player } from "./Player/Player";

export class Scene{

    public engine : B.Engine;
    public canvas : HTMLCanvasElement;
    public scene? : B.Scene;

    public camera? : Camera;

    public wfc? : WFC;
    public player? : Player;

    public animation = false;
    public intervalAnimation? : number;

    constructor(engine : B.Engine, canvas : HTMLCanvasElement){

        this.engine = engine;
        this.canvas = canvas;
    }

    public async CreateScene() : Promise<B.Scene> {
        const scene = new B.Scene(this.engine);

        this.scene = scene;

        // await MaterialInstance.Initialize(scene);
        await InputsInstance.Initialize(scene);
        await ModelsInstance.Initialize(scene);

        const model = await ModelsInstance.CreateInstance("fundo")!;

        model.position = new B.Vector3(0,-10,0);
        model.rotation = new B.Vector3(Math.PI/2, 0, 0);
        model.scaling = new B.Vector3(15,0,15);

        this.player = new Player(scene,10,10);
        this.camera = new Camera(scene, this.player);

        this.wfc = new WFC(scene, 11, 'generate', this.player);
        await this.wfc.Initialize();
        
        const pageTitle = document.querySelector("title")!;

        scene.onBeforeRenderObservable.add(() => {

            pageTitle.innerHTML = `WFC | ${this.engine.getFps().toFixed(2).toString()}`;

            if (InputsInstance.Space && !this.animation)
                this.wfc!.Step();

            if (InputsInstance.Animation){
                this.animation = !this.animation;
                
                if(this.animation){
                    this.intervalAnimation = setInterval(() => {
                        this.wfc!.Step();
                    }, 0);
                } else {
                    clearInterval(this.intervalAnimation);
                }
            }

            if (InputsInstance.Reset){
                this.animation = false;
                clearInterval(this.intervalAnimation);
                this.wfc!.Reset();
            }

            this.player!.Move();
            this.camera!.Move();

            this.wfc!.Update(this.player!.pivot.position);

        });


        return scene;
    }

}