import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import InitialView from './InitialView';
import ChatView from './ChatView';
import ChatInput from './ChatInput';
import SourceDisplay from './SourceDisplay';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';

// Configuration
const API_ASK_URL = 'http://localhost:8000/api/ask';
const API_UPLOAD_URL = 'http://localhost:8000/api/upload';
const WS_BASE_URL = 'ws://localhost:8000/ws';

const ChatInterface = ({
    startInConversation = false,
    currentThread = null,
    onThreadUpdate = null
}) => {
    // Auth
    const { user, token, isAuthenticated } = useAuth();

    // State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [conversationStarted, setConversationStarted] = useState(startInConversation);
    const [currentSources, setCurrentSources] = useState([]);
    const [isSourceOpen, setIsSourceOpen] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    const fileInputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // WebSocket
    const ws = useRef(null);
    const [isInteractiveSession, setIsInteractiveSession] = useState(false);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Cleanup WebSocket
    useEffect(() => {
        return () => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                console.log("Closing WebSocket connection on component unmount.");
                ws.current.close();
            }
        };
    }, []);

    // Reset when thread changes
    useEffect(() => {
        if (currentThread && currentThread.id) {
            setMessages([]);
            setConversationStarted(startInConversation);
            if (ws.current) {
                ws.current.close();
            }
            setIsInteractiveSession(false);
        }
    }, [currentThread, startInConversation]);

    // Auto-open sources
    useEffect(() => {
        if (currentSources.length > 0) {
            setIsSourceOpen(true);
        }
    }, [currentSources]);

    // --- WebSocket Connection Logic ---
    const connectWebSocket = useCallback(
        (newSessionId) => {
            if (!token) {
                console.error("No token available for WebSocket connection.");
                return;
            }

            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
                console.log("WebSocket is already connected.");
                return;
            }

            console.log("Attempting to connect to WebSocket...");
            const wsUrl = `${WS_BASE_URL}?session_id=${newSessionId}&token=${token}`;
            ws.current = new WebSocket(wsUrl);

            ws.current.onopen = () => {
                console.log("WebSocket connection established.");
                setIsInteractiveSession(true);
                setIsLoading(false);
            };

            ws.current.onmessage = (event) => {
                console.log("WebSocket message received:", event.data);
                let newMessage;
                try {
                    const parsed = JSON.parse(event.data);
                    const role = parsed.sender?.toLowerCase() || "assistant";

                    if (parsed.type === "final_answer" || parsed.type === "agent_message") {
                        newMessage = {
                            role,
                            content: {
                                type: 'answer',
                                text: parsed.text || '',
                                citations: parsed.citations || [],
                                follow_ups: parsed.follow_ups || []
                            },
                            timestamp: new Date().toISOString()
                        };
                    } else {
                        newMessage = {
                            role,
                            content: { type: 'answer', text: parsed.text || event.data },
                            timestamp: new Date().toISOString()
                        };
                    }
                } catch (e) {
                    newMessage = {
                        role: "assistant",
                        content: { type: 'answer', text: event.data },
                        timestamp: new Date().toISOString()
                    };
                }

                if (newMessage) {
                    setMessages(prev => [...prev, newMessage]);
                }
                setIsLoading(false);
            };

            ws.current.onclose = () => {
                console.log("WebSocket connection closed.");
                setIsInteractiveSession(false);
                setIsLoading(false);
                const systemMessage = {
                    role: 'system',
                    content: { text: "The interactive session has ended." },
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, systemMessage]);
            };

            ws.current.onerror = (error) => {
                console.error("WebSocket error:", error);
                setIsLoading(false);
                const errorMessage = {
                    role: 'assistant',
                    content: { text: "Sorry, I lost connection with my team. Please try again." },
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, errorMessage]);
            };
        },
        [token]
    );

    // --- Message Handling ---
    const handleSendMessage = async (query) => {
        if (!query.trim()) return;
        if (!isAuthenticated) {
            const errorMessage = {
                role: 'system',
                content: { text: 'You must be logged in to chat.' },
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }
        if (!conversationStarted) setConversationStarted(true);

        const userMessage = { role: 'user', content: { text: query }, timestamp: new Date().toISOString() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');

        // WebSocket mode
        if (isInteractiveSession && ws.current && ws.current.readyState === WebSocket.OPEN) {
            console.log("Sending message via WebSocket:", query);
            ws.current.send(query);
            return;
        }

        // HTTP mode
        setIsLoading(true);
        try {
            const response = await axios.post(API_ASK_URL, { query, lang: "en" }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const responseData = response.data;
            console.log("Received structured response from backend:", responseData);

            if (responseData.type === 'interactive_session_start') {
                const sid = responseData.session_id;
                setSessionId(sid);
                connectWebSocket(sid);
            } else {
                const assistantMessage = {
                    role: 'assistant',
                    content: responseData,
                    timestamp: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMessage]);
                setIsLoading(false);
            }

            if (responseData.citations?.length > 0) {
                setCurrentSources(responseData.citations);
            }

            if (onThreadUpdate && currentThread) {
                const updatedThread = {
                    ...currentThread,
                    lastMessage: query,
                    timestamp: new Date(),
                    messageCount: (currentThread.messageCount || 0) + 2
                };
                onThreadUpdate(updatedThread);
            }
        } catch (error) {
            console.error('Error fetching response from backend:', error);
            let errorMessageText = 'Sorry, I encountered an error. Please try again.';
            if (error.response) {
                errorMessageText = `Sorry, server error: ${error.response.data.detail || 'Unknown error'}`;
            } else if (error.request) {
                errorMessageText = 'Could not connect to backend. Please ensure it is running.';
            }
            const errorMessage = {
                role: 'assistant',
                content: { type: 'answer', text: errorMessageText },
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
            setIsLoading(false);
        }
    };

    // --- File Upload Handling ---
    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!isAuthenticated) {
            const errorMessage = {
                role: 'system',
                content: { text: 'You must be logged in to upload files.' },
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorMessage]);
            return;
        }
        if (!conversationStarted) setConversationStarted(true);

        const systemMessage = { role: 'system', content: { text: `Uploading ${file.name}...` } };
        setMessages(prev => [...prev, systemMessage]);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(API_UPLOAD_URL, formData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            const successMessage = { role: 'system', content: { text: `✅ ${response.data.message}` } };
            setMessages(prev => [...prev, successMessage]);
        } catch (error) {
            console.error('Error uploading file:', error);
            const errorMessage = { role: 'system', content: { text: `❌ Error uploading ${file.name}.` } };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // --- Rendering ---
    const viewVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
        exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
    };

    return (
        <div className="h-[calc(100vh-6rem)] flex bg-gray-50 relative">
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                <div className="flex-1 flex flex-col items-center overflow-hidden">
                    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            {!conversationStarted ? (
                                <motion.div key="initial-view" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="flex-1">
                                    <InitialView onSendMessage={handleSendMessage} input={input} setInput={setInput} onFileUpload={handleFileUpload} fileInputRef={fileInputRef} isLoading={isLoading} />
                                </motion.div>
                            ) : (
                                <motion.div key="chat-view" variants={viewVariants} initial="hidden" animate="visible" exit="exit" className="flex-1 flex flex-col overflow-hidden">
                                    <ChatView messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} messagesEndRef={messagesEndRef} />
                                    <div className="w-full max-w-3xl mx-auto p-4 pt-2">
                                        <ChatInput input={input} setInput={setInput} onSendMessage={handleSendMessage} onFileUpload={handleFileUpload} fileInputRef={fileInputRef} isLoading={isLoading} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Source Display Drawer */}
            {conversationStarted && (
                <div className={`relative h-[calc(100vh-4rem)] transition-transform duration-300 ease-in-out ${isSourceOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="h-[calc(100vh-4rem)] w-[30vw] min-w-[320px] bg-white border-l border-gray-200 shadow-lg z-40 relative flex flex-col">
                        <button onClick={() => setIsSourceOpen(prev => !prev)} className="absolute top-1/2 -left-4 transform -translate-y-1/2 z-50 bg-white border border-gray-300 shadow-md rounded-l-full p-2 hover:bg-gray-100 transition-all duration-200 group flex items-center" title={isSourceOpen ? 'Hide Sources' : 'Show Sources'}>
                            {isSourceOpen ? (<ChevronRight className="h-4 w-4 text-gray-600 group-hover:text-black transition" />) : (<ChevronLeft className="h-4 w-4 text-gray-600 group-hover:text-black transition" />)}
                        </button>
                        <div className="flex-1 overflow-y-auto">
                            <SourceDisplay sources={currentSources} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatInterface;
