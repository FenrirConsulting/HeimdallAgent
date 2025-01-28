export interface VSCodeAPI {
    postMessage: (message: any) => void;
}

declare global {
    interface Window {
        acquireVsCodeApi: () => VSCodeAPI;
    }
}

export interface WebviewMessage {
    type: 'sendMessage' | 'response';
    text: string;
}