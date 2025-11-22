import * as fs from "fs/promises";

import { Direction } from "../../src/scripts/Utilities"

// --- CONFIGURAÇÃO ---
const INPUT_PATH = './tools/3DTilesetBuilder/skeletons/Skeleton_3D_Tileset_colors.json';
const OUTPUT_PATH = './tools/3DTilesetBuilder/output/Generated_3D_Streets.json';
// --------------------

// Tipos auxiliares
type SocketID = string;
type TileSkeleton = {
    id: number;
    modelKey: string;
    weight: number;
    sockets: { py: SocketID, ny: SocketID, pz: SocketID, nz: SocketID, px: SocketID, nx: SocketID };
};

async function Build3DTileset() {
    console.log("Iniciando Builder 3D (Sockets)...");

    const input = JSON.parse(await fs.readFile(INPUT_PATH, 'utf-8'));
    
    const expandedTiles: TileSkeleton[] = [];

    for (const tile of input.tiles) {
        expandedTiles.push({ ...tile, id: tile.id });
    }
    
    // 2. Criar Mapas Numéricos (Otimização)
    console.log(`Processando ${expandedTiles.length} tiles totais...`);
    
    const tileData: any[] = [];
    const weights: number[] = []
    // const rules: any = {};
    const rules: { up: number[], down: number[], left: number[], right: number[], forward: number[], back: number[] }[] = [];
    
    const idMap: { [key: string]: number } = {};

    for (let i = 0; i < expandedTiles.length; i++) {
        rules.push({ up: [], down: [], left: [], right: [], forward: [], back: [] });
    }

    for (let i = 0; i < expandedTiles.length; i++) {
        const tileA = expandedTiles[i];
        
        idMap[tileA.id] = i;

        tileData.push({
            id: i,
            modelKey: tileA.modelKey
        });

        weights[i] = tileA.weight;

        for (let j = 0; j < expandedTiles.length; j++) {
            const tileB = expandedTiles[j];

            // Regra UP (Y+): Cima do A == Baixo do B
            if (tileA.sockets.py === tileB.sockets.ny) rules[i].up.push(j);
            
            // Regra DOWN (Y-): Baixo do A == Cima do B
            if (tileA.sockets.ny === tileB.sockets.py) rules[i].down.push(j);

            // Regra LEFT (X-): Esquerda do A == Direita do B
            if (tileA.sockets.nx === tileB.sockets.px) rules[i].left.push(j);

            // Regra RIGHT (X+): Direita do A == Esquerda do B
            if (tileA.sockets.px === tileB.sockets.nx) rules[i].right.push(j);

            // Regra FORWARD (Z+): Frente do A == Trás do B
            if (tileA.sockets.pz === tileB.sockets.nz) rules[i].forward.push(j);

            // Regra BACK (Z-): Trás do A == Frente do B
            if (tileA.sockets.nz === tileB.sockets.pz) rules[i].back.push(j);
        }
    }

    const output = {
        name: input.name,
        type: "Simple_Tiled_3D",
        idMap: idMap,
        tileData: tileData,
        weights: weights,
        rules: rules,
        affinities: {} 
    };

    await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 4));
    console.log(`Sucesso! Tileset 3D gerado em: ${OUTPUT_PATH}`);
}

Build3DTileset();