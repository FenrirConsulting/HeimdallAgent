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
        <div className="flex flex-col h-screen bg-gray-100 font-roboto">
            {/* Header with smaller icon and larger title */}
            <div className="flex items-center p-4 bg-[#2d2d2d] text-white">
            <img 
                src={iconPath}
                alt="Heimdall" 
                className="w-4 h-4 mr-2" // Reduced icon size
            />
            <h1 className="text-lg font-semibold">Heimdall Agent</h1>
        </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
                {messages.map((message, index) => (
                    <div 
                        key={index} 
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div 
                            className={`max-w-[80%] rounded-lg p-4 ${
                                message.type === 'user' 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'bg-white text-gray-800 border border-gray-300 shadow-md'
                            }`}
                        >
                            {message.content}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start mt-6">
                        <div className="bg-white rounded-lg p-3 border border-gray-300 shadow-md">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
                <div className="flex flex-col space-y-2">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="claude/deepseek/aider/mixed"
                        className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px] resize-none"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button 
                        type="submit"
                        className="p-3 bg-[#1e1e1e] text-[#61dafb] rounded-lg hover:bg-[#2d2d2d] focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                        <Send className="w-6 h-6 mx-auto" />
                    </button>
                </div>
            </form>

            {/* Animation styles */}
            <style>{`
                @keyframes bounce {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-6px); }
                }
                .animate-bounce {
                    animation: bounce 1s infinite;
                }
            `}</style>
        </div>
    );
};

export default ChatInterface;