import { search } from '../services/tavily';
import { chunkText } from '../services/chunk';
import { createCollection, upsertChunks } from '../services/qdrant';
import { SearchResult, Chunk } from '../types';

export async function runSearcher(jobId: string, searchQueries: string[], tavilyApiKey: string, existingCollectionName?: string): Promise<SearchResult> {
    const collectionName = existingCollectionName || `job_${jobId}`;

    if (!existingCollectionName) {
        await createCollection(collectionName);
    }

    const allChunks: Chunk[] = [];

    if (!searchQueries || !Array.isArray(searchQueries) || searchQueries.length === 0) {
        console.error('[Search] Invalid search queries:', searchQueries);
        throw new Error('Search queries must be a non-empty array');
    }

    console.log('[Search] Executing queries:', searchQueries);

    const searchPromises = searchQueries.map(q => search(q, tavilyApiKey));
    const searchResultsArray = await Promise.all(searchPromises);

    const allSearchResults = searchResultsArray.flat();

    const uniqueResults = Array.from(new Map(allSearchResults.map(item => [item.url, item])).values());

    for (const result of uniqueResults) {
        const chunks = await chunkText(result.content, result.url);

        const qdrantChunks = chunks.map(c => ({
            id: c.id,
            vector: c.embedding,
            payload: {
                text: c.text,
                source: c.source,
                title: result.title
            }
        }));

        if (qdrantChunks.length > 0) {
            await upsertChunks(collectionName, qdrantChunks);

            allChunks.push(...chunks.map(c => ({
                id: c.id,
                text: c.text,
                source: c.source || 'unknown',
                title: result.title
            })));
        }
    }

    return {
        collectionName,
        chunks: allChunks
    };
}
