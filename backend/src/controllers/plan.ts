import { generateJSON } from '../services/llm';
import { PlanResult } from '../types';
import { PLANNER_PROMPT, PLANNER_SYSTEM } from '../prompts/planner';

export async function runPlanner(query: string, apiKey: string): Promise<PlanResult> {
    const prompt = PLANNER_PROMPT(query);

    const schema = {
        type: "object",
        properties: {
            sub_questions: {
                type: "array",
                items: { type: "string" },
                minItems: 5
            },
            search_queries: {
                type: "array",
                items: { type: "string" },
                minItems: 5
            },
            extraction_fields: {
                type: "array",
                items: { type: "string" },
                minItems: 5
            }
        },
        required: ["sub_questions", "search_queries", "extraction_fields"]
    };

    try {
        const plan = await generateJSON<PlanResult>({
            prompt,
            schema,
            system: PLANNER_SYSTEM,
            apiKey
        });

        if (!plan.search_queries || plan.search_queries.length === 0) {
            throw new Error('Plan missing search queries');
        }

        console.log('[Plan] Generated:', {
            numSubQuestions: plan.sub_questions.length,
            numSearchQueries: plan.search_queries.length,
            numExtractionFields: plan.extraction_fields.length
        });

        return plan;
    } catch (error) {
        console.error('Planning failed:', error);
        throw error;
    }
}
