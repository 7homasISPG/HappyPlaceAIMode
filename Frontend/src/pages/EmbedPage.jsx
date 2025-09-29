// src/pages/EmbedPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

import AgentPreviewChat from './AgenticWorkspace/AgentPreviewChat';
import { fetchPublicAgentConfig } from '../api'; // Ensure this is imported

const EmbedPage = () => {
    const { agentId } = useParams();
    const [searchParams] = useSearchParams();
    
    // Read the apiKey from the URL query string
    const apiKey = searchParams.get('apiKey'); 
    
    // State to hold the specific agent's configuration and theme
    const [agent, setAgent] = useState(null);
    const [theme, setTheme] = useState({ primaryColor: '#3B82F6', radius: 12, font: 'Inter' });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Debugging: Log initial values from URL
        console.log("EmbedPage (useEffect): Initializing/Updating.");
        console.log("EmbedPage (useEffect): agentId from useParams:", agentId);
        console.log("EmbedPage (useEffect): apiKey from useSearchParams:", apiKey);

        // Pre-check for required parameters
        if (!agentId) {
            setError("Configuration Error: No Agent ID provided in the URL.");
            setIsLoading(false);
            console.error("EmbedPage (Error): Agent ID is missing from URL.");
            return;
        }
        if (!apiKey) {
            setError("Configuration Error: No API Key provided in the URL. Please ensure data-api-key is set in your embed script.");
            setIsLoading(false);
            console.error("EmbedPage (Error): API Key is missing from URL.");
            return;
        }

        const loadAgentConfig = async () => {
            // Debugging: Log attempt to fetch config
            console.log(`EmbedPage (fetch): Attempting to fetch public agent config for agentId: ${agentId} with apiKey: ${apiKey}`);
            try {
                const config = await fetchPublicAgentConfig(agentId, apiKey); 
                setAgent(config);
                // Apply theme if available in agent config (assuming 'theme' might be a field in AgentConfiguration)
                if (config.theme) { 
                    setTheme(config.theme);
                }
                console.log("EmbedPage (fetch): Successfully fetched agent config:", config);
            } catch (err) {
                console.error("EmbedPage (fetch): Failed to fetch public agent config:", err);
                setError(`This chatbot is currently unavailable. Error: ${err.message}. Please try again later.`);
            } finally {
                setIsLoading(false);
                console.log("EmbedPage (fetch): Loading process finished.");
            }
        };

        loadAgentConfig();
    }, [agentId, apiKey]); // Re-run if agentId or apiKey from URL change

    // --- Render Logic ---

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen w-screen bg-transparent">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen w-screen p-4 bg-transparent">
                <p className="text-center text-red-600 font-medium">{error}</p>
            </div>
        );
    }

    // Ensure agent object is not null before passing to AgentPreviewChat
    if (!agent) {
        // This case will be hit if the API call succeeds but returns no agent (e.g., empty object or null from backend)
        return <div className="p-4 text-center text-red-600">Could not load agent configuration.</div>;
    }

    return (
        <div className="w-screen h-screen bg-transparent">
            {/* 
              Render the dedicated preview chat component.
              Pass the fetched agent, theme, and the crucial apiKey as props.
              Set isEmbedded to true.
            */}
            <AgentPreviewChat 
                agent={agent} // `agent` object now correctly populated with `id` and `public_api_key`
                theme={theme} 
                isEmbedded={true} 
                apiKey={apiKey} // `apiKey` from URL, used for making chat requests
            />
        </div>
    );
};

export default EmbedPage;