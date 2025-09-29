import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Plus, 
    Search, 
    MessageSquare, 
    X, 
    MoreHorizontal,
    Trash2,
    Edit3
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ThreadItem from './ThreadItem';

// Mock data - replace with actual API calls
const mockThreads = [

];

const ChatThreadSidebar = ({ 
    isOpen, 
    onClose, 
    activeThreadId, 
    onThreadSelect, 
    onNewThread 
}) => {
    const [threads, setThreads] = useState(mockThreads);
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredThreads, setFilteredThreads] = useState(mockThreads);

    // Filter threads based on search query
    useEffect(() => {
        if (searchQuery.trim()) {
            const filtered = threads.filter(thread =>
                thread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                thread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredThreads(filtered);
        } else {
            setFilteredThreads(threads);
        }
    }, [searchQuery, threads]);

    const handleNewThread = () => {
        const newThread = {
            id: Date.now().toString(),
            title: 'New Conversation',
            lastMessage: '',
            timestamp: new Date(),
            messageCount: 0
        };
        
        setThreads(prev => [newThread, ...prev]);
        onNewThread(newThread);
    };

    const handleDeleteThread = (threadId) => {
        setThreads(prev => prev.filter(thread => thread.id !== threadId));
        
        // If the deleted thread was active, clear the selection
        if (activeThreadId === threadId) {
            // Could trigger a callback to clear the active thread
        }
    };

    const handleRenameThread = (threadId, newTitle) => {
        setThreads(prev => prev.map(thread =>
            thread.id === threadId 
                ? { ...thread, title: newTitle }
                : thread
        ));
    };

    const sidebarVariants = {
        open: {
            x: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        },
        closed: {
            x: "-100%",
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 30
            }
        }
    };

    return (
        <>
            {/* Overlay for mobile */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <motion.div
                variants={sidebarVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                className="fixed left-20 top-16 h-[calc(100vh-4rem)] w-80 bg-white border-r border-gray-200 shadow-lg z-50 flex flex-col"
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="lg:hidden"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* New Thread Button */}
                    <Button
                        onClick={handleNewThread}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-3"
                        size="sm"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        New Conversation
                    </Button>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* Thread List */}
                <ScrollArea className="flex-1">
                    <div className="p-2">
                        {filteredThreads.length > 0 ? (
                            filteredThreads.map((thread) => (
                                <ThreadItem
                                    key={thread.id}
                                    thread={thread}
                                    isActive={activeThreadId === thread.id}
                                    onClick={() => onThreadSelect(thread)}
                                    onDelete={() => handleDeleteThread(thread.id)}
                                    onRename={(newTitle) => handleRenameThread(thread.id, newTitle)}
                                />
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                {searchQuery ? 'No conversations found' : 'No conversations yet'}
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200">
                    <div className="text-xs text-gray-500 text-center">
                        {threads.length} conversation{threads.length !== 1 ? 's' : ''}
                    </div>
                </div>
            </motion.div>
        </>
    );
};

export default ChatThreadSidebar;

