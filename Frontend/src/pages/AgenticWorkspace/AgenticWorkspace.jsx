import React, { useState } from 'react';
import ChooseAgentStep from './ChooseAgentStep';
import KnowledgeBaseStep from './KnowledgeBaseStep';
import ReviewAndCreateStep from './ReviewAndCreateStep';

// <<< 1. ACCEPT onViewChange AS A PROP >>>
const AgenticWorkspace = ({ onViewChange }) => {
    const [step, setStep] = useState(1);
    const [agentConfig, setAgentConfig] = useState({
        name: '',
        system_message: 'You are a helpful assistant.',
        knowledge_base_files: [],
        knowledge_base_urls: [],
    });

    const handleNext = (data) => {
        setAgentConfig(prev => ({ ...prev, ...data }));
        setStep(prev => prev + 1);
    };

    const handleBack = () => {
        setStep(prev => prev - 1);
    };

    // <<< 2. CREATE A SUCCESS HANDLER THAT USES onViewChange >>>
    // This function will be called by the final step when the API call succeeds.
    const handleCreateSuccess = (newAgent) => {
        if (newAgent && newAgent._id) {
            // Use the function from MainLayout to navigate to the new agent's detail page
            onViewChange('agent-detail', { agentId: newAgent._id });
        } else {
            console.error("Agent creation succeeded but no agent data was returned.");
            // Fallback to the agent dashboard
            onViewChange('my-agents');
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return <ChooseAgentStep onNext={handleNext} initialData={agentConfig} />;
            case 2:
                return <KnowledgeBaseStep onNext={handleNext} onBack={handleBack} initialData={agentConfig} />;
            case 3:
                // <<< 3. PASS THE NEW SUCCESS HANDLER TO THE FINAL STEP >>>
                return <ReviewAndCreateStep 
                           onBack={handleBack} 
                           finalConfig={agentConfig} 
                           onCreateSuccess={handleCreateSuccess} 
                       />;
            default:
                return <ChooseAgentStep onNext={handleNext} initialData={agentConfig} />;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-8">
                {renderStep()}
            </div>
        </div>
    );
};

export default AgenticWorkspace;