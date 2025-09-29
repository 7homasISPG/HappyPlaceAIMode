// src/pages/Studio/FlowsDashboard.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { PlusIcon, Frown, Loader2 } from 'lucide-react';
import AgentCard from '../AgenticWorkspace/AgentCard'; // This will be a child component
import ConfirmationModal from '../AgenticWorkspace/ConfirmationModal'; // This will be a child component
import { useToast } from '@/hooks/use-toast';

// In a real app, you would import these from './api.js'
const mockApi = {
  fetchFlows: async (token) => {
    console.log("Fetching flows...");
    await new Promise(res => setTimeout(res, 700));
    return [
      { id: '1', name: 'Customer Support Bot', description: 'Handles customer queries and support tickets.' },
      { id: '2', name: 'Sales Inquiry Flow', description: 'Qualifies leads and books demos.' },
      { id: '3', name: 'Internal Knowledge Base', description: 'Answers questions from internal documents.' },
    ];
  },
  deleteFlow: async (flowId, token) => {
    console.log(`Deleting flow ${flowId}`);
    await new Promise(res => setTimeout(res, 300));
  }
};

const FlowsDashboard = ({ title, description, onViewChange, createView }) => {
    const { isAuthenticated, token } = useAuth();
    const [flows, setFlows] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [flowToDelete, setFlowToDelete] = useState(null);
    const { toast } = useToast();

    useEffect(() => {
        const loadFlows = async () => {
            if (!isAuthenticated) {
                setIsLoading(false);
                setError('You must be logged in to view your flows.');
                return;
            }
            try {
                const fetchedFlows = await mockApi.fetchFlows(token);
                setFlows(fetchedFlows);
            } catch (err) {
                setError(`Failed to fetch ${title.toLowerCase()}.`);
                toast({ title: "Error", description: `Failed to fetch ${title.toLowerCase()}.`, variant: "destructive" });
            } finally {
                setIsLoading(false);
            }
        };
        loadFlows();
    }, [isAuthenticated, token, title, toast]);

    const handleDeleteConfirm = async () => {
        if (!flowToDelete) return;
        try {
            await mockApi.deleteFlow(flowToDelete.id, token);
            setFlows(flows.filter(flow => flow.id !== flowToDelete.id));
            toast({ title: "Success", description: `"${flowToDelete.name}" was deleted.` });
        } catch (err) {
            setError(`Failed to delete ${title.slice(0, -1)}.`);
            toast({ title: "Error", description: `Failed to delete ${title.slice(0, -1)}.`, variant: "destructive" });
        } finally {
            setFlowToDelete(null);
        }
    };
    
    return (
        <div className="p-6 sm:p-8 h-full bg-white flex flex-col overflow-y-auto">
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500 mt-1">{description}</p>
                </div>
                <Button size="lg" className="mt-4 sm:mt-0" onClick={() => onViewChange(createView)}>
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Create New
                </Button>
            </header>

            <main className="flex-grow">
                {isLoading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}
                
                {!isLoading && error && <div className="text-center mt-16 text-red-500">{error}</div>}
                
                {!isLoading && !error && flows.length === 0 && (
                    <div className="text-center mt-16 text-gray-500 border-2 border-dashed rounded-lg py-16">
                        <Frown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                        <h2 className="text-xl font-semibold">No {title} Found</h2>
                        <p>Click "Create New" to get started.</p>
                    </div>
                )}
                
                {!isLoading && !error && flows.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {flows.map(flow => (
                            <AgentCard 
                                key={flow.id}
                                agent={flow}
                                onSelect={() => onViewChange(createView, { flowId: flow.id })}
                                onDelete={() => setFlowToDelete(flow)}
                            />
                        ))}
                    </div>
                )}
            </main>

            <ConfirmationModal 
                isOpen={!!flowToDelete}
                onClose={() => setFlowToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title={`Delete ${title.slice(0, -1)}`}
                message={`Are you sure you want to permanently delete "${flowToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default FlowsDashboard;