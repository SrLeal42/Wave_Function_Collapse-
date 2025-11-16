import { MaterialConfig } from "./MaterialConfig";
import { ModelConfig, PrefabConfig } from "./ModelConfig";

export interface MaterialsModelsConfig {
    materials: MaterialConfig[];
    models: ModelConfig[];
    prefabs: PrefabConfig[];
}