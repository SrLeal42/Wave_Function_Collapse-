import * as fs from "fs/promises";
import Jimp from "jimp";

// --- CONFIGURAÇÃO ---
const INPUT_IMAGE_PATH = './tools/TilesetBuilder/input/input-map.png';
const SKELETON_PATH = './tools/TilesetBuilder/skeletons/Skeleton_Tileset_Grassland.json';
const OUTPUT_JSON_PATH = './tools/TilesetBuilder/output/Generated_Tileset.json';
// --------------------

// --- CONSTANTES ---
const MAX_WEIGHT = 100;
const MIN_WEIGHT = 1;
const MAX_AFFINITY_MULTIPLIER = 10;
const MIN_AFFINITY_MULTIPLIER = 1;


// --- Tipos ---
// type Legend = { [hexColor: string]: string };
type Tile = { id: string, [key: string]: any };
type Rules = { [tileId: string]: { [dir: string]: Set<string> } };
type Weights = { [tileId: string]: number };
type Affinities = { [tileId: string]: { [neighborId: string]: number } };


/** Converte int -> Hex (#RRGGBB) */
function IntToHex(color: number): string {
    const hex = (color >>> 8).toString(16).toUpperCase();
    return '#' + '0'.repeat(6 - hex.length) + hex;
}

/**
 * Mapeia um valor de um range antigo para um novo range.
 * (Ex: Mapeia 500 [de 100-5000] para 10 [de 1-100])
 */
function NormalizeWeight(weight: number, maxWeight: number, minWeight: number, max: number, min: number ): number {
    if (weight === 0) return 0; // Não normaliza tiles que não existem
    
    // const min = 1;
    // const max = 100;
    
    // Evita divisão por zero se todos os pesos forem iguais
    if (maxWeight === minWeight) return min; 

    const normalized = 
        ((weight - minWeight) / (maxWeight - minWeight)) * (max - min) + min;
    
    // Retorna um número inteiro
    return Math.round(normalized);
}

async function BuildTileset() {
    console.log('Iniciando o builder de tileset...');

    // Load inputs
    const [skeleton, image] = await LoadInputs();

    const legend = skeleton.legend;
    const baseTiles = skeleton.tiles as Tile[];
    const tileIDs = baseTiles.map(t => t.id);

    const rules: Rules = {};
    const weights: Weights = {};
    const affinityCounts: Affinities = {};

    tileIDs.forEach(id => {
        weights[id] = 0;
        affinityCounts[id] = {};
        rules[id] = {
            up: new Set(),
            down: new Set(),
            left: new Set(),
            right: new Set(),
        };
        tileIDs.forEach(n => affinityCounts[id][n] = 0);
    });

    console.log('Analisando pixels da imagem de input...');

    for (let y = 0; y < image.bitmap.height; y++) {
        for (let x = 0; x < image.bitmap.width; x++) {

            const centerHex = IntToHex(image.getPixelColor(x, y));
            const centerId = legend[centerHex];

            if (!centerId) continue;
            weights[centerId]++;

            const neighbors = [
                { dir: 'up', x, y: y - 1 },
                { dir: 'down', x, y: y + 1 },
                { dir: 'left', x: x - 1, y },
                { dir: 'right', x: x + 1, y },
            ];

            for (const n of neighbors) {
                if (n.x >= 0 && n.x < image.bitmap.width && n.y >= 0 && n.y < image.bitmap.height) {

                    const neighborHex = IntToHex(image.getPixelColor(n.x, n.y));
                    const neighborId = legend[neighborHex];

                    if (!neighborId) continue;

                    rules[centerId][n.dir].add(neighborId);
                    affinityCounts[centerId][neighborId]++;

                }
            }

        }
    }

    const allWeights = Object.values(weights);
    const nonZeroWeights = allWeights.filter(w => w > 0);

    let maxWeight = image.bitmap.height * image.bitmap.width; // 1;
    let minWeight = 1;
    
    // if (nonZeroWeights.length > 0) {
    //     maxWeight = Math.max(...nonZeroWeights);
    //     minWeight = Math.min(...nonZeroWeights);
    // }

    console.log("Calculando afinidades...");

    const finalTileset = skeleton;
    delete finalTileset.legend;

    finalTileset.tiles = [];
    finalTileset.rules = {};

    for (const baseTile of baseTiles) {
        const id = baseTile.id;

        const finalAffinities: { [key: string]: number } = {};
        const totalAffinity = Object.values(affinityCounts[id]).reduce((a, b) => a + b, 0);

        let minProb = 1.0;
        let maxProb = -Infinity;

        if (totalAffinity > 0) {

            
            for (const nId of tileIDs) {
                const prob = affinityCounts[id][nId] / totalAffinity;

                if (prob > 0 && prob < minProb) 
                    minProb = prob;

                if (prob > maxProb)
                    maxProb = prob;
            }

            for (const nId of tileIDs) {
                const prob = affinityCounts[id][nId] / totalAffinity;
                
                if (prob > 0) {
                    finalAffinities[nId] = 
                        NormalizeWeight(prob, 
                            maxProb, 
                            minProb, 
                            MAX_AFFINITY_MULTIPLIER, 
                            MIN_AFFINITY_MULTIPLIER
                        ) // prob / minProb;
                    }
            
            }

        }

        finalTileset.tiles.push({
            ...baseTile,
            weight: NormalizeWeight(weights[id], maxWeight, minWeight, MAX_WEIGHT, MIN_WEIGHT),
            affinities: finalAffinities,
        });

        finalTileset.rules[id] = {
            up: Array.from(rules[id].up),
            down: Array.from(rules[id].down),
            left: Array.from(rules[id].left),
            right: Array.from(rules[id].right),
        };
    }

    await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify(finalTileset, null, 4));
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
