export interface ModelConfig {
    key: string;
    path: string;
    file: string;
}

export interface PrefabConfig {
    key: string;
    modelKey: string;
    materialKey: string;
    rotation?: number[];
}