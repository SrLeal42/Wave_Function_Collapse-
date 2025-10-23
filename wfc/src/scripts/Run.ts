import * as B from "@babylonjs/core"; 

import { Scene } from "./Scene";


export class Run{

    public canvas : HTMLCanvasElement

    public scene! : B.Scene;
    public engine! : B.Engine;
    public HK! : B.HavokPlugin;

    public sceneClass! : Scene;

    constructor(canvas : HTMLCanvasElement) {

        this.canvas = canvas;

        this.engine = new B.Engine(this.canvas, true);
        
        this.Initialize();
        
    }

    public async Initialize() : Promise<void> {

        this.sceneClass = new Scene(this.engine, this.canvas);

        this.scene = await this.sceneClass.CreateScene();
        
        this.AdjustCamera();

        window.addEventListener('resize', () => {
            this.AdjustCamera();
            this.engine.resize();
        });

        this.engine.runRenderLoop(()=>{
            this.scene.render();
        })

    }


    public AdjustCamera() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

}