import * as B from '@babylonjs/core';

// import { MaterialConfig } from '../interfaces/MaterialConfig';
import { MaterialsModelsConfig } from '../interfaces/MaterialsModelsConfig';

export class MaterialManager{

    public scene? : B.Scene;

    public materials = new Map<string, B.StandardMaterial>();

    private isInitialized = false;


    public async Initialize(scene: B.Scene, configPath: string) : Promise<void> {

        if(this.isInitialized)
            return;

        this.scene = scene;

        const response = await fetch(configPath);
        const config: MaterialsModelsConfig = await response.json();

        await this.CreateMaterialsFromConfig(config);

        this.isInitialized = true;

    }

    public async CreateMaterialsFromConfig(config: MaterialsModelsConfig) : Promise<void>{

        for (const matConfig of config.materials) {
            let mat: B.StandardMaterial | null = null;

            switch (matConfig.type) {
                case 'simple':
                    if (matConfig.color && matConfig.color.length === 3) {
                        const color = new B.Color3(matConfig.color[0], matConfig.color[1], matConfig.color[2]);
                        mat = this.CreateSimpleUnlitMaterial(matConfig.key + "_Mat", color);
                    }
                    break;
                case 'textured':
                    if (matConfig.path) {
                        mat = this.CreateTexturedUnlitMaterial(matConfig.key + "_Mat", matConfig.path);
                    }
                    break;
            }

            if (mat)
                this.materials.set(matConfig.key, mat);
            else 
                console.warn(`Falha ao criar material: ${matConfig.key}`);
            
        }

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

    public IsInitialized(): boolean {
        return this.isInitialized;
    }

}


export const MaterialInstance = new MaterialManager(); 
