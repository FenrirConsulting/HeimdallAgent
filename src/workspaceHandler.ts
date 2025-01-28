import * as vscode from 'vscode';
import { SimpleGit, simpleGit } from 'simple-git';
import { WorkspaceInfo, FileInfo } from './types/workspace';

export class WorkspaceHandler {
    private git: SimpleGit;

    constructor() {
        this.git = simpleGit(vscode.workspace.rootPath || '');
    }

    public async getRepoStatus(): Promise<'clean' | 'dirty'> {
        try {
            const status = await this.git.status();
            return status.isClean() ? 'clean' : 'dirty';
        } catch (error) {
            return 'clean'; // Default to clean if git isn't available
        }
    }

    public async getWorkspaceInfo(): Promise<WorkspaceInfo> {
        const rootPath = vscode.workspace.rootPath;
        if (!rootPath) {
            throw new Error('No workspace folder is open');
        }

        const files = await this.getWorkspaceFiles();
        const gitStatus = await this.getRepoStatus();

        return {
            rootPath,
            files,
            gitStatus,
            languageIds: this.getLanguageIds(files)
        };
    }

    private async getWorkspaceFiles(): Promise<FileInfo[]> {
        const files = await vscode.workspace.findFiles('**/*', '**/node_modules/**');
        
        return Promise.all(files.map(async file => {
            const document = await vscode.workspace.openTextDocument(file);
            return {
                path: file.fsPath,
                language: document.languageId,
                size: document.getText().length
            };
        }));
    }

    private getLanguageIds(files: FileInfo[]): string[] {
        return Array.from(new Set(files.map(file => file.language)));
    }

    public calculateFileComplexity(document: vscode.TextDocument): number {
        const text = document.getText();
        const lines = text.split('\n');
        
        // Calculate a single complexity score
        const complexity = lines.length * (text.length / lines.length);
        return complexity;
    }
}