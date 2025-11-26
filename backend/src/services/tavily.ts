import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

if (!TAVILY_API_KEY) {
    console.warn('Warning: TAVILY_API_KEY is not set.');
}

export interface TavilyResult {
    title: string;
    url: string;
    content: string;
    score: number;
    raw_content?: string;
}

export interface TavilyResponse {
    results: TavilyResult[];
}

export async function search(query: string): Promise<TavilyResult[]> {
    const apiKey = process.env.TAVILY_API_KEY;

    if (!query || query.trim() === '' || query === '...' || query.includes('...')) {
        console.error('[Tavily] Invalid query:', query);
        throw new Error(`Invalid search query: "${query}"`);
    }

    try {
        const response = await axios.post('https://api.tavily.com/search', {
            api_key: apiKey,
            query: query.trim(),
            search_depth: 'advanced',
            include_raw_content: false,
            max_results: 10
        });

        const results: TavilyResult[] = response.data.results || [];
        console.log(`[Tavily] Found ${results.length} results for query: "${query.substring(0, 50)}..."`);
        return results;
    } catch (error: any) {
        console.error('Tavily Search Error:', error);
        if (error.response?.data) {
            console.error('Tavily API Response:', error.response.data);
        }
        throw error;
    }
}
