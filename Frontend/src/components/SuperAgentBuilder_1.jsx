import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronUp, Bot, User, Send, Loader2, Plus, Trash2,
  Brain, Zap, Settings, Save, Upload
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '../contexts/AuthContext'; // <-- Import the authentication hook
import { saveAssistantsConfig, askQuestion, getWebSocketUrl } from '../api'; // <-- Import our API functions

// --- Reusable UI Components ---

const Expander = ({ title, children, defaultOpen = true, icon: Icon = Settings }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <Card className="mb-6 border-border bg-card-secondary">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-primary" />
          <span className="font-semibold text-card-foreground">{title}</span>
        </div>
        {isOpen ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
      </button>
      {isOpen && (
        <div className="border-t border-border">
          <div className="p-6">{children}</div>
        </div>
      )}
    </Card>
  );
};

const ChatMessage = ({ sender, content, role }) => {
  const isUser = sender === 'UserProxy' || role === 'user';
  const isSupervisor = sender === 'Supervisor';
  const Icon = isUser ? User : Bot;
  
  let bgClass = "bg-muted";
  let textClass = "text-foreground";
  let avatarClass = "bg-muted-foreground";
  
  if (isUser) {
    bgClass = "bg-primary"; textClass = "text-primary-foreground"; avatarClass = "bg-primary";
  } else if (isSupervisor) {
    bgClass = "bg-purple-600"; textClass = "text-white"; avatarClass = "bg-purple-600";
  } else {
    bgClass = "bg-secondary"; textClass = "text-secondary-foreground"; avatarClass = "bg-secondary-foreground";
  }

  const alignment = isUser ? 'justify-end' : 'justify-start';
  const senderName = isUser ? 'You' : sender || 'Assistant';

  return (
    <div className={`flex items-end gap-3 my-4 ${alignment}`}>
      {!isUser && (
        <div className={`flex-shrink-0 w-8 h-8 ${avatarClass} rounded-full flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      )}
      <div className="max-w-xl">
        <p className={`text-xs text-muted-foreground mb-1 ${isUser ? 'text-right' : 'text-left'}`}>
          {senderName}
        </p>
        <div className={`px-4 py-3 rounded-xl ${bgClass} ${textClass} shadow-md`}>
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </div>
      {isUser && (
        <div className={`flex-shrink-0 w-8 h-8 ${avatarClass} rounded-full flex items-center justify-center`}>
          <Icon size={16} className="text-white" />
        </div>
      )}
    </div>
  );
};

const TaskManager = ({ tasks, onTasksChange }) => {
  // ... (Your TaskManager component code is fine and does not need changes)
    const handleTaskChange = (taskIndex, field, value) => {
    const newTasks = [...tasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };
    onTasksChange(newTasks);
  };
  
  const addTask = () => {
    const newTask = {
      name: '',
      description: '',
      endpoint: '',
      params_schema: { type: 'object', properties: {}, required: [] },
    };
    onTasksChange([...tasks, newTask]);
  };

  const removeTask = (index) => onTasksChange(tasks.filter((_, i) => i !== index));
  
  const addParameter = (taskIndex) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    const newParamName = `param${Object.keys(newTasks[taskIndex].params_schema.properties).length + 1}`;
    newTasks[taskIndex].params_schema.properties[newParamName] = { type: 'string', description: '' };
    onTasksChange(newTasks);
  };

  const removeParameter = (taskIndex, paramName) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    delete newTasks[taskIndex].params_schema.properties[paramName];
    newTasks[taskIndex].params_schema.required = newTasks[taskIndex].params_schema.required.filter((p) => p !== paramName);
    onTasksChange(newTasks);
  };
  
  const handleParamChange = (taskIndex, oldParamName, newParamName, field, value) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    const { properties, required } = newTasks[taskIndex].params_schema;
    const paramData = properties[oldParamName];

    if (field === 'name') {
        delete properties[oldParamName];
        properties[newParamName] = paramData;
        if(required.includes(oldParamName)) {
            newTasks[taskIndex].params_schema.required = required.map(p => p === oldParamName ? newParamName : p);
        }
    } else {
        properties[oldParamName][field] = value;
    }
    onTasksChange(newTasks);
  };
  
  const handleRequiredChange = (taskIndex, paramName, isChecked) => {
    const newTasks = JSON.parse(JSON.stringify(tasks));
    const { required } = newTasks[taskIndex].params_schema;
    if(isChecked && !required.includes(paramName)) required.push(paramName);
    else if (!isChecked) newTasks[taskIndex].params_schema.required = required.filter(p => p !== paramName);
    onTasksChange(newTasks);
  };

  return (
    <div className="space-y-4">
      {(tasks || []).map((task, taskIndex) => (
        <Card key={taskIndex} className="border-border bg-muted/30 overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tool {taskIndex + 1}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => removeTask(taskIndex)} className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Tool details */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label htmlFor={`task-name-${taskIndex}`} className="text-sm">Function Name</Label><Input id={`task-name-${taskIndex}`} value={task.name} onChange={(e) => handleTaskChange(taskIndex, 'name', e.target.value)} placeholder="e.g., search_apis" className="bg-background border-border" /></div>
              <div><Label htmlFor={`task-endpoint-${taskIndex}`} className="text-sm">API Endpoint</Label><Input id={`task-endpoint-${taskIndex}`} value={task.endpoint} onChange={(e) => handleTaskChange(taskIndex, 'endpoint', e.target.value)} placeholder="https://api.example.com/data" className="bg-background border-border" /></div>
            </div>
            <div><Label htmlFor={`task-description-${taskIndex}`} className="text-sm">Description</Label><Input id={`task-description-${taskIndex}`} value={task.description} onChange={(e) => handleTaskChange(taskIndex, 'description', e.target.value)} placeholder="What this tool does..." className="bg-background border-border" /></div>
            <Separator className="my-4" />
            {/* Parameters */}
            <div>
                <Label className="text-sm font-medium mb-2 block">Parameters</Label>
                <div className="space-y-3">
                    {Object.entries(task.params_schema.properties).map(([paramName, paramSchema]) => (
                        <div key={paramName} className="p-3 bg-background rounded-md border border-border grid grid-cols-12 gap-2 items-center">
                            <div className="col-span-3"><Input value={paramName} onChange={(e) => handleParamChange(taskIndex, paramName, e.target.value, 'name', e.target.value)} placeholder="param_name" className="h-8"/></div>
                            <div className="col-span-3">
                                <Select value={paramSchema.type} onValueChange={(value) => handleParamChange(taskIndex, paramName, paramName, 'type', value)}>
                                    <SelectTrigger className="h-8"><SelectValue placeholder="Type" /></SelectTrigger>
                                    <SelectContent><SelectItem value="string">String</SelectItem><SelectItem value="number">Number</SelectItem><SelectItem value="boolean">Boolean</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-4"><Input value={paramSchema.description} onChange={(e) => handleParamChange(taskIndex, paramName, paramName, 'description', e.target.value)} placeholder="Description" className="h-8"/></div>
                            <div className="col-span-1 flex items-center justify-center gap-2"><Checkbox id={`required-${taskIndex}-${paramName}`} checked={task.params_schema.required.includes(paramName)} onCheckedChange={(checked) => handleRequiredChange(taskIndex, paramName, checked)} /><Label htmlFor={`required-${taskIndex}-${paramName}`} className="text-xs">Req</Label></div>
                            <div className="col-span-1"><Button variant="ghost" size="icon" onClick={() => removeParameter(taskIndex, paramName)} className="h-8 w-8 text-destructive/70 hover:text-destructive"><Trash2 className="h-4 w-4"/></Button></div>
                        </div>
                    ))}
                    <Button onClick={() => addParameter(taskIndex)} variant="outline" size="sm" className="w-full border-dashed"><Plus className="h-4 w-4 mr-2" />Add Parameter</Button>
                </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <Button onClick={addTask} variant="outline" className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/10">
        <Plus className="h-4 w-4 mr-2" />
        Add Tools
      </Button>
    </div>
  );
};


// --- Main Super Agent Builder Component ---
const SuperAgentBuilder = () => {
  const { isAuthenticated } = useAuth(); // <<< Get authentication state
  
  // --- STATE ---
  const [profile, setProfile] = useState({
    prompt: 'Find public APIs related to animals and tell me the name of the first one.',
    supervisor_system_message: 'You are the Supervisor. Coordinate assistants step-by-step to complete the task. Ask the user for clarification if needed. End with TERMINATE.',
    max_turns: 16
  });

  const [assistants, setAssistants] = useState([
    { name: 'APISearchAgent', system_message: 'You are an expert at finding public APIs.', tasks: [] }
  ]);
  
  const [isRunning, setIsRunning] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const ws = useRef(null);
  const chatContainerRef = useRef(null);

  // --- EFFECTS ---
  useEffect(() => {
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatHistory]);
  
  useEffect(() => {
    return () => ws.current?.close(); // Cleanup WebSocket on unmount
  }, []);

  // --- HANDLERS ---
  const handleProfileChange = (field, value) => setProfile(p => ({ ...p, [field]: value }));
  const addAssistant = () => setAssistants([...assistants, { name: '', system_message: '', tasks: [] }]);
  const updateAssistant = (index, updates) => {
    const newAssistants = [...assistants];
    newAssistants[index] = { ...newAssistants[index], ...updates };
    setAssistants(newAssistants);
  };
  const removeAssistant = (index) => {
    if (assistants.length > 1) setAssistants(assistants.filter((_, i) => i !== index));
  };
  
  const saveConfiguration = async () => {
    if (!isAuthenticated) {
        alert("Please log in to save configurations.");
        return;
    }
    setIsSaving(true);
    try {
        const response = await saveAssistantsConfig(assistants);
        alert(response.message || "Configuration saved successfully!");
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        setIsSaving(false);
    }
  };

  const launchSuperAgent = async () => {
    if (!isAuthenticated) {
        alert("Please log in to run agents.");
        return;
    }
    if (!profile.prompt.trim()) {
        alert("Please enter a prompt to start.");
        return;
    }
    
    setIsLoading(true);
    setChatHistory([]);
    setIsRunning(true);

    const payload = {
        query: profile.prompt,
        assistants: assistants.filter(a => a.name.trim() && a.system_message.trim()),
    };
    
    try {
        const responseData = await askQuestion(payload.query, 'en', null, payload.assistants);
        setSessionId(responseData.session_id);

        if (responseData.type === 'interactive_session_start') {
            connectWebSocket(responseData.session_id);
        } else {
            // Handle non-interactive response (e.g., direct RAG answer)
            const assistantMessage = { sender: 'Assistant', content: responseData.text, role: 'assistant' };
            setChatHistory([assistantMessage]);
            setIsLoading(false);
            setIsRunning(false); // End run if it wasn't interactive
        }
    } catch (error) {
        alert(`Error starting agent run: ${error.message}`);
        setIsLoading(false);
        setIsRunning(false);
    }
  };

  const connectWebSocket = (newSessionId) => {
    try {
        const url = getWebSocketUrl(newSessionId);
        ws.current = new WebSocket(url);
    } catch (error) {
        alert(`Authentication error: ${error.message}`);
        setIsLoading(false);
        setIsRunning(false);
        return;
    }

    ws.current.onopen = () => setIsLoading(false);
    ws.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        const newMsg = { sender: msg.sender, content: msg.text, role: 'assistant' };
        setChatHistory(prev => [...prev, newMsg]);
    };
    ws.current.onclose = () => {
        const endMsg = { sender: 'System', content: 'Interactive session ended.', role: 'system' };
        setChatHistory(prev => [...prev, endMsg]);
    };
    ws.current.onerror = () => alert('WebSocket connection error.');
  };
  
  const handleUserReply = () => {
    if (!userInput.trim() || !ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    const userMsg = { sender: 'UserProxy', content: userInput, role: 'user' };
    setChatHistory(prev => [...prev, userMsg]);
    ws.current.send(userInput);
    setUserInput('');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Assistant Agent Builder</h1>
          <p className="text-muted-foreground text-lg">Configure and orchestrate a team of specialized AI agents.</p>
        </div>

        {!isRunning ? (
          <>
            {/* Mission Prompt */}
            <Expander title="Mission Prompt" icon={Zap} defaultOpen={true}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="prompt">Goal for the Agent Team</Label>
                  <Textarea id="prompt" value={profile.prompt} onChange={(e) => handleProfileChange('prompt', e.target.value)} placeholder="e.g., Find the top 3 animal-related public APIs..." className="bg-background border-border min-h-[80px]" />
                </div>
              </div>
            </Expander>
            
            {/* Agent Configuration */}
            <Expander title="Agent Team Configuration" icon={Bot} defaultOpen={true}>
              <div className="space-y-6">
                {(assistants || []).map((assistant, index) => (
                  <Card key={index} className="border-border bg-card">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{assistant.name || `Assistant ${index + 1}`}</CardTitle>
                        {assistants.length > 1 && <Button variant="ghost" size="sm" onClick={() => removeAssistant(index)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div><Label htmlFor={`agent-name-${index}`}>Agent Name</Label><Input id={`agent-name-${index}`} value={assistant.name} onChange={(e) => updateAssistant(index, { name: e.target.value })} placeholder="e.g., APISearchAgent" className="bg-background border-border" /></div>
                      <div><Label htmlFor={`agent-message-${index}`}>System Message</Label><Textarea id={`agent-message-${index}`} value={assistant.system_message} onChange={(e) => updateAssistant(index, { system_message: e.target.value })} placeholder="Define specialization..." className="bg-background border-border" /></div>
                      <Separator />
                      <div><Label className="mb-3 block">Available Tools</Label><TaskManager tasks={assistant.tasks || []} onTasksChange={(tasks) => updateAssistant(index, { tasks })} /></div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addAssistant} variant="outline" className="w-full border-dashed"><Plus className="h-4 w-4 mr-2" />Add Assistant Agent</Button>
              </div>
            </Expander>

            {/* Launch Section */}
            <div className="text-center mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button onClick={saveConfiguration} disabled={isSaving || !isAuthenticated} size="lg" variant="outline"><Save className="mr-2 h-5 w-5" />{isSaving ? 'Saving...' : 'Save Configuration'}</Button>
              <Button onClick={launchSuperAgent} disabled={isLoading || !isAuthenticated} size="lg"><Zap className="mr-2 h-5 w-5" />{isLoading ? 'Initializing...' : 'Launch Agent Team'}</Button>
            </div>
            {!isAuthenticated && <p className="text-center text-sm text-destructive mt-4">Please log in to save or launch agents.</p>}
          </>
        ) : (
           <Card className="border-border bg-card shadow-lg">
            <CardHeader className="border-b border-border">
              <div className="flex justify-between items-center">
                <div><CardTitle className="text-xl">Agent Team Execution</CardTitle><CardDescription className="mt-1">Problem-solving in progress</CardDescription></div>
                <Button onClick={() => setIsRunning(false)} variant="outline" size="sm">← Back to Configuration</Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
                <div ref={chatContainerRef} className="h-[60vh] overflow-y-auto pr-4 space-y-4">
                  {chatHistory.map((msg, index) => <ChatMessage key={index} sender={msg.sender} content={msg.content} role={msg.role} />)}
                  {isLoading && <div className="text-center text-muted-foreground">Waiting for agent...</div>}
                </div>
                {/* User Reply Box */}
                <div className="border-t border-border p-4 flex gap-2 items-center">
                  <Input placeholder="Type your reply..." value={userInput} onChange={(e) => setUserInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleUserReply()} />
                  <Button onClick={handleUserReply}><Send className="h-4 w-4 mr-2" />Send</Button>
                </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SuperAgentBuilder;