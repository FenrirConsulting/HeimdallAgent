import React from 'react';
import ReactDOM from 'react-dom';
import ChatInterface from '../components/chatInterface';

declare global {
    interface Window {
        acquireVsCodeApi: () => {
            postMessage: (message: any) => void;
        };
    }
}

ReactDOM.render(
    <React.StrictMode>
        <ChatInterface />
    </React.StrictMode>,
    document.getElementById('root')
);