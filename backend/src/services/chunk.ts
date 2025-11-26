import { getEmbedding } from './llm';
import { v4 as uuidv4 } from 'uuid';

export interface ChunkResult {
    id: string;
    text: string;
    embedding: number[];
    source: string;
}

export async function chunkText(text: string, source: string = 'unknown'): Promise<ChunkResult[]> {
    const CHUNK_SIZE = 1000;
    const chunks: string[] = [];

    let currentChunk = '';
    const sentences = text.replace(/([.?!])\s*(?=[A-Z])/g, "$1|").split("|");

    for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > CHUNK_SIZE) {
            chunks.push(currentChunk);
            currentChunk = sentence;
        } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
    }
    if (currentChunk) {
        chunks.push(currentChunk);
    }

    const results: ChunkResult[] = [];

    const embeddingPromises = chunks.map(async (chunkText) => {
        try {
            const embedding = await getEmbedding(chunkText);
            return {
                id: uuidv4(),
                text: chunkText,
                embedding,
                source
            };
        } catch (e) {
            console.error('Failed to embed chunk:', e);
            return null;
        }
    });

    const embeddedChunks = await Promise.all(embeddingPromises);

    return embeddedChunks.filter((c): c is ChunkResult => c !== null);
}