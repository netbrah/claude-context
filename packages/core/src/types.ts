export interface SearchQuery {
    term: string;
    includeContent?: boolean;
    limit?: number;
}

export interface SemanticSearchResult {
    content: string;
    relativePath: string;
    startLine: number;
    endLine: number;
    language: string;
    score: number;
}

export interface ProgressInfo {
    phase: string;
    current: number;
    total: number;
    percentage: number;
}

export type ProgressCallback = (progress: ProgressInfo) => void;
