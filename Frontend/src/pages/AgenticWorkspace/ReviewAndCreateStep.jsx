import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Rocket, Link as LinkIcon, FileText } from 'lucide-react';

const API_AGENTS_URL = 'http://localhost:8000/api/agents';

const ReviewAndCreateStep = ({ onBack, finalConfig, onCreateSuccess }) => {
    const { token } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    const handleCreateAgent = async () => {
        setIsCreating(true);
        setError('');
        try {
            const payload = {
                name: finalConfig.name,
                system_message: finalConfig.system_message,
                tasks: finalConfig.tasks || [],
                knowledge_base_files: finalConfig.knowledge_base_files || [],
                knowledge_base_urls: finalConfig.knowledge_base_urls || [],
            };

            // <<< THIS IS THE KEY CHANGE >>>
            // Capture the response from the successful API call
            const response = await axios.post(API_AGENTS_URL, payload, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });

            // Pass the new agent data from the response up to the parent component
            onCreateSuccess(response.data);

        } catch (err) {
            // This block will now only run on a true backend error (4xx or 5xx)
            setError(err.response?.data?.detail || 'Failed to create agent.');
        } finally {
            setIsCreating(false);
        }
    };

    const hasKnowledgeSources = (finalConfig.knowledge_base_files?.length > 0) || (finalConfig.knowledge_base_urls?.length > 0);

    return (
        <div>
            <h2 className="text-2xl font-semibold text-center mb-6">Review and Create</h2>
            <div className="p-4 border rounded-lg space-y-4 bg-gray-50">
                <div>
                    <h3 className="font-bold text-lg">{finalConfig.name}</h3>
                    <p className="text-sm text-gray-600 italic">"{finalConfig.system_message}"</p>
                </div>
                <hr/>
                <div>
                    <h4 className="font-semibold">Knowledge Base</h4>
                    {hasKnowledgeSources ? (
                        <ul className="list-inside text-sm text-gray-700 mt-2 space-y-1">
                            {finalConfig.knowledge_base_urls?.map(url => (
                                <li key={url} className="flex items-center gap-2">
                                    <LinkIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span className="truncate">{url}</span>
                                </li>
                            ))}
                            {finalConfig.knowledge_base_files?.map(file => (
                                <li key={file} className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                    <span>{file}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-500">No knowledge base sources added.</p>
                    )}
                </div>
            </div>

            {error && <p className="text-red-500 text-center text-sm mt-4">{error}</p>}
            
            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 font-semibold">
                    Back
                </button>
                <button onClick={handleCreateAgent} disabled={isCreating} className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-semibold flex items-center gap-2 disabled:bg-green-300">
                    <Rocket className="h-5 w-5" />
                    {isCreating ? 'Creating...' : 'Create Agent'}
                </button>
            </div>
        </div>
    );
};

export default ReviewAndCreateStep;