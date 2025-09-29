// src/pages/Studio/ChatflowsView.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusIcon, Info, Frown, Loader2 } from 'lucide-react';
import ChatflowCard from '../AgenticWorkspace/ChatflowCard';
import ConfirmationModal from '../AgenticWorkspace/ConfirmationModal';

// Replace with your real API endpoint
const API_CHATFLOWS_URL = 'http://localhost:8000/api/chatflows';

const ChatflowsView = ({ onViewChange }) => {
    const { token, isAuthenticated } = useAuth();
    const [chatflows, setChatflows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [flowToDelete, setFlowToDelete] = useState(null);

    // Fetch chatflows
    useEffect(() => {
        const fetchFlows = async () => {
            if (!isAuthenticated || !token) {
                setIsLoading(false);
                setError('You must be logged in to view chatflows.');
                return;
            }

            try {
                const res = await fetch(API_CHATFLOWS_URL, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) throw new Error('Failed to fetch chatflows');
                const data = await res.json();
                setChatflows(data);
            } catch (err) {
                setError('Failed to fetch chatflows.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFlows();
    }, [isAuthenticated, token]);

    // Handle delete
    const handleDeleteConfirm = async () => {
        if (!flowToDelete) return;

        try {
            const res = await fetch(`${API_CHATFLOWS_URL}/${flowToDelete._id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to delete chatflow');
            setChatflows(chatflows.filter(flow => flow._id !== flowToDelete._id));
        } catch (err) {
            setError('Failed to delete chatflow.');
        } finally {
            setFlowToDelete(null);
        }
    };

    return (
        <div className="flex-grow p-6 sm:p-8 flex flex-col bg-white h-full overflow-y-auto">
            {/* --- INTRODUCTORY SECTION --- */}
            <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                    <Info className="h-6 w-6 text-blue-500 mr-4 mt-1 flex-shrink-0" />
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Welcome to Chatflows</h2>
                        <p className="mt-2 text-slate-600">
                            Chatflows let you build simple conversational AI systems. Use them to manage
                            single-purpose agents and RAG bots.
                        </p>
                    </div>
                </div>
            </div>

            {/* --- HEADER --- */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">My Chatflows</h1>
                    <p className="text-gray-500 mt-1">
                        Manage your single-agent systems and conversational flows.
                    </p>
                </div>
                <Button
                    size="lg"
                    className="mt-4 sm:mt-0"
                    onClick={() => onViewChange('chatflow-create')}
                >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create New Chatflow
                </Button>
            </header>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-grow">
                {isLoading && (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                )}

                {!isLoading && error && (
                    <div className="text-center mt-16 text-red-500">{error}</div>
                )}

                {!isLoading && !error && chatflows.length === 0 && (
                    <div className="text-center mt-16 text-gray-500 border-2 border-dashed rounded-lg py-12">
                        <Frown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold">No Chatflows Found</h2>
                        <p>Click "Create New Chatflow" to get started.</p>
                    </div>
                )}

                {!isLoading && !error && chatflows.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {chatflows.map(flow => (
                            <ChatflowCard
                                key={flow._id}
                                chatflow={flow}
                                onSelect={() =>
                                    onViewChange('chatflow-detail', { flowId: flow._id })
                                }
                                onDelete={() => setFlowToDelete(flow)}
                            />
                        ))}
                    </div>
                )}
            </main>

            {/* --- DELETE CONFIRMATION MODAL --- */}
            <ConfirmationModal
                isOpen={!!flowToDelete}
                onClose={() => setFlowToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Chatflow"
                message={`Are you sure you want to permanently delete "${flowToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default ChatflowsView;
