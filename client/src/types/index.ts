export interface Job {
    jobId: string;
    userId: string;
    title: string;
    createdAt: number;
    status: 'active' | 'done' | 'error';
    attachedDocuments?: string[];
}

export interface Message {
    messageId: string;
    jobId: string;
    role: 'user' | 'assistant';
    content: string;
    type?: 'research' | 'chat';
    status?: 'planning' | 'searching' | 'extracting' | 'compiling' | 'done' | 'error';
    attachedChunks?: string[];
    data: JobData;
    createdAt: number;
}

export interface JobData {
    plan?: PlanResult;
    search?: SearchResult;
    extraction?: ExtractionResult;
    final?: CompileResult;
    attachedChunks?: string[];
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
    charts?: ChartData[];
}

export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'area';
    title: string;
    data: any[];
    xKey: string;
    yKeys: string[];
    colors?: string[];
    description?: string;
}

export interface Citation {
    source: string;
    snippet: string;
    title?: string;
}
