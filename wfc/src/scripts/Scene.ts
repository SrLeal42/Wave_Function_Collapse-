import * as B from "@babylonjs/core"; 

import { Camera } from "./Camera";

import { InputsInstance } from "./managers/InputsManager";
import { ModelsInstance } from "./managers/ModelsManager";

import { WFCSimpleTiled } from "./wfc/WFCSimpleTiled";
import { WFCOverlapping } from "./wfc/WFCOverlapping";
import { Player } from "./Player/Player";

export class Scene{

    public engine : B.Engine;
    public canvas : HTMLCanvasElement;
    public scene? : B.Scene;

    public camera? : Camera;

    public wfcModel : boolean; // false = SimpleTiled / true = Overlapping
    public wfc? : WFCSimpleTiled | WFCOverlapping;
    public player? : Player;

    public animation = false;
    public intervalAnimation? : number;

    constructor(engine : B.Engine, canvas : HTMLCanvasElement, wfcModel: boolean){

        this.engine = engine;
        this.canvas = canvas;

        this.wfcModel = wfcModel;
    }

    public async CreateScene() : Promise<B.Scene> {
        const scene = new B.Scene(this.engine);

        this.scene = scene;

        // await MaterialInstance.Initialize(scene); // Isso é inicializado no ModelManager
        await InputsInstance.Initialize(scene);
        await ModelsInstance.Initialize(scene);

        const pageTitle = document.querySelector("title")!;

        scene.onBeforeRenderObservable.add(() => {
            pageTitle.innerHTML = `WFC | ${this.engine.getFps().toFixed(2).toString()}`;
        });

        if (this.wfcModel)
            await this.CreateWFCOverlapping(scene);
        else
            await this.CreateWFCSimpleTiled(scene);


        return scene;
    }


    public async CreateWFCSimpleTiled(scene: B.Scene) : Promise<void> {

        this.player = new Player(scene, 10,10,-15);
        this.camera = new Camera(scene, this.player, false);

        this.wfc = new WFCSimpleTiled(scene, 11, 10, 'generate_Street', this.player);
        await this.wfc.Initialize();
        
        scene.onBeforeRenderObservable.add(() => {

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


    }


    public async CreateWFCOverlapping(scene: B.Scene) : Promise<void> {

        // this.player = new Player(scene, 10,10,-15);
        this.camera = new Camera(scene, null, false);

        this.wfc = new WFCOverlapping(scene, 15, 6, 'generate_Pattern_Flowers', null);
        await this.wfc.Initialize();
        
        scene.onBeforeRenderObservable.add(() => {

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

            // this.player!.Move();
            // this.camera!.Move();

            this.wfc!.Update(undefined);

        });


    }



}