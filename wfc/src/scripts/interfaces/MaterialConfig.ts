import { MaterialsType } from "../Utilities";

export interface MaterialConfig {
    key: string;
    type: MaterialsType;
    color?: number[]; // [r, g, b]
    path?: string;
}