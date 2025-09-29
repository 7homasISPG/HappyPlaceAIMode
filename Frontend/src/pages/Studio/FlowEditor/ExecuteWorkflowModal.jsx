import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Send } from 'lucide-react'; // Changed Play to Send for better icon context

const ExecuteWorkflowModal = ({ isOpen, onClose, onExecute, isLoading, response, error }) => {
  const [chatHistory, setChatHistory] = useState([
    { type: 'ai', content: '👋 Hi! What would you like me to do?' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const chatContainerRef = useRef(null);

  // --- THIS IS THE FIX: A single, consolidated useEffect to handle responses and errors ---
  useEffect(() => {
    console.log('[DEBUG] Props updated:', { isOpen, isLoading, response, error });

    // Handle a new response from the backend
    if (response) {
      // The agent's message can be in 'result' (from workflow) or 'answer' (from /run_agent)
      const agentMessage = response.result || response.answer;
      
      if (agentMessage && typeof agentMessage === 'string') {
        console.log('[DEBUG] Received agent message:', agentMessage);
        setChatHistory((prevHistory) => [
          ...prevHistory,
          { type: 'ai', content: agentMessage }
        ]);
      }
    }

    // Handle an error from the backend
    if (error) {
      const errorMessage = error.detail || (typeof error === 'string' ? error : 'An unknown error occurred.');
      console.error('[DEBUG] Error from backend:', errorMessage);
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { type: 'ai', content: `⚠️ Error: ${errorMessage}` }
      ]);
    }
  }, [response, error]); // This hook runs only when response or error objects change

  // Auto-scroll to the bottom of the chat window when history changes
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // --- Send handler ---
  const handleSend = () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMsg = { type: 'human', content: currentMessage };
    
    // Pass the full, up-to-date chat history to the parent/hook
    const fullHistoryForBackend = [...chatHistory, userMsg];

    // Update local state to show the user's message immediately
    setChatHistory(fullHistoryForBackend);
    
    console.log('[DEBUG] Sending message:', currentMessage);
    console.log('[DEBUG] Full chat history being sent to backend:', fullHistoryForBackend);

    // Execute the API call with the message and the *previous* history for context
    onExecute({
      message: currentMessage,
      chat_history: chatHistory 
    });

    setCurrentMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Execute Agent</DialogTitle>
          <DialogDescription>
            Chat with your agent. The agent will ask for parameters if needed.
          </DialogDescription>
        </DialogHeader>

        {/* Chat Window */}
        <div 
          ref={chatContainerRef}
          className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 h-[350px] overflow-y-auto space-y-3 flex flex-col"
        >
          {chatHistory.map((msg, idx) => (
            <div
              key={idx}
              className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-wrap break-words ${
                msg.type === 'human'
                  ? 'bg-blue-500 text-white self-end ml-auto'
                  : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start mr-auto'
              }`}
            >
              {msg.content}
            </div>
          ))}
          {isLoading && (
            <div className="bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-3 py-2 rounded-lg text-sm inline-flex items-center space-x-2 self-start mr-auto">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex mt-3 space-x-2">
          <textarea
            className="flex-1 border rounded-lg px-3 py-2 text-sm resize-none dark:bg-gray-900 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isLoading}
            rows={1}
          />
          <Button onClick={handleSend} disabled={isLoading || !currentMessage.trim()}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span className="ml-2">Send</span>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExecuteWorkflowModal;