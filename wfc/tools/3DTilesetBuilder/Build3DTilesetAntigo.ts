import * as fs from "fs/promises";

import { Direction } from "../../src/scripts/Utilities"

// --- CONFIGURAÇÃO ---
const INPUT_PATH = './tools/3DTilesetBuilder/skeletons/Skeleton_3D_Tileset_Colors.json';
const OUTPUT_PATH = './tools/3DTilesetBuilder/output/Generated_3D_Tileset.json';
// --------------------

// Tipos auxiliares
type SocketID = string;
type TileSkeleton = {
    id: string; // Note: mudei para string para bater com o JSON geralmente
    modelKey: string;
    matKey: string;
    weight: number;
    sockets: { py: SocketID, ny: SocketID, pz: SocketID, nz: SocketID, px: SocketID, nx: SocketID };
};
type SocketCompatibility = { [key: string]: string[] };

async function Build3DTileset() {
    console.log("Iniciando Builder 3D (Sockets)...");

    const input = JSON.parse(await fs.readFile(INPUT_PATH, 'utf-8'));
    
    const compatibilityMap: SocketCompatibility = input.socketCompatibility || {};

    
    /**
     * Função Helper para verificar conexão
     * Retorna true se socketA aceita socketB
     */
    const canConnect = (socketA: string, socketB: string): boolean => {
        // 1. Se forem iguais, sempre conecta (comportamento padrão)
        if (socketA === socketB) return true;

        // 2. Se houver mapa de compatibilidade, verifica a lista
        if (compatibilityMap[socketA]) {
            return compatibilityMap[socketA].includes(socketB);
        }

        return false;
    };


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
            modelKey: tileA.modelKey,
            matKey: tileA.matKey,
        });

        weights[i] = tileA.weight;
        for (let j = 0; j < expandedTiles.length; j++) {
            const tileB = expandedTiles[j];
            
            // Regra UP (Y+): O socket 'py' (cima) do A toca no 'ny' (baixo) do B
            if (canConnect(tileA.sockets.py, tileB.sockets.ny)) rules[i].up.push(j);
            
            // Regra DOWN (Y-): O socket 'ny' (baixo) do A toca no 'py' (cima) do B
            if (canConnect(tileA.sockets.ny, tileB.sockets.py)) rules[i].down.push(j);

            // Regra LEFT (X-): O socket 'nx' (esquerda) do A toca no 'px' (direita) do B
            if (canConnect(tileA.sockets.nx, tileB.sockets.px)) rules[i].left.push(j);

            // Regra RIGHT (X+): O socket 'px' (direita) do A toca no 'nx' (esquerda) do B
            if (canConnect(tileA.sockets.px, tileB.sockets.nx)) rules[i].right.push(j);

            // Regra FORWARD (Z+): O socket 'pz' (frente) do A toca no 'nz' (trás) do B
            if (canConnect(tileA.sockets.pz, tileB.sockets.nz)) rules[i].forward.push(j);

            // Regra BACK (Z-): O socket 'nz' (trás) do A toca no 'pz' (frente) do B
            if (canConnect(tileA.sockets.nz, tileB.sockets.pz)) rules[i].back.push(j);
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