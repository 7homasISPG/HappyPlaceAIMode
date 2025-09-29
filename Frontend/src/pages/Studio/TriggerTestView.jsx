// src/pages/Studio/TriggerTestView.jsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Terminal } from 'lucide-react';
import { triggerChatMessage, triggerFormSubmission } from '@/api'; // Adjust path if needed

const TriggerTestView = () => {
    // State for Chat Trigger
    const [chatFlowId, setChatFlowId] = useState('flow_abc123');
    const [chatMessage, setChatMessage] = useState('Hello, I need help with my booking.');
    const [chatSessionId, setChatSessionId] = useState('session_xyz789');

    // State for Form Trigger
    const [formFlowId, setFormFlowId] = useState('flow_def456');
    const [formData, setFormData] = useState(JSON.stringify({
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        inquiry: 'I would like to know more about the premium course.'
    }, null, 2));

    // Common State
    const [apiKey, setApiKey] = useState('TEST_API_KEY_12345'); // Hardcoded for testing
    const [isLoading, setIsLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);

    const handleChatTrigger = async () => {
        setIsLoading(true);
        setResponse(null);
        setError(null);
        try {
            const payload = {
                flow_id: chatFlowId,
                message: chatMessage,
                session_id: chatSessionId,
                user_id: 'user_test_01'
            };
            const result = await triggerChatMessage(payload, apiKey);
            setResponse(result);
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFormTrigger = async () => {
        setIsLoading(true);
        setResponse(null);
        setError(null);

        let parsedFormData;
        try {
            parsedFormData = JSON.parse(formData);
        } catch (e) {
            setError('Invalid JSON in Form Data field.');
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                flow_id: formFlowId,
                form_data: parsedFormData
            };
            const result = await triggerFormSubmission(payload, apiKey);
            setResponse(result);
        } catch (err) {
            setError(err.response?.data?.detail || err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 sm:p-8 h-full bg-white flex flex-col overflow-y-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Trigger Endpoint Tester</h1>
                <p className="text-gray-500 mt-1">
                    Use this page to send test data to your workflow trigger API endpoints.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chat Trigger Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Chat Trigger</CardTitle>
                        <CardDescription>Sends data to <code>/api/trigger/chat_message</code></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="apiKey">X-Workflow-API-Key</Label>
                            <Input id="apiKey" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chatFlowId">Flow ID</Label>
                            <Input id="chatFlowId" value={chatFlowId} onChange={(e) => setChatFlowId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chatMessage">Message</Label>
                            <Input id="chatMessage" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="chatSessionId">Session ID (Optional)</Label>
                            <Input id="chatSessionId" value={chatSessionId} onChange={(e) => setChatSessionId(e.target.value)} />
                        </div>
                        <Button onClick={handleChatTrigger} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Send Chat Trigger
                        </Button>
                    </CardContent>
                </Card>

                {/* Form Trigger Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Test Form Trigger</CardTitle>
                        <CardDescription>Sends data to <code>/api/trigger/form_submission</code></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="formFlowId">Flow ID</Label>
                            <Input id="formFlowId" value={formFlowId} onChange={(e) => setFormFlowId(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="formData">Form Data (as JSON)</Label>
                            <Textarea id="formData" value={formData} onChange={(e) => setFormData(e.target.value)} rows={7} />
                        </div>
                        <Button onClick={handleFormTrigger} disabled={isLoading} className="w-full">
                            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                            Send Form Trigger
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Separator className="my-8" />

            {/* Response Viewer */}
            <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Terminal className="h-5 w-5 mr-2" /> API Response
                </h2>
                <div className="bg-gray-900 text-white font-mono text-sm rounded-lg p-4 h-48 overflow-y-auto">
                    {isLoading && <p>Sending request...</p>}
                    {error && <pre className="text-red-400 whitespace-pre-wrap">{`Error: ${error}`}</pre>}
                    {response && <pre className="text-green-400 whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>}
                    {!isLoading && !error && !response && <p className="text-gray-400">Response from the server will appear here.</p>}
                </div>
            </div>
        </div>
    );
};

export default TriggerTestView;