// src/pages/AgenticWorkspace/AgentPreviewChat.jsx

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ChatView from '../../components/ChatView';
import ChatInput from '../../components/ChatInput';
import { askQuestion, publicAskQuestion } from '../../api';

const AgentPreviewChat = ({ agent, theme, isEmbedded = false, apiKey = null }) => {
    const { token } = useAuth(); 
    const { toast } = useToast();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (agent?.name) {
            setMessages([
                { 
                  role: 'assistant', 
                  content: { type: 'answer', text: `Hi! I'm ${agent.name}. How can I assist you?` },
                  timestamp: new Date().toISOString() // <<< ADD TIMESTAMP TO WELCOME MESSAGE
                }
            ]);
        }
        setSessionId(null);
    }, [agent]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (query) => {
        if (!query.trim()) return;

        // <<< ADD TIMESTAMP TO USER MESSAGE >>>
        const userMessage = { 
            role: 'user', 
            content: { text: query },
            timestamp: new Date().toISOString() 
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const agentId = agent?.id || agent?._id;
            let responseData;

            if (isEmbedded) {
                if (!apiKey) throw new Error("API Key is missing for embedded chat.");
                if (!agentId) throw new Error("Agent ID is missing for embedded chat.");
                responseData = await publicAskQuestion(query, sessionId, apiKey, agentId);
            } else {
                if (!token) throw new Error("User authentication token is missing.");
                responseData = await askQuestion(query, "en", sessionId, null, agentId);
            }
            
            if (responseData.session_id) {
                setSessionId(responseData.session_id);
            }
            
            // <<< ADD TIMESTAMP TO ASSISTANT MESSAGE >>>
            const assistantMessage = { 
                role: 'assistant', 
                content: responseData,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (error) {
            console.error("Error sending message:", error);
            // <<< ADD TIMESTAMP TO ERROR MESSAGE >>>
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: { type: 'answer', text: "Sorry, an error occurred." },
                timestamp: new Date().toISOString() 
            }]);
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };
    
    const resetConversation = () => {
         if (agent?.name) {
            setMessages([
                { 
                    role: 'assistant', 
                    content: { type: 'answer', text: `Hi! I'm ${agent.name}. How can I assist you?` },
                    timestamp: new Date().toISOString() // <<< ADD TIMESTAMP ON RESET
                }
            ]);
        }
        setSessionId(null);
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border flex flex-col h-full">
            <div className="p-4 border-b flex justify-between items-center">
                <div className="flex items-center min-w-0">
                    <div 
                        className="w-10 h-10 rounded-full text-white flex items-center justify-center font-bold text-xl mr-3 flex-shrink-0"
                        style={{ backgroundColor: theme.primaryColor }}
                    >
                        {agent.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-semibold truncate">{agent.name}</h3>
                        <p className="text-xs text-gray-500 truncate">{agent.system_message || agent.description}</p>
                    </div>
                </div>
                {!isEmbedded && (
                    <Button onClick={resetConversation} variant="ghost" size="icon" title="Reset Conversation">
                        <RefreshCw className="h-5 w-5" />
                    </Button>
                )}
            </div>

            <div className="flex-1 flex flex-col overflow-y-auto p-4">
                <ChatView messages={messages} isLoading={isLoading} messagesEndRef={messagesEndRef} onSendMessage={handleSendMessage}/>
            </div>

            <div className="p-4 border-t">
                <ChatInput input={input} setInput={setInput} onSendMessage={handleSendMessage} isLoading={isLoading} isEmbedded={isEmbedded} />
            </div>
        </div>
    );
};

export default AgentPreviewChat;