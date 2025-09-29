import React from 'react';
import SuggestionChips from './SuggestionChips';
import FAQGrid from './FAQGrid';
import ChatInput from './ChatInput';

const InitialView = ({ onSendMessage, input, setInput, onFileUpload, fileInputRef, isLoading }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-full py-8">
            {/* Heading */}
            <h1 className="text-4xl font-medium text-gray-900 mb-6 text-center">
                What can I help with?
            </h1>

            {/* Chat Input */}
            <div className="w-full max-w-3xl mb-6">
                <ChatInput
                    input={input}
                    setInput={setInput}
                    onSendMessage={onSendMessage}
                    onFileUpload={onFileUpload}
                    fileInputRef={fileInputRef}
                    isLoading={isLoading}
                />
            </div>

            {/* Suggestions and FAQs */}
            <div className="w-full max-w-4xl space-y-8">
                <SuggestionChips onSendMessage={onSendMessage} />
                <FAQGrid onSendMessage={onSendMessage} />
            </div>
        </div>
    );
};

export default InitialView;

