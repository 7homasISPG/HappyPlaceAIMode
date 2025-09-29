import React from 'react';
import UserMessage from './UserMessage';
import AssistantMessage from './AssistantMessage';
import SystemMessage from './SystemMessage';

const Message = ({ message, onSendMessage }) => {
    const { role } = message;
    console.log("Rendering message with role:", role, "and content:", message.content);

    if (role === 'user') {
        return <UserMessage message={message} />;
    }
    
    if (role === 'assistant') {
        return <AssistantMessage message={message} onSendMessage={onSendMessage} />;
    }
        if (role === 'supervisor') {
        return <AssistantMessage message={message} onSendMessage={onSendMessage} />;
    }

    
    
    if (role === 'system') {
        return <SystemMessage message={message} />;
    }

    return null;
};

export default Message;

