// src/pages/AgenticWorkspace/ChatflowCard.jsx
import React from 'react';
import { Trash2, MessageCircle } from 'lucide-react';

const ChatflowCard = ({ chatflow, onSelect, onDelete }) => {
  return (
    <div className="p-6 bg-white border rounded-xl shadow hover:shadow-md transition cursor-pointer relative">
      <div onClick={onSelect}>
        <MessageCircle className="h-8 w-8 text-blue-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-800">{chatflow.name}</h3>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2">{chatflow.description}</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation(); // Prevent triggering onSelect
          onDelete();
        }}
        className="absolute top-4 right-4 text-gray-400 hover:text-red-500"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ChatflowCard;
