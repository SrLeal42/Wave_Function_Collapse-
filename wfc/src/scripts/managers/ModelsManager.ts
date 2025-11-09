import * as B from '@babylonjs/core';
import "@babylonjs/loaders/glTF";

import { MaterialInstance } from './MaterialManager';

export class ModelsManager{

    public scene? : B.Scene;

    public modelsMap = new Map<string, B.AbstractMesh[]>();

    private isInitialized = false;


    
    public async Initialize(scene: B.Scene) : Promise<void> {
        
        if(this.isInitialized)
            return;

        this.scene = scene;

        await MaterialInstance.Initialize(scene);

        await this.LoadModel("defaultUnlit", "./assets/models/street/", "fundo.glb", "defaultUnlit");

        // --- GRASSLAND
        await this.LoadModel("grassUnlit", "./assets/models/street/", "fundo.glb", "grassUnlit");
        await this.LoadModel("grassWetUnlit", "./assets/models/street/", "fundo.glb", "grassWetUnlit");
        await this.LoadModel("waterUnlit", "./assets/models/street/", "fundo.glb", "waterUnlit");
        await this.LoadModel("sandUnlit", "./assets/models/street/", "fundo.glb", "sandUnlit");
        await this.LoadModel("stoneUnlit", "./assets/models/street/", "fundo.glb", "stoneUnlit");
        await this.LoadModel("lowMountainUnlit", "./assets/models/street/", "fundo.glb", "lowMountainUnlit");
        await this.LoadModel("highMountainUnlit", "./assets/models/street/", "fundo.glb", "highMountainUnlit");
        await this.LoadModel("snowUnlit", "./assets/models/street/", "fundo.glb", "snowUnlit");

        // --- STREET
        await this.LoadModel("fundo", "./assets/models/street/", "fundo.glb", "fundoUnlit");
 
        this.isInitialized = true;

    }


    // Carrega uma vez e salva no Map
    public async LoadModel(key: string, path: string, file: string, matKey: string): Promise<void> {

        if (this.modelsMap.has(key)) return;

        const result = await B.SceneLoader.ImportMeshAsync("", path, file, this.scene);

        // O resultado pode ter vários meshes (hierarquia)
        this.modelsMap.set(key, result.meshes);

        // Opcional: deixa o original invisível
        // result.meshes.forEach(m => m.setEnabled(false));

        const mat = MaterialInstance.GetMaterial(matKey)

        result.meshes.forEach(m => m.material = mat);

    }

    // Retorna uma cópia do modelo para usar na cena
    public CreateInstance(key: string, name: string = key): B.TransformNode | null {
        const originalMeshes = this.modelsMap.get(key);

        if (!originalMeshes) {
            console.warn(`Modelo "${key}" não está carregado!`);
            return null;
        }

        // Instancia mais leve que clone
        const root = new B.TransformNode(name, this.scene);

        originalMeshes.forEach((mesh) => {
            const instance = mesh.instantiateHierarchy()!;
            instance.parent = root;
        });

        root.setEnabled(true);

        return root;
    }

}


export const ModelsInstance = new ModelsManager(); 