import * as B from '@babylonjs/core';


export class MaterialManager{

    public scene? : B.Scene;

    public materials = new Map<string, B.StandardMaterial>();

    private isInitialized = false;


    public async Initialize(scene: B.Scene) : Promise<void> {

        if(this.isInitialized)
            return;

        this.scene = scene;

        this.materials.set('defaultUnlit', this.CreateSimpleUnlitMaterial('Default_Unlit_Mat', new B.Color3(1, 1, 1)));

        // --- GRASSLAND
        this.materials.set('grassUnlit', this.CreateSimpleUnlitMaterial('Grass_Unlit_Mat', new B.Color3(0, 1, 0)));
        this.materials.set('grassWetUnlit', this.CreateSimpleUnlitMaterial('Grass_Wet_Unlit_Mat', new B.Color3(0, .7, 0)));
        this.materials.set('waterUnlit', this.CreateSimpleUnlitMaterial('Water_Unlit_Mat', new B.Color3(0, 0, 1)));
        this.materials.set('sandUnlit', this.CreateSimpleUnlitMaterial('Grass_Unlit_Mat', new B.Color3(1, 1, .5)));
        this.materials.set('stoneUnlit', this.CreateSimpleUnlitMaterial('Stone_Unlit_Mat', new B.Color3(.5, .5, .5)));
        this.materials.set('lowMountainUnlit', this.CreateSimpleUnlitMaterial('Low_Mountain_Unlit_Mat', new B.Color3(.3, .3, .3)));
        this.materials.set('highMountainUnlit', this.CreateSimpleUnlitMaterial('High_Mountain_Unlit_Mat', new B.Color3(.2, .2, .2)));
        this.materials.set('snowUnlit', this.CreateSimpleUnlitMaterial('Snow_Unlit_Mat', new B.Color3(1, 1, .8)));
        this.materials.set('PlayerDefaultUnlit', this.CreateSimpleUnlitMaterial('Player_Default_Unlit_Mat', new B.Color3(1, 0, 0)));


        // --- STREET
        this.materials.set('fundoUnlit', this.CreateTexturedUnlitMaterial('Fundo_Unlit_Mat', "./assets/textures/street/Fundo.png"));
        
        this.materials.set('verticalStraightStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Linha_Reta_Vertical_Unlit_Mat', "./assets/textures/street/LinhaRetaVertical.png"));
        this.materials.set('horizontalStraightStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Linha_Reta_Horizontal_Unlit_Mat', "./assets/textures/street/LinhaRetaHorizontal.png"));
        this.materials.set('rightUpStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Direita_Cima_Unlit_Mat', "./assets/textures/street/DireitaCima.png"));
        this.materials.set('rightDownStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Direita_Baixo_Unlit_Mat', "./assets/textures/street/DireitaBaixo.png"));
        this.materials.set('leftUpStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Esquerda_Cima_Unlit_Mat', "./assets/textures/street/EsquerdaCima.png"));
        this.materials.set('leftDownStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Esquerda_Baixo_Unlit_Mat', "./assets/textures/street/EsquerdaBaixo.png"));
        this.materials.set('crossStreetUnlit', this.CreateTexturedUnlitMaterial('Estrada_Cruz_Unlit_Mat', "./assets/textures/street/Cruz.png"));
        
        // --- FLOWERS
        this.materials.set('greenUnlit', this.CreateSimpleUnlitMaterial('Green_Unlit_Mat', new B.Color3(0, 1, 0)));
        this.materials.set('whiteUnlit', this.CreateSimpleUnlitMaterial('White_Unlit_Mat', new B.Color3(1, 1, 1)));
        this.materials.set('redUnlit', this.CreateSimpleUnlitMaterial('Red_Unlit_Mat', new B.Color3(1, 0, 0)));
        this.materials.set('darkGreenUnlit', this.CreateSimpleUnlitMaterial('Dark_Green_Unlit_Mat', new B.Color3(0, .5, 0)));


        this.isInitialized = true;

    }

    
    public CreateSimpleUnlitMaterial(name: string, color: B.Color3) : B.StandardMaterial {
        
        const mat = new B.StandardMaterial(name, this.scene);
        mat.disableLighting = true;
        mat.emissiveColor = color;

        return mat;
    }

    public CreateTexturedUnlitMaterial(name: string, path: string) : B.StandardMaterial {
        
        const mat = new B.StandardMaterial(name, this.scene);
        mat.disableLighting = true;
        const emissiveTex = new B.Texture(path, this.scene);
        mat.emissiveTexture = emissiveTex;

        mat.emissiveTexture.wrapU = B.Texture.CLAMP_ADDRESSMODE;
        mat.emissiveTexture.wrapV = B.Texture.CLAMP_ADDRESSMODE;

        return mat;

    }

    public GetMaterial(name : string) : B.StandardMaterial {
        if (!this.isInitialized)
            throw new Error("MaterialManager não foi inicializado. Chame initialize(scene) primeiro.");

        if (!this.materials.has(name))
            throw new Error("Não há material com esse nome: " + name);

        return this.materials.get(name)!;

    } 

}


export const MaterialInstance = new MaterialManager(); 
