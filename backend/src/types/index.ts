export interface ResearchQuery {
    query: string;
}

export type Job = JobStatus;

export interface JobStatus {
    jobId: string;
    userId: string;
    query: string;
    createdAt: number;
    status: 'planning' | 'searching' | 'extracting' | 'compiling' | 'done' | 'error';
    parentJobId?: string;
    type?: 'research' | 'chat';
    data: JobData;
}

export interface JobData {
    plan?: PlanResult;
    search?: SearchResult;
    extraction?: ExtractionResult;
    final?: CompileResult;
    error?: string;
}

export interface PlanResult {
    sub_questions: string[];
    search_queries: string[];
    extraction_fields: string[];
}

export interface SearchResult {
    collectionName: string;
    chunks: Chunk[];
}

export interface Chunk {
    id: string;
    text: string;
    source: string;
    title?: string;
    embedding?: number[];
}

export interface ExtractionResult {
    facts: Fact[];
}

export interface Fact {
    source: string;
    snippet: string;
    assertion: string;
    title?: string;
}

export interface CompileResult {
    summary: string;
    detailed: string;
    citations: Citation[];
}

export interface Citation {
    source: string;
    snippet: string;
    title?: string;
}

export interface LLMRequest {
    prompt: string;
    schema?: any;
    system?: string;
    apiKey?: string;
}
