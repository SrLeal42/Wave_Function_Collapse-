import { Cell } from "./Cell";

/**
 * Uma implementação de Min-Heap (Fila de Prioridade) otimizada para o WFC.
 * Ela rastreia Células (Cells) e prioriza aquelas com a menor 'entropy'.
 * Ela também inclui um 'cellIndexMap' para permitir atualizações de prioridade
 * em tempo O(log N), o que é crucial para a etapa de 'Propagação'.
 */
export class PriorityQueue {
    // O array que armazena a estrutura do heap
    private heap: Cell[] = [];
    
    // O "ingrediente secreto": Mapeia uma Célula -> seu índice no array 'heap'
    private cellIndexMap: Map<Cell, number> = new Map();

    // --- Métodos Públicos ---

    public size(): number {
        return this.heap.length;
    }

    public isEmpty(): boolean {
        return this.heap.length === 0;
    }

    /**
     * Verifica se uma célula está atualmente na fila.
     */
    public contains(cell: Cell): boolean {
        return this.cellIndexMap.has(cell);
    }

    /**
     * Adiciona uma nova célula à fila.
     */
    public insert(cell: Cell): void {
        if (this.contains(cell)) {
            // Se já existe, trate como uma atualização
            this.update(cell);
            return;
        }
        
        // Adiciona ao fim e mapeia seu novo índice
        const index = this.heap.length;
        this.heap.push(cell);
        this.cellIndexMap.set(cell, index);
        
        // "Sobe" (sift up) o elemento para sua posição correta
        this.siftUp(index);
    }

    /**
     * Remove e retorna a célula com a menor entropia (maior prioridade).
     */
    public extractMin(): Cell | null {
        if (this.isEmpty()) {
            return null;
        }

        // O menor item está sempre na raiz (índice 0)
        const minCell = this.heap[0];
        
        // Pega o último item para colocar na raiz
        const lastCell = this.heap.pop()!;

        // Remove o item do mapa
        this.cellIndexMap.delete(minCell);

        if (!this.isEmpty()) {
            // Move o 'lastCell' para a raiz
            this.heap[0] = lastCell;
            this.cellIndexMap.set(lastCell, 0);
            
            // "Desce" (sift down) o elemento para sua posição correta
            this.siftDown(0);
        }

        return minCell;
    }

    /**
     * Notifica a fila que a entropia de uma célula diminuiu.
     * A fila irá reordenar essa célula (sift up).
     */
    public update(cell: Cell): void {
        const index = this.cellIndexMap.get(cell);

        if (index === undefined) {
            // Não está na fila (provavelmente já foi colapsada), então ignore.
            return;
        }

        // A entropia SÓ PODE DIMINUIR.
        // Portanto, só precisamos "subir" (siftUp) o elemento.
        this.siftUp(index);
    }

    // --- Métodos Privados (Lógica do Heap) ---

    /**
     * Compara duas células para ver qual tem maior prioridade (menor entropia).
     * Inclui o desempate aleatório que você tinha antes.
     */
    private isHigherPriority(cellA: Cell, cellB: Cell): boolean {
        const entropyA = cellA.entropy;
        const entropyB = cellB.entropy;

        if (entropyA < entropyB) {
            return true;
        }
        if (entropyA > entropyB) {
            return false;
        }
        
        // Se a entropia for igual, use aleatoriedade para desempate
        return Math.random() < 0.5;
    }

    /**
     * Move um elemento para CIMA na árvore até encontrar sua posição correta.
     */
    private siftUp(index: number): void {
        let currentIndex = index;
        const cell = this.heap[currentIndex];

        while (currentIndex > 0) {
            const parentIndex = this.getParentIndex(currentIndex);
            const parent = this.heap[parentIndex];

            if (this.isHigherPriority(cell, parent)) {
                // Troca
                this.swap(currentIndex, parentIndex);
                currentIndex = parentIndex;
            } else {
                // Posição correta encontrada
                break;
            }
        }
    }

    /**
     * Move um elemento para BAIXO na árvore até encontrar sua posição correta.
     */
    private siftDown(index: number): void {
        let currentIndex = index;
        const cell = this.heap[currentIndex];
        const lastIndex = this.heap.length - 1;

        // eslint-disable-next-line no-constant-condition
        while (true) {
            const leftChildIndex = this.getLeftChildIndex(currentIndex);
            const rightChildIndex = this.getRightChildIndex(currentIndex);
            
            let indexToSwap = -1;

            // Encontra o filho com maior prioridade (menor entropia)
            if (leftChildIndex <= lastIndex) {
                indexToSwap = leftChildIndex;
            }
            
            if (rightChildIndex <= lastIndex && this.isHigherPriority(this.heap[rightChildIndex], this.heap[leftChildIndex])) {
                indexToSwap = rightChildIndex;
            }

            // Se não há filhos ou se o 'cell' atual já tem maior prioridade, pare.
            if (indexToSwap === -1 || this.isHigherPriority(cell, this.heap[indexToSwap])) {
                break;
            }

            // Troca
            this.swap(currentIndex, indexToSwap);
            currentIndex = indexToSwap;
        }
    }

    /**
     * Troca dois elementos no heap e ATUALIZA o 'cellIndexMap'.
     * Esta é a parte mais importante.
     */
    private swap(i: number, j: number): void {
        const cellI = this.heap[i];
        const cellJ = this.heap[j];

        // Troca no array
        this.heap[i] = cellJ;
        this.heap[j] = cellI;

        // ATUALIZA o mapa de índices
        this.cellIndexMap.set(cellI, j);
        this.cellIndexMap.set(cellJ, i);
    }

    // --- Funções matemáticas do Heap ---
    private getParentIndex(i: number): number {
        return Math.floor((i - 1) / 2);
    }
    private getLeftChildIndex(i: number): number {
        return 2 * i + 1;
    }
    private getRightChildIndex(i: number): number {
        return 2 * i + 2;
    }
}