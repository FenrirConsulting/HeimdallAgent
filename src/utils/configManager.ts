import * as vscode from 'vscode';
import { ModelConfig, SupportedModel } from '../types/models';

export class ConfigManager {
    private readonly configSection = 'heimdall';
    private readonly defaultConfigs: Record<string, Partial<ModelConfig>> = {
        claude: {
            endpoint: 'https://api.anthropic.com/v1/messages',
            options: {
                temperature: 0.7,
                maxTokens: 4096,
                modelVersion: 'claude-3-sonnet-20240229'
            }
        },
        deepseek: {
            endpoint: 'https://api.deepseek.com/v1/chat/completions',
            options: {
                temperature: 0.7,
                maxTokens: 4096,
                modelVersion: 'deepseek-chat'
            }
        },
        aider: {
            endpoint: 'local',
            options: {
                useLocalExecution: true
            }
        }
    };

    getModelConfigs(): Record<string, ModelConfig> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const configs: Record<string, ModelConfig> = {};

        for (const [model, defaultConfig] of Object.entries(this.defaultConfigs)) {
            const userConfig = config.get<Partial<ModelConfig>>(model) || {};
            configs[model] = this.mergeConfigs(defaultConfig, userConfig);
        }

        return configs;
    }

    async updateModelConfig(model: SupportedModel, newConfig: Partial<ModelConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration(this.configSection);
        const currentConfig = config.get<ModelConfig>(model) || {};
        
        await config.update(model, {
            ...currentConfig,
            ...newConfig
        }, true);

        this.validateConfig(model, newConfig);
    }

    private mergeConfigs(defaultConfig: Partial<ModelConfig>, userConfig: Partial<ModelConfig>): ModelConfig {
        return {
            apiKey: userConfig.apiKey || '',
            endpoint: userConfig.endpoint || defaultConfig.endpoint || '',
            options: {
                ...defaultConfig.options,
                ...userConfig.options
            }
        };
    }

    private validateConfig(model: string, config: Partial<ModelConfig>): void {
        if (!config.apiKey && model !== 'aider') {
            throw new Error(`API key is required for ${model}`);
        }

        if (!config.endpoint) {
            throw new Error(`Endpoint is required for ${model}`);
        }
    }
}