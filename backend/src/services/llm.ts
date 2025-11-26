import OpenAI from 'openai';
import dotenv from 'dotenv';
import { LLMRequest } from '../types';
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const apiKey = process.env.LLM_API_KEY;
const baseURL = process.env.LLM_BASE_URL;
const model = process.env.LLM_MODEL;

const fallbackApiKey = process.env.LLM_FALLBACK_API_KEY;
const fallbackBaseURL = process.env.LLM_FALLBACK_BASE_URL || 'https://openrouter.ai/api/v1';
const fallbackModel = process.env.LLM_FALLBACK_MODEL || model;

if (!apiKey) {
    console.warn('Warning: LLM_API_KEY or OPENAI_API_KEY is not set.');
}

const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseURL,
});

const fallbackClient = fallbackApiKey ? new OpenAI({
    apiKey: fallbackApiKey,
    baseURL: fallbackBaseURL,
}) : null;

const googleApiKey = process.env.GOOGLE_API_KEY;
const googleClient = new GoogleGenAI({ apiKey: googleApiKey });

export async function generateJSON<T>(request: LLMRequest): Promise<T> {
    const { prompt, schema, system } = request;

    const systemMessage = system || 'You are a helpful AI assistant. You must output valid JSON matching the schema provided.';

    const schemaDescription = schema ? `\n\nOutput strictly JSON matching this schema:\n${JSON.stringify(schema, null, 2)}` : '';

    try {
        const completion = await client.chat.completions.create({
            model: model!,
            messages: [
                { role: 'system', content: systemMessage + schemaDescription},
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0].message.content;
        console.log('LLM Raw Response:', content); // Debug logging
        if (!content) {
            throw new Error('LLM returned empty content');
        }

        try {
            return JSON.parse(content) as T;
        } catch (parseError) {
            console.error('Failed to parse LLM response:', content);
            throw new Error('LLM response was not valid JSON');
        }
    } catch (error: any) {
        // Check if it's a 429 rate limit error and fallback is available
        if (error?.status === 429 && fallbackClient) {
            console.warn('⚠️ Primary API hit rate limit (429). Falling back to OpenRouter...');

            try {
                const completion = await fallbackClient.chat.completions.create({
                    model: fallbackModel!,
                    messages: [
                        { role: 'system', content: systemMessage + schemaDescription },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: 'json_object' },
                });

                const content = completion.choices[0].message.content;
                console.log('✓ Fallback LLM Response received');
                if (!content) {
                    throw new Error('Fallback LLM returned empty content');
                }

                try {
                    return JSON.parse(content) as T;
                } catch (parseError) {
                    console.error('Failed to parse fallback LLM response:', content);
                    throw new Error('Fallback LLM response was not valid JSON');
                }
            } catch (fallbackError) {
                console.error('Fallback LLM API Error:', fallbackError);
                throw fallbackError;
            }
        }

        console.error('LLM API Error:', error);
        throw error;
    }
}

export async function getEmbedding(text: string): Promise<number[]> {
    try {
        const response = await googleClient.models.embedContent({
            model: 'text-embedding-004',
            contents: text,
        });

        if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
            return response.embeddings[0].values;
        }
        throw new Error('No embedding returned');
    } catch (error) {
        console.error('Embedding Error:', error);
        throw error;
    }
}
