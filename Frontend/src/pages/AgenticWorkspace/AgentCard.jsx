import React from 'react';
import { motion } from 'framer-motion';
import { Bot, MoreVertical, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Assuming you use ShadCN UI

const AgentCard = ({ agent, onSelect, onDelete }) => {
    return (
        <motion.div
            onClick={onSelect}
            className="group relative bg-white border rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden"
            whileHover={{ y: -5 }}
        >
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <Bot className="h-6 w-6 text-blue-600" />
                    </div>
                    {/* Popover Menu for actions */}
                    <Popover>
                        <PopoverTrigger asChild>
                            <button 
                                onClick={(e) => e.stopPropagation()} // Prevents card's onSelect from firing
                                className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-40 p-2" align="end">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete();
                                }}
                                className="w-full flex items-center gap-2 text-left p-2 rounded-md text-sm text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete
                            </button>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="mt-4">
                    <h2 className="text-lg font-bold text-gray-800 truncate">{agent.name}</h2>
                    <p className="text-sm text-gray-500 h-10 mt-1 overflow-hidden">
                        {agent.system_message}
                    </p>
                </div>
            </div>
            {/* A subtle colored border at the bottom */}
            <div className="h-1 bg-blue-500" />
        </motion.div>
    );
};

// --- THIS IS THE FIX ---
export default AgentCard;