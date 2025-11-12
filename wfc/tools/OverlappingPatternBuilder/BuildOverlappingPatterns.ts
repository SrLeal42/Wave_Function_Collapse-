import * as fs from "fs/promises";
import Jimp from "jimp";

// --- CONFIGURAÇÃO ---
const INPUT_IMAGE_PATH = './tools/OverlappingPatternBuilder/input/input-pattern.png';
const SKELETON_PATH = './tools/OverlappingPatternBuilder/skeletons/Skeleton_Pattern_Flowers.json';
const OUTPUT_JSON_PATH = './tools/OverlappingPatternBuilder/output/Generated_Overlapping_Pattern.json';
// --------------------

// --- CONSTANTES ---
const MAX_WEIGHT = 100;
const MIN_WEIGHT = 1;
const N = 3; 

// Tipos
// type Legend = { [hexColor: string]: string };
type Pattern = string[][];
type Rules = { up: number[], down: number[], left: number[], right: number[] };
// --------------------

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


async function BuildOverlappingPattern() {
    console.log(`Iniciando Overlapping Model Builder (N=${N})...`);

    const [skeleton, image] = await LoadInputs();
    const legend = skeleton.legend;

    console.log("Processando imagem de exemplo em grid de tiles...");
    const grid: string[][] = [];
    for (let y = 0; y < image.bitmap.height; y++) {
        grid[y] = [];
        for (let x = 0; x < image.bitmap.width; x++) {
            const hex = IntToHex(image.getPixelColor(x, y));
            const tileId = legend[hex];
            if (!tileId) {
                console.warn(`Cor não encontrada na legenda: ${hex} em (${x},${y})`);
                grid[y][x] = "NULL";
            } else {
                grid[y][x] = tileId;
            }
        }
    }

    console.log("Extraindo padrões NxN únicos...");
    const patternWeights = new Map<string, { pattern: Pattern, weight: number }>();

    for (let y = 0; y < image.bitmap.height - (N - 1); y++) {
        for (let x = 0; x < image.bitmap.width - (N - 1); x++) {
            
            // Extrai o padrão N×N
            const pattern: Pattern = [];
            for (let dy = 0; dy < N; dy++) {
                pattern[dy] = [];
                for (let dx = 0; dx < N; dx++) {
                    pattern[dy][dx] = grid[y + dy][x + dx];
                }
            }

            // Usa JSON.stringify para criar uma chave única para o Map
            const key = JSON.stringify(pattern);
            const entry = patternWeights.get(key);
            
            if (entry) {
                entry.weight++; // Padrão já existe, só incrementa o peso
            } else {
                patternWeights.set(key, { pattern: pattern, weight: 1 }); // Novo padrão
            }
        }
    }

    // "Compilar" Padrões
    // Converte o Map em um array e cria o mapa de ID numérico
    const compiledPatterns: { id: number, pattern: Pattern, weight: number }[] = [];
    const idMap = new Map<string, number>(); // stringify(pattern) -> ID
    
    let currentId = 0;
    for (const [key, data] of patternWeights.entries()) {
        compiledPatterns.push({
            id: currentId,
            pattern: data.pattern,
            weight: data.weight
        });
        idMap.set(key, currentId);
        currentId++;
    }

    const allWeights = compiledPatterns.map(p => p.weight);
    const nonZeroWeights = allWeights.filter(w => w > 0);
    
    let maxWeight = 1;
    let minWeight = 1;

    if (nonZeroWeights.length > 0) {
        maxWeight = Math.max(...nonZeroWeights);
        minWeight = Math.min(...nonZeroWeights);
    }

    for (const pattern of compiledPatterns) {
        pattern.weight = NormalizeWeight(
            pattern.weight, 
            maxWeight, 
            minWeight, 
            MAX_WEIGHT, 
            MIN_WEIGHT
        );
    }

    console.log(`Calculando regras de sobreposição para ${compiledPatterns.length} padrões...`);
    const finalRules: { [id: number]: Rules } = {};

    for (const p1 of compiledPatterns) {
        finalRules[p1.id] = { up: [], down: [], left: [], right: [] };

        for (const p2 of compiledPatterns) {

            if (checkOverlap(p1.pattern, p2.pattern, "right")) {
                finalRules[p1.id].right.push(p2.id);
            }
            if (checkOverlap(p1.pattern, p2.pattern, "left")) {
                finalRules[p1.id].left.push(p2.id);
            }
            if (checkOverlap(p1.pattern, p2.pattern, "down")) {
                finalRules[p1.id].down.push(p2.id);
            }
            if (checkOverlap(p1.pattern, p2.pattern, "up")) {
                finalRules[p1.id].up.push(p2.id);
            }

        }
    }

    const finalOutput = {
        name: skeleton.name,
        N: N,
        // @ts-expect-error
        tileLegend: skeleton.tiles.reduce((acc, tile) => {
            acc[tile.id] = { matKey: tile.matKey, modelKey: tile.modelKey, height: tile.height };
            return acc;
        }, {}),
        idMap: Object.fromEntries(idMap), 
        patternData: compiledPatterns.map(p => p.pattern), 
        weights: compiledPatterns.map(p => p.weight),
        rules: finalRules,
    };

    await fs.writeFile(OUTPUT_JSON_PATH, JSON.stringify(finalOutput, null, 4));
    console.log(`Sucesso! Modelo Overlapping salvo em: ${OUTPUT_JSON_PATH}`);
}

/**
 * A função-chave. Checa se P1 e P2 podem se sobrepor na direção dada.
 * Ex: N=3, "right" -> Checa se as 2 colunas da direita de P1
 * são iguais às 2 colunas da esquerda de P2.
 */
function checkOverlap(p1: Pattern, p2: Pattern, direction: "up" | "down" | "left" | "right"): boolean {
    for (let y = 0; y < N; y++) {
        for (let x = 0; x < N; x++) {
            
            if (direction === "right") {
                // Checa P1[y][x+1] vs P2[y][x]
                if (x < N - 1 && p1[y][x + 1] !== p2[y][x]) return false;
            } 
            else if (direction === "left") {
                // Checa P1[y][x] vs P2[y][x+1]
                if (x < N - 1 && p1[y][x] !== p2[y][x + 1]) return false;
            }
            else if (direction === "down") {
                // Checa P1[y+1][x] vs P2[y][x]
                if (y < N - 1 && p1[y + 1][x] !== p2[y][x]) return false;
            }
            else if (direction === "up") {
                // Checa P1[y][x] vs P2[y+1][x]
                if (y < N - 1 && p1[y][x] !== p2[y + 1][x]) return false;
            }
        }
    }
    return true;
}


async function LoadInputs(): Promise<[any, Jimp]> {
    try {

        const [skeletonFile, image] = await Promise.all([
            fs.readFile(SKELETON_PATH, 'utf-8'),
            Jimp.read(INPUT_IMAGE_PATH)
        ]);

        return [JSON.parse(skeletonFile), image as Jimp]; 

    } catch (err) {
        console.error("Erro ao carregar inputs", err);
        throw err;
    }
}

BuildOverlappingPattern();