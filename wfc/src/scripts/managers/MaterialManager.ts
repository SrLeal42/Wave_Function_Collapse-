import * as B from '@babylonjs/core';


export class MaterialManager{

    public scene? : B.Scene;

    public materials = new Map<string, B.StandardMaterial>();

    private isInitialized = false;


    public async Initialize(scene: B.Scene) : Promise<void> {

        if(this.isInitialized)
            return;

        this.scene = scene;

        this.materials.set('defaultUnlit', this.CreateDefaultUnLitMaterial());

        this.materials.set('grassUnlit', this.CreateGrassUnLitMaterial());
        this.materials.set('grassWetUnlit', this.CreateGrassWetUnLitMaterial());
        this.materials.set('waterUnlit', this.CreateWaterUnLitMaterial());
        this.materials.set('sandUnlit', this.CreateSandUnLitMaterial());
        this.materials.set('stoneUnlit', this.CreateStoneUnLitMaterial());
        this.materials.set('lowMountainUnlit', this.CreateLowMountainUnLitMaterial());
        this.materials.set('highMountainUnlit', this.CreateHighMountainUnLitMaterial());
        this.materials.set('snowUnlit', this.CreateSnowUnLitMaterial());
        this.materials.set('PlayerDefaultUnlit', this.CreatePlayerDefaultUnLitMaterial());

        this.materials.set('fundoUnlit', this.CreateFundoUnLitMaterial());
        
        this.isInitialized = true;

    }

    
    public CreateDefaultUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Default_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(1, 1, 1);

        return mat;
    }


    public CreateGrassUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Grass_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(0, 1, 0);

        return mat;
    }

    public CreateGrassWetUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Grass_Wet_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(0, .7, 0);

        return mat;
    }

    public CreateWaterUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Water_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(0, 0, 1);

        return mat;
    }

    public CreateSandUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Sand_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(1, 1, .5);

        return mat;
    }


    public CreateStoneUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Stone_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(.5, .5, .5);

        return mat;
    }

    public CreateLowMountainUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Low_Mountain_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(.3, .3, .3);

        return mat;
    }

    public CreateHighMountainUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('High_Mountain_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(.2, .2, .2);

        return mat;
    }

    public CreateSnowUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Snow_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(1, 1, .8);

        return mat;
    }


    public CreatePlayerDefaultUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Player_Default_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = new B.Color3(1, 0, 0);

        return mat;
    }


    public CreateFundoUnLitMaterial() : B.StandardMaterial {

        const mat = new B.StandardMaterial('Fundo_Unlit_Mat', this.scene);
        mat.disableLighting = true;
        const emissiveTex = new B.Texture("./assets/textures/street/Fundo.png", this.scene);
        mat.emissiveTexture = emissiveTex;

        return mat;
    }



    public GetMaterial(name : string) : B.StandardMaterial {
        if (!this.isInitialized)
            throw new Error("MaterialManager não foi inicializado. Chame initialize(scene) primeiro.");

        if (!this.materials.has(name))
            throw new Error("Não há material com esse nome.");

        return this.materials.get(name)!;

    } 

}


export const MaterialInstance = new MaterialManager(); 
