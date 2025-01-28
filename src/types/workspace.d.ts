export interface WorkspaceInfo {
    rootPath: string;
    files: FileInfo[];
    gitStatus: 'clean' | 'dirty';
    languageIds: string[];
}

export interface FileInfo {
    path: string;
    language: string;
    size: number;
}

export interface FileComplexity {
    lines: number;
    characters: number;
    avgLineLength: number;
}

export interface WorkspaceContext {
    currentFile?: FileInfo;
    workspaceInfo: WorkspaceInfo;
    gitStatus: 'clean' | 'dirty';
    selectedText?: string;
}