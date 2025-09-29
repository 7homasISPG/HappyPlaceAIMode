// src/pages/Studio/FlowEditor/TestChatModal.jsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, Terminal, Send } from 'lucide-react';

const TestChatModal = ({ isOpen, onClose, onSend, isLoading, response, error }) => {
  const [message, setMessage] = useState('Hello, can you help me?');

  const handleSendClick = () => {
    if (message.trim()) {
      onSend(message);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Test Chat Trigger</DialogTitle>
          <DialogDescription>
            Send a sample message to your workflow's chat trigger endpoint.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="test-message">User Message</Label>
            <div className="flex items-center gap-2">
              <Input
                id="test-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your test message..."
                disabled={isLoading}
              />
              <Button onClick={handleSendClick} disabled={isLoading || !message.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="grid gap-2 mt-4">
            <Label>API Response</Label>
            <div className="bg-gray-900 text-white font-mono text-sm rounded-lg p-4 h-40 overflow-y-auto">
              {isLoading && <p className="text-gray-400">Sending request...</p>}
              {error && <pre className="text-red-400 whitespace-pre-wrap">{`Error: ${error}`}</pre>}
              {response && <pre className="text-green-400 whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>}
              {!isLoading && !error && !response && <p className="text-gray-400">Response from the server will appear here.</p>}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TestChatModal;