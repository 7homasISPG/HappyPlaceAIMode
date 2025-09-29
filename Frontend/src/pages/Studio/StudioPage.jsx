// src/pages/Studio/StudioPage.jsx
import React, { useState } from 'react';
import MainSidebar from './MainSidebar';
import FlowEditor from './FlowEditor/FlowEditor';
import FlowsDashboard from './FlowsDashboard'; 
import KnowledgeBaseStep from '../AgenticWorkspace/KnowledgeBaseStep';
import PlaceholderView from '@/components/common/PlaceholderView';
import TopBar from '@/components/TopBar';
import ToolsView from './ToolsView';
import { useAuth } from '@/contexts/AuthContext';
import ApiKeysView from './ApiKeysView';
import TriggerTestView from './TriggerTestView';

const StudioPage = () => {
    const [currentView, setCurrentView] = useState('Agentflow'); 
    const [viewParams, setViewParams] = useState({});
    const { isAuthenticated } = useAuth();

    const handleViewChange = (view, params = {}) => {
        // If we are navigating to an editor, we might get an ID
        if (params.flowId) {
             // If the ID is different from the current one, update it.
             // This allows opening a different flow from the dashboard.
            if (viewParams.flowId !== params.flowId) {
                 setViewParams(params);
            }
        } else {
             setViewParams(params);
        }
        setCurrentView(view);
    };
    
    // This is a wrapper div that will conditionally hide its children
    const ViewWrapper = ({ viewId, children }) => {
        const isActive = Array.isArray(viewId) ? viewId.includes(currentView) : viewId === currentView;
        return (
            <div style={{ display: isActive ? 'block' : 'none', height: '100%', width: '100%' }}>
                {children}
            </div>
        );
    };

    return (
        <div className="flex h-screen flex-col bg-white">
            <TopBar isAuthenticated={isAuthenticated} />
            <div className="flex flex-1 pt-16 overflow-hidden">
                <MainSidebar activeView={currentView} onSelectView={handleViewChange} />
                <main className="flex-grow h-full overflow-hidden">
                    {/* 
                      Instead of a switch statement that unmounts components,
                      we render all stateful components and toggle their visibility.
                    */}
                    <ViewWrapper viewId="Chatflow">
                        <FlowsDashboard 
                            type="chatflows"
                            title="Chatflow"
                            description="Build and manage your single-agent systems and RAG bots."
                            onViewChange={handleViewChange}
                            createView="ChatflowEditor"
                        />
                    </ViewWrapper>
                    
                    <ViewWrapper viewId="Agentflow">
                        <FlowsDashboard
                            type="agents"
                            title="Agentflow"
                            description="Create and manage intelligent multi-step agent workflows."
                            onViewChange={handleViewChange}
                            createView="AgentflowEditor"
                        />
                    </ViewWrapper>

                    <ViewWrapper viewId={['AgentflowEditor', 'ChatflowEditor']}>
                        <FlowEditor 
                            key={viewParams.flowId || 'new-flow'} // Use key to force re-mount ONLY when flowId changes
                            flowId={viewParams.flowId} 
                            onViewChange={handleViewChange} 
                        />
                    </ViewWrapper>

                    <ViewWrapper viewId="Tools">
                        <ToolsView />
                    </ViewWrapper>

                    <ViewWrapper viewId="APIKeys">
                        <ApiKeysView />
                    </ViewWrapper>

                    <ViewWrapper viewId="DocumentStore">
                         <div className="p-6 overflow-y-auto h-full">
                            <KnowledgeBaseStep
                                initialData={viewParams.initialData || {}}
                                onNext={(data) => console.log('Proceed with sources:', data)}
                                onBack={() => handleViewChange('Agentflow')}
                            />
                        </div>
                    </ViewWrapper>

                    <ViewWrapper viewId="TriggerTest">
                        <TriggerTestView />
                    </ViewWrapper>
                    
                    {/* Placeholder for views that don't need their state preserved */}
                    <ViewWrapper viewId={['Execution', 'Assistant', 'Marketplace', 'Credential', 'Variable']}>
                        <PlaceholderView title={currentView} />
                    </ViewWrapper>
                </main>
            </div>
        </div>
    );
};

export default StudioPage;