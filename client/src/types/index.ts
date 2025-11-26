export interface JobStatus {
    jobId: string;
    userId: string;
    query: string;
    createdAt: number;
    status: 'planning' | 'searching' | 'extracting' | 'compiling' | 'done' | 'error';
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
    embedding?: number[];
}

export interface ExtractionResult {
    facts: Fact[];
}

export interface Fact {
    source: string;
    snippet: string;
    assertion: string;
}

export interface CompileResult {
    summary: string;
    detailed: string;
    citations: Citation[];
}

export interface Citation {
    source: string;
    snippet: string;
}
