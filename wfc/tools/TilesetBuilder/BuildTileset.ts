import * as fs from "fs/promises";
import Jimp from "jimp"; 

import { Direction } from "../../src/scripts/Utilities"

// --- CONFIGURAÇÃO ---
const INPUT_IMAGE_PATH = './tools/TilesetBuilder/input/input-map.png';
const SKELETON_PATH = './tools/TilesetBuilder/skeletons/Skeleton_Tileset_Streets.json';
const OUTPUT_JSON_PATH = './tools/TilesetBuilder/output/Generated_Street_Tileset.json';
// --------------------

// --- CONSTANTES ---
const MAX_WEIGHT = 100;
const MIN_WEIGHT = 1;
const MAX_AFFINITY_MULTIPLIER = 10;
const MIN_AFFINITY_MULTIPLIER = 1;


// --- Tipos ---
// type Direction = "up" | "down" | "left" | "right";

type Legend = { [hexColor: string]: string };
type TileSkeleton = { id: string, [key: string]: any }; // Tile do arquivo de input (string)
type Rules = Record<Direction, Set<number>>;
type RulesMap = Map<number, Rules>;
type WeightsMap = Map<number, number>; // <tileId: number, count: number>
type AffinitiesMap = Map<number, Map<number, number>>; // <tileId: number, <neighborId: number, count: number>>



// type Legend = { [hexColor: string]: string };
// type Tile = { id: string, [key: string]: any };
// type Rules = { [tileId: string]: { [dir: string]: Set<string> } };
// type Weights = { [tileId: string]: number };
// type Affinities = { [tileId: string]: { [neighborId: string]: number } };

/** Converte int -> Hex (#RRGGBB) */
function IntToHex(color: number): string {
    const hex = (color >>> 8).toString(16).toUpperCase();
    return '#' + '0'.repeat(6 - hex.length) + hex;
}

/**
 * Mapeia um valor de um range antigo para um novo range.
 */
function NormalizeWeight(weight: number, maxWeight: number, minWeight: number, max: number, min: number ): number {
    if (weight === 0) return 0;
    
    // const min = 1;
    // const max = 100;
    
    if (maxWeight === minWeight) return min; 

    const normalized = 
        ((weight - minWeight) / (maxWeight - minWeight)) * (max - min) + min;

    return Math.round(normalized);
}

