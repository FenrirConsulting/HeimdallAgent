// src/types/models.d.ts
import { FileInfo, WorkspaceInfo } from './workspace';

export interface ModelConfig {
    apiKey: string;
    endpoint: string;
    options?: {
        temperature?: number;
        maxTokens?: number;
        modelVersion?: string;
        customParameters?: Record<string, any>;
        useLocalExecution?: boolean;  // Added for Aider support
    };
}

export interface ModelResponse {
    content: string;
    model: string;
    timestamp: number;
}

export type SupportedModel = 'claude' | 'deepseek' | 'aider' | 'multi';

export interface WorkspaceContext {
    currentFile?: FileInfo;
    workspaceInfo?: WorkspaceInfo;
    gitStatus: 'clean' | 'dirty';
    selectedText?: string;
}

export interface ApiResponse {
    success: boolean;
    content: string;
    error?: string;
}