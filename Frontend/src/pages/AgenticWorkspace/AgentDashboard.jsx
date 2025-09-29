import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Bot, Plus, Frown } from 'lucide-react';
import AgentCard from './AgentCard'; // We will create this new component
import ConfirmationModal from './ConfirmationModal'; // And this one too

const API_AGENTS_URL = 'http://localhost:8000/api/agents';

const AgentDashboard = ({ onViewChange }) => {
    const { token } = useAuth();
    const [agents, setAgents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [agentToDelete, setAgentToDelete] = useState(null); // State for the confirmation modal

    // Fetch agents on component mount
    useEffect(() => {
        const fetchAgents = async () => {
            if (!token) { setIsLoading(false); setError('You must be logged in.'); return; }
            try {
                const response = await axios.get(API_AGENTS_URL, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAgents(response.data);
            } catch (err) {
                setError('Failed to fetch agents.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAgents();
    }, [token]);

    // Function to handle the confirmed deletion
    const handleDeleteConfirm = async () => {
        if (!agentToDelete) return;

        try {
            await axios.delete(`${API_AGENTS_URL}/${agentToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Update UI by removing the deleted agent from state
            setAgents(agents.filter(agent => agent._id !== agentToDelete._id));
        } catch (err) {
            setError('Failed to delete agent.');
        } finally {
            setAgentToDelete(null); // Close the modal
        }
    };

    if (isLoading) return <div className="p-8 text-center">Loading agents...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Agents</h1>
                <button 
                    onClick={() => onViewChange('agentic-workspace')} 
                    className="flex items-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-semibold shadow-sm transition-all duration-200"
                >
                    <Plus className="h-5 w-5" />
                    Create New Agent
                </button>
            </div>
            
            {agents.length === 0 ? (
                <div className="text-center mt-16 text-gray-500">
                    <Frown className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <h2 className="text-xl font-semibold">No Agents Found</h2>
                    <p>Click "Create New Agent" to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {agents.map(agent => (
                        <AgentCard 
                            key={agent._id}
                            agent={agent}
                            // Navigate to the detail page on click
                            onSelect={() => onViewChange('agent-detail', { agentId: agent._id })}
                            // Open the confirmation modal on delete
                            onDelete={() => setAgentToDelete(agent)}
                        />
                    ))}
                </div>
            )}

            {/* The Confirmation Modal */}
            <ConfirmationModal 
                isOpen={!!agentToDelete}
                onClose={() => setAgentToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Delete Agent"
                message={`Are you sure you want to permanently delete the agent "${agentToDelete?.name}"? This action cannot be undone.`}
            />
        </div>
    );
};

export default AgentDashboard;