async function BuildTileset() {
    console.log('Iniciando o builder de tileset...');

    // Load inputs
    const [skeleton, image] = await LoadInputs();
    const legend = skeleton.legend;
    const baseTiles: TileSkeleton[] = skeleton.tiles;

    // const tileIDs = baseTiles.map(t => t.id);
    // const rules: Rules = {};
    // const weights: Weights = {};
    // const affinityCounts: Affinities = {};

    
    console.log("Criando mapa de IDs (string -> number)...");
    const idStringMap = new Map<string, number>(); // "grass" -> 0
    const finalTileData: any[] = []; // O novo array 'tileData'

    baseTiles.forEach((baseTile, index) => {
        const stringId = baseTile.id;
        const numberId = index; // O ID numérico é o índice do array

        idStringMap.set(stringId, numberId);

        // Prepara os dados do tile para o JSON final
        const tileData = { ...baseTile };
        // delete tileData.id; // Remove a string "id"
        delete tileData.weight; // O peso será salvo em um array separado
        delete tileData.affinities; // As afinidades serão salvas em um objeto separado
        
        finalTileData.push({
            ...tileData,
            id: numberId, // Adiciona o novo ID numérico
        });
    });
    // console.log("Mapa de IDs criado:", idStringMap);
    // tileIDs.forEach(id => {
    //     weights[id] = 0;
    //     affinityCounts[id] = {};
    //     rules[id] = {
    //         up: new Set(),
    //         down: new Set(),
    //         left: new Set(),
    //         right: new Set(),
    //     };
    //     tileIDs.forEach(n => affinityCounts[id][n] = 0);
    // });


    // --- INICIALIZAR ESTRUTURAS DE DADOS NUMÉRICAS ---
    const numTileTypes = idStringMap.size;
    const rules: RulesMap = new Map();
    const weights: WeightsMap = new Map();
    const affinityCounts: AffinitiesMap = new Map();


    for (let i = 0; i < numTileTypes; i++) {
        weights.set(i, 0);
        rules.set(i, { up: new Set(), down: new Set(), left: new Set(), right: new Set() });
        
        const neighborMap = new Map<number, number>();
        for (let j = 0; j < numTileTypes; j++) {
            neighborMap.set(j, 0);
        }
        affinityCounts.set(i, neighborMap);
    }


    console.log('Analisando pixels da imagem de input...');

    for (let y = 0; y < image.bitmap.height; y++) {
        for (let x = 0; x < image.bitmap.width; x++) {

            const centerHex = IntToHex(image.getPixelColor(x, y));
            const centerStringId = legend[centerHex];

            if (!centerStringId) continue;

            const centerId = idStringMap.get(centerStringId)!;
            weights.set(centerId, weights.get(centerId)! + 1);

            const neighbors : { dir: Direction; x: number; y: number }[] = [
                { dir: 'up', x, y: y - 1 },
                { dir: 'down', x, y: y + 1 },
                { dir: 'left', x: x - 1, y },
                { dir: 'right', x: x + 1, y },
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < image.bitmap.width && n.y >= 0 && n.y < image.bitmap.height) {

                    const neighborHex = IntToHex(image.getPixelColor(n.x, n.y));
                    const neighborId = idStringMap.get(legend[neighborHex]);

                    if (neighborId === undefined || neighborId === null) continue;

                    rules.get(centerId)![n.dir].add(neighborId);
                    affinityCounts.get(centerId)!.set(neighborId, affinityCounts.get(centerId)!.get(neighborId)! + 1);
                    
                    // rules[centerId][n.dir].add(neighborId);
                    // affinityCounts[centerId][neighborId]++;

                }
            }

        }
    }

    console.log("Calculando afinidades...");
    // --- MONTAR O JSON DE SAÍDA OTIMIZADO ---
    const finalOutput: any = {
        name: skeleton.name,
        type: skeleton.type,
        idMap: Object.fromEntries(idStringMap), // Salva o mapa "grass": 0
        tileData: finalTileData,                // Salva os dados [{id: 0, modelKey: ...}, ...]
        weights: [],                            // Será um array [100, 30, 25]
        rules: {},                              // { "0": { "up": [0, 2], ... }, "1": ... }
        affinities: {}                           // { "0": { "0": 4.0, "2": 2.0 }, "1": ... }
    };

    // const allWeights = Object.values(weights);
    // const nonZeroWeights = allWeights.filter(w => w > 0);

    let maxWeight = image.bitmap.height * image.bitmap.width; // 1;
    let minWeight = 1;
    
    // if (nonZeroWeights.length > 0) {
    //     maxWeight = Math.max(...nonZeroWeights);
    //     minWeight = Math.min(...nonZeroWeights);
    // }


    for (let numberId = 0; numberId < numTileTypes; numberId++) {
        
        const normalizedWeight = NormalizeWeight(weights.get(numberId)!, maxWeight, minWeight, MAX_WEIGHT, MIN_WEIGHT);
        finalOutput.weights[numberId] = normalizedWeight; // Salva no array pelo índice

        const finalAffinities: { [key: number]: number } = {};
        const affinitiesForThisTile = affinityCounts.get(numberId)!;
        const totalAffinity = Array.from(affinitiesForThisTile.values()).reduce((a, b) => a + b, 0);

        let minProb = 1.0;
        let maxProb = -Infinity;

        if (totalAffinity > 0) {

            for (const count of affinitiesForThisTile.values()) {
                const prob = count / totalAffinity;
                if (prob > 0 && prob < minProb) minProb = prob;
                if (prob > maxProb) maxProb = prob;
            }

            for (const [neighborId, count] of affinitiesForThisTile.entries()) {
                const prob = count / totalAffinity;
                if (prob > 0) {
                    finalAffinities[neighborId] = NormalizeWeight(prob, maxProb, minProb, MAX_AFFINITY_MULTIPLIER, MIN_AFFINITY_MULTIPLIER);
                }
            }

        }
        if (Object.keys(finalAffinities).length > 0) {
            finalOutput.affinities[numberId] = finalAffinities;
        }

        const finalRules = rules.get(numberId)!;
        finalOutput.rules[numberId] = {
            up: Array.from(finalRules.up),
            down: Array.from(finalRules.down),
            left: Array.from(finalRules.left),
            right: Array.from(finalRules.right),
        };
    }



    // const finalTileset = skeleton;
    // delete finalTileset.legend;

    // finalTileset.tiles = [];
    // finalTileset.rules = {};

    // for (const baseTile of baseTiles) {
    //     const id = baseTile.id;

    //     const finalAffinities: { [key: string]: number } = {};
    //     const totalAffinity = Object.values(affinityCounts[id]).reduce((a, b) => a + b, 0);

    //     let minProb = 1.0;
    //     let maxProb = -Infinity;

    //     if (totalAffinity > 0) {

            
    //         for (const nId of tileIDs) {
    //             const prob = affinityCounts[id][nId] / totalAffinity;

    //             if (prob > 0 && prob < minProb) 
    //                 minProb = prob;

    //             if (prob > maxProb)
    //                 maxProb = prob;
    //         }

    //         for (const nId of tileIDs) {
    //             const prob = affinityCounts[id][nId] / totalAffinity;
                
    //             if (prob > 0) {
    //                 finalAffinities[nId] = 
    //                     NormalizeWeight(prob, 
    //                         maxProb, 
    //                         minProb, 
    //                         MAX_AFFINITY_MULTIPLIER, 
    //                         MIN_AFFINITY_MULTIPLIER
    //                     ) // prob / minProb;
    //                 }
            
    //         }

    //     }

    //     finalTileset.tiles.push({
    //         ...baseTile,
    //         weight: NormalizeWeight(weights[id], maxWeight, minWeight, MAX_WEIGHT, MIN_WEIGHT),
    //         affinities: finalAffinities,
    //     });

    //     finalTileset.rules[id] = {
    //         up: Array.from(rules[id].up),
    //         down: Array.from(rules[id].down),
    //         left: Array.from(rules[id].left),
    //         right: Array.from(rules[id].right),
    //     };
    // }

    await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify(finalOutput, null, 4));
    console.log(`Sucesso! Tileset salvo em: ${OUTPUT_JSON_PATH}`);
}

/** Carrega arquivos */
async function LoadInputs(): Promise<[any, InstanceType<typeof Jimp>]> {
    try {
        const [skeletonFile, image] = await Promise.all([
            fs.readFile(SKELETON_PATH, 'utf-8'),
            Jimp.read(INPUT_IMAGE_PATH)
        ]);
        return [JSON.parse(skeletonFile), image];
    } catch (err) {
        console.error("Erro ao carregar inputs", err);
        throw err;
    }
}


BuildTileset();
