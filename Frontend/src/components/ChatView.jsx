import React from 'react';
import MessageList from './MessageList';

const ChatView = ({ messages, isLoading, onSendMessage, messagesEndRef }) => {
    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            <MessageList 
                messages={messages}
                isLoading={isLoading}
                onSendMessage={onSendMessage}
                messagesEndRef={messagesEndRef}
            />
        </div>
    );
};

export default ChatView;

