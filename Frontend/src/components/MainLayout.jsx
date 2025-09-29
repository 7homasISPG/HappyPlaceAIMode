import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import SideBar from './SideBar';
import ChatInterface from './ChatInterface2';
import ChatThreadSidebar from './ChatThreadSidebar';
import LoginForm from './LoginForm';
import { useAuth } from '../contexts/AuthContext';
import AIAssistance from './AIAssistance';
import AgenticWorkspace from '../pages/AgenticWorkspace/AgenticWorkspace'; 
import AgentDashboard from '../pages/AgenticWorkspace/AgentDashboard';
import AgentDetailPage from '../pages/AgenticWorkspace/AgentDetailPage';
import StudioPage from '@/pages/Studio/StudioPage'; 

const MainLayout = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const [activeView, setActiveView] = useState('explore');
    const [viewParams, setViewParams] = useState({});
    const [showLoginForm, setShowLoginForm] = useState(false);
    const [showThreadSidebar, setShowThreadSidebar] = useState(false);
    const [activeThreadId, setActiveThreadId] = useState(null);
    const [currentThread, setCurrentThread] = useState(null);

    // ... (Your useEffect hooks can remain here)

    const handleViewChange = (viewId, params = {}) => {
        setActiveView(viewId);
        setViewParams(params);
        if (viewId === 'chat' || viewId === 'explore') {
            setShowThreadSidebar(true);
        } else {
            setShowThreadSidebar(false);
        }
    };

    const handleThreadSelect = (thread) => {
        setActiveThreadId(thread.id);
        setCurrentThread(thread);
        setActiveView('chat');
    };

    const handleNewThread = (thread) => {
        setActiveThreadId(thread.id);
        setCurrentThread(thread);
        setActiveView('explore');
    };
    
    const toggleThreadSidebar = () => {
        setShowThreadSidebar(prev => !prev);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p>Loading...</p>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-gray-50">
            <TopBar 
                isAuthenticated={isAuthenticated}
                onToggleThreadSidebar={toggleThreadSidebar}
                showThreadSidebar={showThreadSidebar}
            />
            
            {isAuthenticated && (
                <SideBar 
                    activeView={activeView} 
                    onViewChange={handleViewChange} 
                />
            )}

            {isAuthenticated && showThreadSidebar && (
                <ChatThreadSidebar
                    isOpen={showThreadSidebar}
                    onClose={() => setShowThreadSidebar(false)}
                    activeThreadId={activeThreadId}
                    onThreadSelect={handleThreadSelect}
                    onNewThread={handleNewThread}
                />
            )}

            <main className={`${
                isAuthenticated 
                    ? `ml-20 ${showThreadSidebar ? 'lg:ml-[400px]' : ''} pt-16` 
                    : 'pt-16'
            } min-h-screen transition-all duration-300`}>
                <div className="p-6">
                    {(activeView === 'explore' || activeView === 'chat') && (
                        <ChatInterface
                            key={`${activeView}-${activeThreadId}`}
                            startInConversation={activeView === 'chat'}
                            currentThread={currentThread}
                        />
                    )}
                    {activeView === 'ai-assistance' && (
                        <AIAssistance params={viewParams} />
                    )}
                    
                    {/* --- THIS IS THE KEY CHANGE --- */}
                    {/* Pass the handleViewChange function down as a prop */}

                    {activeView === 'agentic-workspace' && (
                        <AgenticWorkspace onViewChange={handleViewChange} />
                    )}
                    
                    {activeView === 'my-agents' && (
                        <AgentDashboard onViewChange={handleViewChange} />
                    )}

                    {activeView === 'agent-detail' && (
                        <AgentDetailPage agentId={viewParams.agentId} />
                    )}
                                    
                    {activeView === 'studio' && <StudioPage />}
             

                    {activeView === 'activities' && (
                         <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Activities</h2>
                                <p className="text-gray-600">Activities view coming soon...</p>
                            </div>
                        </div>
                    )}
                    {activeView === 'interactions' && (
                         <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Interactions</h2>
                                <p className="text-gray-600">Interactions view coming soon...</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

        </div>
    );
};

export default MainLayout;