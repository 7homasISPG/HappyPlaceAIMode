// src/pages/AgenticWorkspace/AgentDetailPage.jsx

import React, { useState, useEffect } from 'react';
// axios is no longer needed directly here, assuming fetchAgentDetails from api.js is used
// import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { Share2, Palette, Settings, ArrowLeft, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Import our new, dedicated chat component
import AgentPreviewChat from './AgentPreviewChat';
import ThemeCustomizer from './ThemeCustomizer';
// <<< Import fetchAgentDetails from your consolidated api.js >>>
import { fetchAgentDetails } from '../../api'; 

// --- Configuration ---
// It's better to get this from environment variables (e.g., .env file for Vite)
// Ensure you have VITE_FRONTEND_BASE_URL set (e.g., VITE_FRONTEND_BASE_URL=http://localhost:5173)
const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173';

// --- Sub-Component: Share Panel ---
const SharePanel = ({ agent, onBack }) => {
    const { toast } = useToast();
    
    // Ensure agentIdentifier correctly extracts the ID (stringified ObjectId)
    const agentIdentifier = agent?.id || agent?._id;
    const publicApiKey = agent?.public_api_key; // Get the public API key

    // Helper flag to determine if we have all necessary data for links
    const isReadyForLinks = agentIdentifier && publicApiKey;

    // --- Corrected Link Generation Logic ---
    const shareableLink = isReadyForLinks 
        ? `${FRONTEND_BASE_URL}/embed/${agentIdentifier}?apiKey=${publicApiKey}` 
        : "Generating link...";
    
    const embedCode = isReadyForLinks
        ? `<script src="${FRONTEND_BASE_URL}/inject.js" data-agent-id="${agentIdentifier}" data-api-key="${publicApiKey}" defer></script>` 
        : "<!-- Agent ID or API Key not available -->";

    const handleCopy = (textToCopy, type) => {
        if (!isReadyForLinks) { // Use the helper flag
            toast({ title: "Error", description: "Agent ID or API Key is missing.", variant: "destructive" });
            return;
        }
        navigator.clipboard.writeText(textToCopy);
        toast({ title: "Copied!", description: `${type} copied to clipboard.` });
    };

    return (
        <div className="p-6">
            <Button variant="ghost" onClick={onBack} className="mb-4"><ArrowLeft className="h-4 w-4 mr-2" />Back to Next Steps</Button>
            <div className="space-y-6">
                {/* <<< NEW: Display Public API Key field >>> */}
                {/* Only render this section if publicApiKey is actually available */}
                {publicApiKey && ( 
                    <div>
                        <Label className="font-semibold">Public API Key</Label>
                        <p className="text-sm text-gray-500 mb-2">This key is required to embed your agent. Keep it secure.</p>
                        <div className="flex gap-2">
                            <Input value={publicApiKey} readOnly />
                            {/* Button disabled if publicApiKey is not available (though the block itself won't render then) */}
                            <Button onClick={() => handleCopy(publicApiKey, "API Key")} disabled={!publicApiKey}>Copy</Button>
                        </div>
                    </div>
                )}
                
                {/* Shareable Link */}
                <div>
                    <Label className="font-semibold">Shareable Link</Label>
                    <p className="text-sm text-gray-500 mb-2">Share this link to test your agent.</p>
                    <div className="flex gap-2">
                        <Input value={shareableLink} readOnly />
                        {/* Button disabled if not ready for links */}
                        <Button onClick={() => handleCopy(shareableLink, "Link")} disabled={!isReadyForLinks}>Copy</Button>
                    </div>
                </div>

                {/* Embed Code */}
                <div>
                    <Label className="font-semibold">Embed Code</Label>
                    <p className="text-sm text-gray-500 mb-2">Paste this script into your website's HTML.</p>
                    <div className="relative">
                        <Textarea value={embedCode} readOnly rows={3} className="font-mono text-xs pr-12" />
                        {/* Button disabled if not ready for links */}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-7 w-7" 
                            onClick={() => handleCopy(embedCode, "Embed Code")} 
                            disabled={!isReadyForLinks}
                        >
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Sub-Component: Next Steps Panel (No changes needed here) ---
const NextStepsPanel = ({ agent, onStyleClick, onShareClick }) => {
    const steps = [
        { icon: Share2, title: 'Share & Embed', text: 'Get a link or embed your agent', action: onShareClick },
        { icon: Palette, title: 'Theme', text: 'Customize your bot\'s appearance', action: onStyleClick },
        { icon: Settings, title: 'Advanced', text: 'Build custom workflows and analytics', action: () => alert('Advanced settings coming soon!') },
    ];
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-2">Talk to your agent.</h2>
            <p className="text-gray-600 mb-8">This is a preview of <strong>"{agent.name}"</strong>. Start a conversation on the left to test its responses.</p>
            <h3 className="text-lg font-semibold mb-4">What to do next</h3>
            <div className="space-y-4">{steps.map(step => (<div key={step.title} onClick={step.action} className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"><step.icon className="h-6 w-6 text-gray-500 mr-4"/><div><p className="font-semibold">{step.title}</p><p className="text-sm text-gray-500">{step.text}</p></div></div>))}</div>
        </div>
    );
};

// --- Main Page Component ---
const AgentDetailPage = ({ agentId, onBack }) => {
    const { token } = useAuth(); // Assuming useAuth provides a token
    const [agent, setAgent] = useState(null);
    const [isLoadingAgent, setIsLoadingAgent] = useState(true);
    const [error, setError] = useState('');
    const [rightPanelView, setRightPanelView] = useState('nextSteps');
    const [theme, setTheme] = useState({ primaryColor: '#3B82F6', radius: 12, font: 'Inter' });

    useEffect(() => {
        const loadAgent = async () => {
            if (!agentId || !token) { 
                setIsLoadingAgent(false); 
                if (!token && agentId) { // Specific error for unauthenticated access
                    setError('Authentication required to view agent details.');
                }
                return; 
            }
            try {
                // <<< Use the imported fetchAgentDetails from api.js >>>
                const agentData = await fetchAgentDetails(agentId); 
                setAgent(agentData);
                // If the agent data includes theme/style configuration, apply it here
                if (agentData.theme) { // Assuming agentData might eventually have a theme field
                    setTheme(agentData.theme);
                }
            } catch (err) { 
                console.error("Failed to load agent details:", err);
                setError('Failed to load agent details. Please ensure you are logged in and the agent exists.'); 
            } 
            finally { 
                setIsLoadingAgent(false); 
            }
        };
        loadAgent();
    }, [agentId, token]); // Dependencies ensure re-fetch if agentId or token changes

    const renderRightPanel = () => {
        // Ensure agent is loaded before trying to render panels to avoid runtime errors
        if (isLoadingAgent || !agent) return null; 
        
        switch (rightPanelView) {
            case 'theme': return <ThemeCustomizer theme={theme} setTheme={setTheme} onBack={() => setRightPanelView('nextSteps')} />;
            case 'share': return <SharePanel agent={agent} onBack={() => setRightPanelView('nextSteps')} />;
            default: return <NextStepsPanel agent={agent} onStyleClick={() => setRightPanelView('theme')} onShareClick={() => setRightPanelView('share')} />;
        }
    };

    if (isLoadingAgent) return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    // This check is a final fallback if `error` wasn't set but `agent` is still null after loading.
    if (!agent) return <div className="p-8 text-center text-gray-600">Agent not found or failed to load.</div>; 

    return (
        <div className="flex flex-col h-full">
            <header className="flex items-center p-4 border-b">
                <Button variant="outline" size="icon" className="mr-4" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
                <div><h1 className="text-xl font-bold">{agent.name}</h1><p className="text-sm text-gray-500">Customize and test your agent</p></div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-grow overflow-hidden">
                {/* Left Side: The dedicated Chat Preview Component */}
                <div className="h-full">
                    {/* Pass the agent prop directly; it now contains public_api_key */}
                    <AgentPreviewChat agent={agent} theme={theme} />
                </div>

                {/* Right Side: Dynamic Panel */}
                <div className="hidden lg:block bg-white border-l h-full overflow-y-auto">
                    {renderRightPanel()}
                </div>
            </div>
        </div>
    );
};

export default AgentDetailPage;