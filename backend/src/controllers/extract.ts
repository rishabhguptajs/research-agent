import { generateJSON, getEmbedding } from '../services/llm';
import { searchSimilar } from '../services/qdrant';
import { ExtractionResult, Fact } from '../types';
import { EXTRACTOR_PROMPT, EXTRACTOR_SYSTEM } from '../prompts/extractor';

export async function runExtractor(subQuestions: string[], collectionName: string, apiKey: string): Promise<ExtractionResult> {
    const allFacts: Fact[] = [];

    for (const question of subQuestions) {
        const embedding = await getEmbedding(question);

        const searchResults = await searchSimilar(collectionName, embedding, 5);

        if (searchResults.length === 0) continue;

        const context = searchResults.map((r: any) =>
            `Source: ${r.payload.source}\nTitle: ${r.payload.title || 'Untitled'}\nText: ${r.payload.text}`
        ).join('\n\n');

        const prompt = EXTRACTOR_PROMPT(question, context);

        const schema = {
            type: "object",
            properties: { 
                facts: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            source: { type: "string" },
                            snippet: { type: "string" },
                            assertion: { type: "string" },
                            title: { type: "string", description: "Title of the source page" }
                        },
                        required: ["source", "snippet", "assertion"]
                    }
                }
            },
            required: ["facts"]
        };

        try {
            const result = await generateJSON<{ facts: Fact[] }>({
                prompt,
                schema,
                system: EXTRACTOR_SYSTEM,
                apiKey
            });

            const factsWithTitles = result.facts.map(fact => {
                const matchingResult = searchResults.find((r: any) => r.payload.source === fact.source);
                return {
                    ...fact,
                    title: (matchingResult?.payload?.title as string | undefined) || fact.title || undefined
                };
            });

            allFacts.push(...factsWithTitles);
        } catch (error) {
            console.error(`Extraction failed for question "${question}":`, error);
        }
    }

    return {
        facts: allFacts
    };
}
