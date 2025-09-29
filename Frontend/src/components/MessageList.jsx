import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Message from './Message';
import LoadingIndicator from './LoadingIndicator';
import { Pencil, Check, X } from 'lucide-react';

const MessageList = ({ messages, isLoading, onSendMessage, messagesEndRef }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editText, setEditText] = useState('');

    const handleEditClick = (index, content) => {
        setEditingIndex(index);
        setEditText(content);
    };

    const handleSave = (index) => {
        if (editText.trim()) {
            onSendMessage(editText);
        }
        setEditingIndex(null);
        setEditText('');
    };

    const handleCancel = () => {
        setEditingIndex(null);
        setEditText('');
    };

    return (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                >
                    {/* If editing this message */}
                    {editingIndex === index ? (
                        // Edit mode
                        <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded">
                            <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 border rounded p-2"
                                autoFocus
                            />
                            <button onClick={() => handleSave(index)} className="text-green-600 hover:text-green-800">
                                <Check size={18} />
                            </button>
                            <button onClick={handleCancel} className="text-red-600 hover:text-red-800">
                                <X size={18} />
                            </button>
                        </div>
                    ) : (
                        <>
                            <Message message={msg} onSendMessage={onSendMessage} />

                            {/* Timestamp */}
                            {msg.timestamp && (
                                <div className="text-xs text-gray-400 mt-1 ">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            )}

                            {/* Edit button only for user */}
                            {msg.role === 'user' && (
                                <button
                                    onClick={() => handleEditClick(index, msg.content.text || '')}
                                    className="absolute bottom-1 right-1 text-gray-500 hover:text-gray-800"
                                    title="Edit message"
                                >
                                    <Pencil size={14} />
                                </button>
                            )}
                        </>
                    )}

                </motion.div>
            ))}

            {isLoading && <LoadingIndicator />}

            <div ref={messagesEndRef} />
        </div>
    );
};

export default MessageList;
