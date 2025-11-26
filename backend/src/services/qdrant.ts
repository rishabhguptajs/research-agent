import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config();

const client = new QdrantClient({
    host: "localhost",
    port: 6333,
});

export async function createCollection(collectionName: string) {
    try {
        await client.createCollection(collectionName, {
            vectors: {
                size: 768,
                distance: 'Cosine',
            },
        });
    } catch (error) {
        console.error(`Error creating collection ${collectionName}:`, error);
        throw error;
    }
}

export async function upsertChunks(collectionName: string, chunks: { id: string; vector: number[]; payload: any }[]) {
    try {
        await client.upsert(collectionName, {
            points: chunks.map(chunk => ({
                id: chunk.id,
                vector: chunk.vector,
                payload: chunk.payload,
            })),
        });
    } catch (error) {
        console.error(`Error upserting to ${collectionName}:`, error);
        throw error;
    }
}

export async function searchSimilar(collectionName: string, vector: number[], topK: number = 3) {
    try {
        const results = await client.search(collectionName, {
            vector: vector,
            limit: topK,
            with_payload: true,
        });
        return results;
    } catch (error) {
        console.error(`Error searching ${collectionName}:`, error);
        throw error;
    }
}

export async function dropCollection(collectionName: string) {
    try {
        await client.deleteCollection(collectionName);
    } catch (error) {
        console.error(`Error dropping collection ${collectionName}:`, error);
    }
}
