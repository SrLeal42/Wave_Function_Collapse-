import * as B from '@babylonjs/core';
import "@babylonjs/loaders/glTF";

import { MaterialInstance } from './MaterialManager';

import { MaterialsModelsConfig } from '../interfaces/MaterialsModelsConfig';

export class ModelsManager{

    public scene? : B.Scene;

    public modelsMap = new Map<string, B.AbstractMesh>();

    // Armazena os modelos base carregados do disco (sem material)
    private rawMeshesMap = new Map<string, B.AbstractMesh>();

    private isInitialized = false;


    
    public async Initialize(scene: B.Scene, configPath: string) : Promise<void> {
        
        if(this.isInitialized)
            return;

        this.scene = scene;

        if (!MaterialInstance.IsInitialized())
            await MaterialInstance.Initialize(scene, configPath);

        const response = await fetch(configPath);
        const config: MaterialsModelsConfig = await response.json();

        for (const modelConfig of config.models) {
            await this.LoadRawModel(modelConfig.key, modelConfig.path, modelConfig.file);
        }

        await this.CreateConfigPrefabs(config);

        this.isInitialized = true;

    }


    private async LoadRawModel(key: string, path: string, file: string): Promise<void> {
        if (this.rawMeshesMap.has(key)) return;

        try {
            const result = await B.SceneLoader.ImportMeshAsync("", path, file, this.scene);
            
            const root = result.meshes[0];
            root.name = key + "_RawRoot";
            
            root.setEnabled(false);

            this.rawMeshesMap.set(key, root);
            
        } catch (e) {
            console.error(`Falha ao carregar modelo base: ${key} de ${path + file}`, e);
        }
    }

    private async CreateConfigPrefabs(config: MaterialsModelsConfig) : Promise<void>{
        
        for (const prefabConfig of config.prefabs) {
            
            const rawRoot = this.rawMeshesMap.get(prefabConfig.modelKey);
            if (!rawRoot) {
                console.warn(`Modelo base "${prefabConfig.modelKey}" não encontrado para o prefab "${prefabConfig.key}"`);
                continue;
            }

            const mat = MaterialInstance.GetMaterial(prefabConfig.materialKey);
            if (!mat) {
                console.warn(`Material "${prefabConfig.materialKey}" não encontrado para o prefab "${prefabConfig.key}"`);
                continue;
            }

            const templateRoot = rawRoot.clone(prefabConfig.key + "_Template", null, false)!;

            if (prefabConfig.rotation && prefabConfig.rotation.length === 3) {
                templateRoot.rotation = new B.Vector3(
                    B.Tools.ToRadians(prefabConfig.rotation[0]),
                    B.Tools.ToRadians(prefabConfig.rotation[1]),
                    B.Tools.ToRadians(prefabConfig.rotation[2])
                );
            }

            templateRoot.getChildMeshes(false).forEach(mesh => {
                mesh.material = mat;
            });

            if (templateRoot instanceof B.Mesh) 
                templateRoot.material = mat;

            templateRoot.setEnabled(false);
            
            this.modelsMap.set(prefabConfig.key, templateRoot);
        }
 
    }

    public CreateInstance(key: string, name: string = key): B.TransformNode | null {
        const templateRoot = this.modelsMap.get(key);

        if (!templateRoot) {
            console.warn(`Template (prefab) "${key}" não está carregado!`);
            return null;
        }

        const instanceRoot = templateRoot.instantiateHierarchy(undefined, undefined, (source, clone) => {
            clone.name = name;
        });

        // console.log(instanceRoot)

        if (!instanceRoot) {
            console.warn(`Falha ao instanciar "${key}"`);
            return null;
        }
        
        instanceRoot.setEnabled(true);

       return instanceRoot as B.TransformNode;
    }

}


export const ModelsInstance = new ModelsManager(); 