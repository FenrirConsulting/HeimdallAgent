import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

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
        
        console.log('Submitting message:', inputValue);

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
        <div className="flex flex-col h-screen bg-gray-100">
            {/* Header with smaller icon and larger title */}
            <div className="flex items-center p-4 bg-[#2d2d2d] text-white">
                <img 
                    src={iconPath}
                    alt="Heimdall" 
                    className="w-6 h-6" // Reduced size
                />
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[80%] rounded-lg p-3 ${
                                message.type === 'user' 
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-white text-gray-800'
                            }`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white rounded-lg p-3">
                            <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input form with taller textarea */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                <div className="flex space-x-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="claude/deepseek/aider/mixed"
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none" // Increased height
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button 
                        type="submit"
                        className="p-3 bg-[#1e1e1e] text-[#61dafb] rounded-lg hover:bg-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-blue-500 self-end transition-colors"
                    >
                        <Send className="w-6 h-6" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInterface;