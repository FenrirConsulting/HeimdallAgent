import * as vscode from 'vscode';
import { HeimdallCore } from './heimdallCore';
import { APIHandler } from './apiHandler';
import { WorkspaceHandler } from './workspaceHandler';
import { ConfigManager } from './utils/configManager';
import { Logger } from './utils/logger';
import { join } from 'path';

class ChatViewProvider implements vscode.WebviewViewProvider {
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly heimdall: HeimdallCore
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._extensionUri, 'media'),
                vscode.Uri.joinPath(this._extensionUri, 'dist')
            ]
        };

        // Get the local path to image
        const iconPath = webviewView.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'bifrost.png')
        );

        // Set up the message handler
        webviewView.webview.onDidReceiveMessage(async message => {
            console.log('Extension received message:', message);
            
            if (message.type === 'sendMessage') {
                try {
                    console.log('Processing command:', message.text);
                    const response = await this.heimdall.processCommand(message.text);
                    console.log('Got response:', response);
                    
                    if (response) {
                        webviewView.webview.postMessage({
                            type: 'response',
                            text: response.content
                        });
                    }
                } catch (error) {
                    console.error('Error processing command:', error);
                    webviewView.webview.postMessage({
                        type: 'response',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    });
                }
            }
        });

        // Pass the iconPath to the webview
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview, iconPath);
    }

    private _getHtmlForWebview(webview: vscode.Webview, iconPath: vscode.Uri): string {
        const scriptPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'dist', 'webview.js'));
        const nonce = getNonce();

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
            <title>Heimdall Chat</title>
        </head>
        <body>
            <div id="root" data-icon-path="${iconPath}"></div>
            <script nonce="${nonce}" src="${scriptPath}"></script>
        </body>
        </html>`;
    }
}

function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize logger first to capture all startup logs
    const logger = new Logger();
    logger.log('Activating Heimdall extension', 'info');
    
    try {
        // Initialize config and verify it's loaded
        const config = new ConfigManager();
        const modelConfigs = config.getModelConfigs();
        logger.log(`Model configs loaded: ${JSON.stringify(modelConfigs)}`, 'info');

        // Verify each required component
        if (!modelConfigs.claude?.apiKey) {
            logger.log('Warning: Claude API key not configured', 'warn');
        }
        if (!modelConfigs.deepseek?.apiKey) {
            logger.log('Warning: Deepseek API key not configured', 'warn');
        }

        // Initialize core components
        const workspaceHandler = new WorkspaceHandler();
        const apiHandler = new APIHandler(logger, modelConfigs);
        const heimdall = new HeimdallCore(logger, workspaceHandler, apiHandler);
        
        logger.log('Core components initialized', 'info');

        // Register webview provider
        const chatViewProvider = new ChatViewProvider(context.extensionUri, heimdall);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('heimdall-chat', chatViewProvider)
        );

        logger.log('Extension activation complete', 'info');

        // Show the output channel during debug
        if (process.env.VSCODE_DEBUG_MODE) {
            logger.show();
        }
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error during activation';
        logger.log(`Activation failed: ${errorMessage}`, 'error');
        throw error;
    }
}

export function deactivate() {}