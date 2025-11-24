import * as B from "@babylonjs/core"; 

import { InputsInstance } from "../managers/InputsManager";
import { MaterialInstance } from "../managers/MaterialManager";

export class Player {

    public scene: B.Scene;
    
    public pivot: B.TransformNode;

    public model : B.Mesh;

    public vel = .3;

    constructor(scene: B.Scene, x: number, y: number, z: number, diameter = 5, vel = .3){

        this.scene = scene;

        this.pivot = new B.TransformNode("Player", scene);
        this.pivot.position = new B.Vector3(x,y,z);
    
        this.model = B.CreateSphere("Player_Model",{ diameter: diameter }, scene);
        this.model.material = MaterialInstance.GetMaterial("PlayerDefaultUnlit");

        this.vel = vel;

        this.model.parent = this.pivot;
    }




    public Move() : void {

        const vertical = InputsInstance.Vertical as number;
        const horizontal = InputsInstance.Horizontal as number;

        this.pivot.position.z += vertical * this.vel;
        this.pivot.position.x += horizontal * this.vel;

    }



}