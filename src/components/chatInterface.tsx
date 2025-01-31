import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import '../webview/styles/chat.css';

const vscode = window.acquireVsCodeApi();

interface Message {
    type: 'user' | 'assistant';
    content: string;
}

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    const iconPath = document.getElementById('root')?.getAttribute('data-icon-path') || '';

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;
        
        setMessages(prev => [...prev, { type: 'user', content: inputValue }]);
        setIsLoading(true);

        vscode.postMessage({
            type: 'sendMessage',
            text: inputValue
        });
        
        setInputValue('');
    };

    useEffect(() => {
        const messageHandler = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'response') {
                setMessages(prev => [...prev, { type: 'assistant', content: message.text }]);
                setIsLoading(false);
            }
        };

        window.addEventListener('message', messageHandler);
        return () => window.removeEventListener('message', messageHandler);
    }, []);

    return (
        <div className="chat-container">
            <div className="chat-header">
                <img 
                    src={iconPath}
                    alt="Heimdall" 
                    className="chat-header-icon"
                />
                <h1 className="chat-header-title">Heimdall Agent</h1>
            </div>

            <div className="messages-container">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`message-wrapper ${message.type}`}
                    >
                        <div className={`message-content ${message.type}`}>
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="message-wrapper assistant">
                        <div className="loading-indicator">
                            <div className="loading-dot" />
                            <div className="loading-dot" />
                            <div className="loading-dot" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
                <form onSubmit={handleSubmit} className="input-form">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="claude/deepseek/aider/mixed"
                        className="input-textarea"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button type="submit" className="submit-button">
                        <Send size={16} />
                        Send
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatInterface;