import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
    MessageSquare, 
    MoreHorizontal, 
    Edit3, 
    Trash2, 
    Check, 
    X 
} from 'lucide-react';

const ThreadItem = ({ 
    thread, 
    isActive, 
    onClick, 
    onDelete, 
    onRename 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editTitle, setEditTitle] = useState(thread.title);

    const formatTimestamp = (timestamp) => {
        const now = new Date();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return timestamp.toLocaleDateString();
    };

    const handleSaveEdit = () => {
        if (editTitle.trim() && editTitle !== thread.title) {
            onRename(editTitle.trim());
        }
        setIsEditing(false);
        setEditTitle(thread.title);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditTitle(thread.title);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSaveEdit();
        } else if (e.key === 'Escape') {
            handleCancelEdit();
        }
    };

    return (
        <div
            className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 mb-1 ${
                isActive 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'hover:bg-gray-50 border border-transparent'
            }`}
            onClick={!isEditing ? onClick : undefined}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 mr-2">
                    {isEditing ? (
                        <div className="flex items-center space-x-1">
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onKeyDown={handleKeyPress}
                                className="h-6 text-sm"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit();
                                }}
                                className="h-6 w-6 p-0"
                            >
                                <Check className="h-3 w-3 text-green-600" />
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCancelEdit();
                                }}
                                className="h-6 w-6 p-0"
                            >
                                <X className="h-3 w-3 text-red-600" />
                            </Button>
                        </div>
                    ) : (
                        <>
                            <h3 className={`text-sm font-medium truncate ${
                                isActive ? 'text-blue-900' : 'text-gray-900'
                            }`}>
                                {thread.title}
                            </h3>
                            {thread.lastMessage && (
                                <p className={`text-xs truncate mt-1 ${
                                    isActive ? 'text-blue-700' : 'text-gray-500'
                                }`}>
                                    {thread.lastMessage}
                                </p>
                            )}
                        </>
                    )}
                </div>

                {!isEditing && (
                    <div className="flex items-center space-x-1">
                        <div className="text-xs text-gray-400">
                            {formatTimestamp(thread.timestamp)}
                        </div>
                        
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="h-3 w-3" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                >
                                    <Edit3 className="mr-2 h-3 w-3" />
                                    Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="mr-2 h-3 w-3" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* Message count indicator */}
            {!isEditing && thread.messageCount > 0 && (
                <div className="flex items-center mt-2">
                    <MessageSquare className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-400">
                        {thread.messageCount} message{thread.messageCount !== 1 ? 's' : ''}
                    </span>
                </div>
            )}
        </div>
    );
};

export default ThreadItem;

