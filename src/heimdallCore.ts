import { Logger } from './utils/logger';
import { WorkspaceHandler } from './workspaceHandler';
import { APIHandler } from './apiHandler';
import { SupportedModel, ModelResponse, WorkspaceContext } from './types/models';
import { FileInfo } from './types/workspace';
import * as vscode from 'vscode';

export class HeimdallError extends Error {
    constructor(
        message: string,
        public readonly code: string,
        public readonly details?: any
    ) {
        super(message);
        this.name = 'HeimdallError';
    }
}

export class HeimdallCore {
    private readonly commandPrefixes = new Map<string, SupportedModel>([
        ['claude', 'claude'],
        ['deepseek', 'deepseek'],
        ['aider', 'aider'],
        ['multi', 'multi']
    ]);

    private readonly modelTriggers = {
        deepseek: [
            /implement|code|function|bug|fix/i,
            /optimize|performance|efficiency/i,
            /debug|error|exception/i
        ],
        claude: [
            /explain|analyze|describe|evaluate/i,
            /design|architecture|pattern/i,
            /document|review|assess/i
        ],
        aider: [
            /commit|push|merge|branch/i,
            /git|repo|repository/i,
            /PR|pull request|review/i
        ]
    };

    constructor(
        private readonly logger: Logger,
        private readonly workspaceHandler: WorkspaceHandler,
        private readonly apiHandler: APIHandler
    ) {}

    public async processCommand(
        input: string,
        editor?: vscode.TextEditor
    ): Promise<ModelResponse | null> {
        try {
            if (!input.trim()) {
                throw new HeimdallError(
                    'Command cannot be empty',
                    'EMPTY_COMMAND'
                );
            }

            const [command, ...rest] = input.trim().split(/\s+/);
            const cleanPrompt = rest.join(' ');

            if (!cleanPrompt && command !== 'multi') {
                throw new HeimdallError(
                    'Prompt cannot be empty',
                    'EMPTY_PROMPT'
                );
            }

            const model = this.commandPrefixes.get(command.toLowerCase()) || 'multi';
            const context = await this.getContext(editor);

            this.logger.log(`Processing command with model: ${model}`, 'info');

            if (model === 'multi') {
                return this.handleMultiMode(cleanPrompt || command, context);
            }

            return this.apiHandler.executeModel(model, cleanPrompt, context);
        } catch (error) {
            if (error instanceof HeimdallError) {
                throw error;
            }
            throw new HeimdallError(
                'Failed to process command',
                'COMMAND_PROCESSING_ERROR',
                error
            );
        }
    }

    private async getContext(editor?: vscode.TextEditor): Promise<WorkspaceContext> {
        if (!editor) {
            return {
                gitStatus: 'clean'
            };
        }

        try {
            const workspaceInfo = await this.workspaceHandler.getWorkspaceInfo();
            const currentFile: FileInfo = {
                path: editor.document.fileName,
                language: editor.document.languageId,
                size: editor.document.getText().length
            };

            return {
                currentFile,
                workspaceInfo,
                gitStatus: await this.workspaceHandler.getRepoStatus(),
                selectedText: editor.selection.isEmpty ? 
                    undefined : 
                    editor.document.getText(editor.selection)
            };
        } catch (error) {
            this.logger.log(`Error getting context: ${error}`, 'error');
            return {
                gitStatus: 'clean'
            };
        }
    }

    private async handleMultiMode(prompt: string, context: WorkspaceContext): Promise<ModelResponse> {
        try {
            const model = await this.determineModelFromContent(prompt, context);
            this.logger.log(`Selected model ${model} for multi-mode prompt`, 'info');
            return this.apiHandler.executeModel(model, prompt, context);
        } catch (error) {
            throw new HeimdallError(
                'Failed to handle multi-mode',
                'MULTI_MODE_ERROR',
                error
            );
        }
    }

    private async determineModelFromContent(
        prompt: string,
        context: WorkspaceContext
    ): Promise<SupportedModel> {
        const scores = new Map<SupportedModel, number>([
            ['claude', 0],
            ['deepseek', 0],
            ['aider', 0]
        ]);

        // Score based on content triggers
        for (const [model, patterns] of Object.entries(this.modelTriggers)) {
            for (const pattern of patterns) {
                if (pattern.test(prompt.toLowerCase())) {
                    scores.set(model as SupportedModel, 
                        (scores.get(model as SupportedModel) || 0) + 1);
                }
            }
        }

        // Add context-based scores
        if (context.gitStatus === 'dirty') {
            scores.set('aider', (scores.get('aider') || 0) + 2);
        }

        if (context.currentFile?.language) {
            // Preference for DeepSeek on code files
            const codeLanguages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'];
            if (codeLanguages.includes(context.currentFile.language)) {
                scores.set('deepseek', (scores.get('deepseek') || 0) + 1);
            }
        }

        // Select highest scoring model
        let selectedModel: SupportedModel = 'claude';
        let maxScore = -1;

        for (const [model, score] of scores.entries()) {
            if (score > maxScore) {
                maxScore = score;
                selectedModel = model;
            }
        }

        return selectedModel;
    }
}