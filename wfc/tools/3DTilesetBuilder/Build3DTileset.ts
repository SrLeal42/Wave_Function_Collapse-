import * as fs from "fs/promises";
import Jimp from "jimp"; 

import { Direction } from "../../src/scripts/Utilities"

// --- CONFIGURAÇÃO ---
const INPUT_FOLDER = './tools/3DTilesetBuilder/input/colors/';
const SKELETON_PATH = './tools/3DTilesetBuilder/skeletons/Skeleton_3D_Tileset_Colors.json';
const OUTPUT_PATH = './tools/3DTilesetBuilder/output/Generated_3D_Tileset.json';

// Mapeamento: Quais imagens representam quais eixos?
// hDir: Direção Horizontal da imagem (+X)
// vDir: Direção Vertical da imagem (+Y na imagem = descendo, ou seja, -Y no mundo ou -Z ou -Z)
// Nota: Em imagens, Y cresce para baixo. 
// Se desenhamos uma vista frontal, o pixel (0,0) é o topo. O pixel (0,1) está ABAIXO dele.
const PLANES = [
    // Plano XY (Visão Frontal): X+ é Right, Y+ (imagem) é Down (mundo)
    { files: ['forward.png', 'back.png'], hRule: 'right', vRule: 'down' },
    
    // Plano XZ (Visão Topo): X+ é Right, Y+ (imagem) é Back (mundo - Z negativo)
    { files: ['up.png', 'down.png'],      hRule: 'right', vRule: 'back' },
    
    // Plano ZY (Visão Lateral): X+ (imagem) é Forward (mundo - Z positivo), Y+ (imagem) é Down (mundo)
    { files: ['left.png', 'right.png'],   hRule: 'forward', vRule: 'down' }
];
// --------------------


// --- CONSTANTES ---
const MAX_WEIGHT = 100;
const MIN_WEIGHT = 1;
// --------------------

// --- TIPOS ---
type Rules = { [key in Direction]: Set<number> };
type Skeleton = { name: string, legend: { [hex: string]: string }, tiles: any[] };
// --------------------


// --- HELPER ---
const OPPOSITES: Record<string, Direction> = {
    'up': 'down', 'down': 'up',
    'left': 'right', 'right': 'left',
    'forward': 'back', 'back': 'forward'
};
// --------------------


function IntToHex(color: number): string {
    const hex = (color >>> 8).toString(16).toUpperCase();
    return '#' + '0'.repeat(6 - hex.length) + hex;
}

function NormalizeWeight(weight: number, maxW: number, minW: number): number {
    if (weight === 0) return 0;
    if (maxW === minW) return MIN_WEIGHT;
    return Math.round(((weight - minW) / (maxW - minW)) * (MAX_WEIGHT - MIN_WEIGHT) + MIN_WEIGHT);
}

async function LoadImageInputs(input_image_path : string): Promise<InstanceType<typeof Jimp>> {
    try {
        const image = await Jimp.read(input_image_path)
        return image;
    } catch (err) {
        console.error("Erro ao carregar inputs", err);
        throw err;
    }
}


