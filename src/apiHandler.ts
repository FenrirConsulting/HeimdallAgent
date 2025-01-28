import { Logger } from './utils/logger';
import { ModelConfig, SupportedModel, ModelResponse, WorkspaceContext } from './types/models';
import axios from 'axios';
import * as vscode from 'vscode';

export class APIHandler {
    constructor(
        private readonly logger: Logger,
        private readonly configs: Record<string, ModelConfig>
    ) {}

    async executeModel(
        model: SupportedModel,
        prompt: string,
        context: WorkspaceContext
    ): Promise<ModelResponse> {
       
        const config = this.configs[model];
        if (!config) {
            this.logger.log(`No configuration found for model: ${model}`, 'error');
            throw new Error(`No configuration found for model: ${model}`);
        }

        try {
            this.logger.log(`Executing ${model}`, 'info');
            const response = await this.callAPI(model, config, prompt, context);
            return {
                content: response,
                model,
                timestamp: Date.now()
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.log(`API Error: ${errorMessage}`, 'error');
            throw error;
        }
    }

    private async callAPI(
        model: SupportedModel,
        config: ModelConfig,
        prompt: string,
        context: WorkspaceContext
    ): Promise<string> {
        if (!config.apiKey && model !== 'aider') {
            throw new Error(`API key not configured for ${model}`);
        }
       
        switch(model) {
            case 'claude':
                return this.callClaudeAPI(config, prompt, context);
            case 'deepseek':
                return this.callDeepseekAPI(config, prompt, context);
            case 'aider':
                return this.callAiderAPI(config, prompt, context);
            default:
                throw new Error(`Unsupported model: ${model}`);
        }
    }

    private async callClaudeAPI(config: ModelConfig, prompt: string, context: WorkspaceContext): Promise<string> {
        this.logger.log('Starting Claude API call', 'info');
        this.logger.log(`Endpoint: ${config.endpoint}`, 'info');
        this.logger.log(`Model Version: ${config.options?.modelVersion}`, 'info');
        this.logger.log(`Context: ${JSON.stringify(context)}`, 'info');
        
        try {
            const requestBody = {
                model: config.options?.modelVersion || 'claude-3-sonnet-20240229',
                messages: [{
                    role: 'user',
                    content: this.formatClaudePrompt(prompt, context)
                }],
                temperature: config.options?.temperature || 0.7,
                max_tokens: config.options?.maxTokens || 4096
            };

            this.logger.log(`Request Body: ${JSON.stringify(requestBody)}`, 'info');

            const response = await axios.post(
                config.endpoint,
                requestBody,
                {
                    headers: {
                        'x-api-key': config.apiKey,
                        'Content-Type': 'application/json',
                        'Anthropic-Version': '2023-06-01'
                    }
                }
            );

            this.logger.log('Claude API call successful', 'info');
            this.logger.log(`Response status: ${response.status}`, 'info');
            this.logger.log(`Response data: ${JSON.stringify(response.data)}`, 'info');

            return response.data.content[0].text;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.log(`Claude API Error: ${error.message}`, 'error');
                if (error.response) {
                    this.logger.log(`Status: ${error.response.status}`, 'error');
                    this.logger.log(`Error Data: ${JSON.stringify(error.response.data)}`, 'error');
                }
                if (error.config) {
                    this.logger.log(`Request Config: ${JSON.stringify({
                        url: error.config.url,
                        method: error.config.method,
                        headers: error.config.headers,
                    })}`, 'error');
                }
            }
            throw error;
        }
    }

    private async callDeepseekAPI(config: ModelConfig, prompt: string, context: WorkspaceContext): Promise<string> {
        try {
            const response = await axios.post(
                config.endpoint,
                {
                    model: config.options?.modelVersion || 'deepseek-coder-33b-instruct',
                    messages: [{
                        role: 'user',
                        content: this.formatDeepseekPrompt(prompt, context)
                    }],
                    temperature: config.options?.temperature || 0.7,
                    max_tokens: config.options?.maxTokens || 4096
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.choices[0].message.content;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.log(`Deepseek API Error: ${error.message}`, 'error');
                if (error.response) {
                    this.logger.log(`Status: ${error.response.status}`, 'error');
                    this.logger.log(`Data: ${JSON.stringify(error.response.data)}`, 'error');
                }
            }
            throw error;
        }
    }

    private async callAiderAPI(config: ModelConfig, prompt: string, context: WorkspaceContext): Promise<string> {
        if (config.endpoint === 'local') {
            this.logger.log('Local Aider execution requested', 'info');
            return 'Aider local execution not yet implemented';
        }

        try {
            const response = await axios.post(
                config.endpoint,
                {
                    prompt,
                    context: this.formatAiderContext(context)
                },
                {
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.response;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.log(`Aider API Error: ${error.message}`, 'error');
                if (error.response) {
                    this.logger.log(`Status: ${error.response.status}`, 'error');
                }
            }
            throw error;
        }
    }

    private formatClaudePrompt(prompt: string, context: WorkspaceContext): string {
        const contextStr = context.currentFile ?
            `Current file: ${context.currentFile.path} (${context.currentFile.language})\n` : '';
       
        return `${contextStr}${prompt}`;
    }

    private formatDeepseekPrompt(prompt: string, context: WorkspaceContext): string {
        return `${context.currentFile?.language ? `Language: ${context.currentFile.language}\n` : ''}${prompt}`;
    }

    private formatAiderContext(context: WorkspaceContext): any {
        return {
            gitStatus: context.gitStatus,
            filepath: context.currentFile?.path,
            language: context.currentFile?.language,
            selectedText: context.selectedText
        };
    }
}