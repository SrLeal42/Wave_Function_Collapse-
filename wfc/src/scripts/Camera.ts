import * as B from "@babylonjs/core"; 


export class Camera {

    public scene : B.Scene;    
    public engine : B.Engine;

    public camera : B.FreeCamera;

    public zoom = 1;

    constructor(scene : B.Scene){

        this.engine = scene.getEngine() as B.Engine;
        this.scene = scene;

        this.camera = new B.FreeCamera("MainCamera", new B.Vector3(0,0,-10), scene);
        this.camera.mode = B.Camera.ORTHOGRAPHIC_CAMERA;

        this.camera.rotation.x = 0;
        this.camera.rotation.y = 0;
        this.camera.rotation.z = 0;

    }


    public CalculateZoom() : void {

        const width = this.engine.getRenderWidth();
        const height = this.engine.getRenderHeight();

        this.camera.orthoLeft   = -width / (2 * this.zoom);
        this.camera.orthoRight  =  width / (2 * this.zoom);
        this.camera.orthoTop    =  height / (2 * this.zoom);
        this.camera.orthoBottom = -height / (2 * this.zoom);

    }


}