async function BuildTileset() {
    console.log("Iniciando Builder 3D por Amostragem...");

    // 1. Carregar Skeleton
    const skeleton: Skeleton = JSON.parse(await fs.readFile(SKELETON_PATH, 'utf-8'));
    const legend = skeleton.legend;
    
    // 2. Criar Mapa de IDs (String -> Number)
    const idMap = new Map<string, number>();
    const tileData: any[] = [];
    const rawWeights: number[] = [];
    const rules: Rules[] = [];

    skeleton.tiles.forEach((tile, index) => {
        idMap.set(tile.id, index);
        
        tileData.push({
            id: index,
            modelKey: tile.modelKey,
            matKey: tile.matKey,
            height: tile.height ?? 0
        });
        
        // Inicializa pesos e regras vazias
        rawWeights.push(0); 
        rules.push({
            up: new Set(), down: new Set(),
            left: new Set(), right: new Set(),
            forward: new Set(), back: new Set()
        });
    });

    
    let maxW = -Infinity;
    let minW = 0;

    // 3. Processar Imagens (Extrair Regras)
    for (const plane of PLANES) {
        const hDir = plane.hRule as Direction; // Direção vizinho à direita na imagem
        const vDir = plane.vRule as Direction; // Direção vizinho abaixo na imagem
        const hOpp = OPPOSITES[hDir];
        const vOpp = OPPOSITES[vDir];

        for (const filename of plane.files) {

            let image = await LoadImageInputs(INPUT_FOLDER + filename);
            // let image: Jimp.Jimp;
            // try {
            //     image = await Jimp.read(INPUT_FOLDER + filename);
            // } catch (e) {
            //     console.warn(`Aviso: Imagem ${filename} não encontrada. Pulando.`);
            //     continue;
            // }

            if (maxW < image.bitmap.height * image.bitmap.width)
                maxW = 100; // image.bitmap.height * image.bitmap.width;

            console.log(`Processando ${filename} (H: ${hDir}, V: ${vDir})...`);

            for (let y = 0; y < image.bitmap.height; y++) {
                for (let x = 0; x < image.bitmap.width; x++) {
                    
                    const hex = IntToHex(image.getPixelColor(x, y));
                    const tileKey = legend[hex];

                    if (!tileKey) continue;
                    
                    const currentID = idMap.get(tileKey)!;

                    rawWeights[currentID]++;

                    // --- Verificar Vizinho Horizontal (Direita na imagem) ---
                    if (x + 1 < image.bitmap.width) {
                        const hexRight = IntToHex(image.getPixelColor(x + 1, y));
                        const keyRight = legend[hexRight];
                        if (keyRight) {
                            const neighborID = idMap.get(keyRight)!;
                            
                            // Adiciona regra BIDIRECIONAL
                            // "current" pode ter "neighbor" na direção hDir
                            rules[currentID][hDir].add(neighborID);
                            // "neighbor" pode ter "current" na direção oposta
                            rules[neighborID][hOpp].add(currentID);
                        }
                    }

                    // --- Verificar Vizinho Vertical (Abaixo na imagem) ---
                    if (y + 1 < image.bitmap.height) {
                        const hexDown = IntToHex(image.getPixelColor(x, y + 1));
                        const keyDown = legend[hexDown];
                        if (keyDown) {
                            const neighborID = idMap.get(keyDown)!;
                            
                            // Adiciona regra BIDIRECIONAL
                            // "current" pode ter "neighbor" na direção vDir
                            rules[currentID][vDir].add(neighborID);
                            // "neighbor" pode ter "current" na direção oposta
                            rules[neighborID][vOpp].add(currentID);
                        }
                    }
                }
            }
        }
    }

    // 4. Normalizar Pesos e Formatar Saída
    console.log("Finalizando dados...");
    
    // const nonZeroWeights = rawWeights.filter(w => w > 0);
    // let maxW = 1, minW = 1;
    // if (nonZeroWeights.length > 0) {
    //     maxW = Math.max(...nonZeroWeights);
    //     minW = Math.min(...nonZeroWeights);
    // }

    const finalWeights = rawWeights.map(w => NormalizeWeight(w, maxW, minW));

    // Converter Sets para Arrays para o JSON
    const finalRules = rules.map(r => ({
        up: Array.from(r.up),
        down: Array.from(r.down),
        left: Array.from(r.left),
        right: Array.from(r.right),
        forward: Array.from(r.forward),
        back: Array.from(r.back)
    }));

    const output = {
        name: skeleton.name,
        type: "Simple_Tiled_3D_Sampled",
        idMap: Object.fromEntries(idMap),
        tileData: tileData,
        weights: finalWeights,
        rules: finalRules,
        affinities: {}
    };

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 4));
    console.log(`Sucesso! Tileset 3D gerado em: ${OUTPUT_PATH}`);
}

BuildTileset();