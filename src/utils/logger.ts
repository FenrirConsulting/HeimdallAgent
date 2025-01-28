import * as vscode from 'vscode';

export class Logger {
    private readonly outputChannel: vscode.OutputChannel;
    private readonly logLevels = ['info', 'warn', 'error'] as const;

    constructor() {
        this.outputChannel = vscode.window.createOutputChannel('Heimdall Agent');
    }

    public log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
        const timestamp = new Date().toISOString();
        const formattedMessage = `[${level.toUpperCase()}] ${timestamp}: ${message}`;
        
        this.outputChannel.appendLine(formattedMessage);

        if (level === 'error') {
            vscode.window.showErrorMessage(message);
        } else if (level === 'warn') {
            vscode.window.showWarningMessage(message);
        }
    }

    public show(): void {
        this.outputChannel.show();
    }

    public dispose(): void {
        this.outputChannel.dispose();
    }
}