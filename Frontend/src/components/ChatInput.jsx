import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Paperclip, Mic, MicOff } from 'lucide-react';

const ChatInput = ({
    input,
    setInput,
    onSendMessage,
    onFileUpload,
    fileInputRef,
    isLoading,
    isAwaitingDemoDetails, // New prop to trigger demo details mode
    onSendDemoDetails     // New prop to handle demo details submission
}) => {
    // State for demo booking inputs
    const [serviceProduct, setServiceProduct] = useState('');
    const [preferredDateTime, setPreferredDateTime] = useState('');

    // State for voice recognition (existing)
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const tempTranscriptRef = useRef('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Check if we are in demo details mode
        if (isAwaitingDemoDetails) {
            if (serviceProduct.trim() && preferredDateTime.trim()) {
                onSendDemoDetails({ serviceProduct, preferredDateTime });
                // Clear demo form state after submission
                setServiceProduct('');
                setPreferredDateTime('');
            }
        } else {
            // Standard message sending logic
            if (!input.trim()) return;
            onSendMessage(input);
            setInput('');
        }
    };

    // Voice recording logic (unchanged)
    const startRecording = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;

        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            tempTranscriptRef.current = transcript.trim();
            setInput(transcript);
        };

        recognition.onend = () => {
            setIsRecording(false);
            if (tempTranscriptRef.current) {
                onSendMessage(tempTranscriptRef.current);
                setInput('');
                tempTranscriptRef.current = '';
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            setIsRecording(false);
        };

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    };

    const toggleRecording = () => {
        if (isRecording) stopRecording();
        else startRecording();
    };

    // Logic for the send button's disabled state
    const isSendButtonDisabled = isLoading ||
        (isAwaitingDemoDetails && (!serviceProduct.trim() || !preferredDateTime.trim())) ||
        (!isAwaitingDemoDetails && !input.trim());


    return (
        <Card className="shadow-lg border border-gray-200">
            <CardContent className="p-3">
                <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                    {isAwaitingDemoDetails ? (
                        // --- DEMO DETAILS VIEW ---
                        <div className="flex-1 flex flex-col sm:flex-row items-center gap-2">
                            <Input
                                type="text"
                                placeholder="Service/Product (e.g., 'Cloud Migration')"
                                value={serviceProduct}
                                onChange={(e) => setServiceProduct(e.target.value)}
                                disabled={isLoading}
                                className="bg-gray-50 focus-visible:ring-blue-500"
                            />
                            <Input
                                type="datetime-local"
                                value={preferredDateTime}
                                onChange={(e) => setPreferredDateTime(e.target.value)}
                                disabled={isLoading}
                                className="bg-gray-50 focus-visible:ring-blue-500"
                            />
                        </div>
                    ) : (
                        // --- REGULAR CHAT VIEW ---
                        <>
                            {/* Attach File */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                className="text-gray-600 hover:text-gray-800 px-3"
                                disabled={isLoading}
                            >
                                <Paperclip className="h-4 w-4 mr-1" />
                                Attach
                            </Button>

                            {/* Text Input */}
                            <div className="flex-1">
                                <Input
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder="Ask Anything"
                                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                                    disabled={isLoading}
                                />
                            </div>

                            {/* Mic Button */}
                            <Button
                                type="button"
                                variant={isRecording ? 'destructive' : 'ghost'}
                                size="sm"
                                onClick={toggleRecording}
                                disabled={isLoading}
                                className="p-2"
                                title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
                            >
                                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                            </Button>
                        </>
                    )}

                    {/* Send Button (Common to both views) */}
                    <Button
                        type="submit"
                        size="sm"
                        disabled={isSendButtonDisabled}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2"
                        title={isAwaitingDemoDetails ? "Submit Demo Details" : "Send Message"}
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <Send className="h-4 w-4" />
                        )}
                    </Button>
                </form>

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileUpload}
                    className="hidden"
                />
            </CardContent>
        </Card>
    );
};

export default ChatInput;