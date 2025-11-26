import { generateJSON } from '../services/llm';
import { ExtractionResult, CompileResult } from '../types';
import { COMPILER_PROMPT, COMPILER_SYSTEM } from '../prompts/compiler';

export async function runCompiler(extraction: ExtractionResult, apiKey: string): Promise<CompileResult> {
    const facts = extraction.facts;

    if (facts.length === 0) {
        return {
            summary: "No sufficient information found.",
            detailed: "Unable to compile a detailed report due to lack of extracted facts.",
            citations: []
        };
    }

    const factsWithContext = facts.map((f, i) => ({
        index: i + 1,
        assertion: f.assertion,
        snippet: f.snippet,
        source: f.source,
        title: f.title
    }));

    const prompt = COMPILER_PROMPT(factsWithContext);

    const schema = {
        type: "object",
        properties: {
            summary: {
                type: "string",
                description: "2-3 sentence executive summary without citations"
            },
            detailed: {
                type: "string",
                description: "Comprehensive markdown report with [1], [2], [3] etc. EMBEDDED INLINE throughout the text"
            },
            citations: {
                type: "array",
                description: "Array of source citations matching the inline [N] numbers",
                items: {
                    type: "object",
                    properties: {
                        source: { type: "string", description: "Full URL of the source" },
                        snippet: { type: "string", description: "Relevant quote from the source" },
                        title: { type: "string", description: "Title of the source page" }
                    },
                    required: ["source", "snippet"]
                }
            }
        },
        required: ["summary", "detailed", "citations"]
    };

    try {
        const result = await generateJSON<CompileResult>({
            prompt,
            schema,
            system: COMPILER_SYSTEM,
            apiKey
        });

        console.log('[Compile] Result received:', {
            hasSummary: !!result.summary,
            hasDetailed: !!result.detailed,
            citationsCount: result.citations?.length || 0,
            detailedLength: result.detailed?.length || 0,
            containsInlineCitations: /\[\d+\]/.test(result.detailed || ''),
            sampleText: result.detailed?.substring(0, 200)
        });

        if (!result.summary || !result.detailed) {
            console.error('[Compile] Invalid result - missing required fields');
            throw new Error('Compile result missing required fields');
        }

        if (!/\[\d+\]/.test(result.detailed)) {
            console.warn('[Compile] WARNING: No inline citations found in detailed report!');
        }

        return result;
    } catch (error) {
        console.error("Compilation failed:", error);
        throw error;
    }
}
