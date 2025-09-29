// SuperAgentProfile.jsx

import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronUp, Bot, User, Send, Loader2, Plus, Trash2, Brain, Zap, Settings
} from 'lucide-react';

// --- Reusable UI Components (Inspired by AgentBuilder.jsx) ---

// A reusable component for the collapsible card section
const Expander = ({ title, children, defaultOpen = true, icon: Icon = Settings }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left text-gray-800 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
      </button>
      {isOpen && <div className="p-6 border-t border-gray-200">{children}</div>}
    </div>
  );
};

// Component for managing an agent's tools (tasks)
const TaskManager = ({ tasks, onTasksChange }) => {
  const addTask = () => {
    const newTask = {
      name: '',
      description: '',
      endpoint: '',
      params_schema: { type: 'object', properties: {}, required: [] }
    };
    onTasksChange([...tasks, newTask]);
  };

  const updateTask = (index, field, value) => {
    const newTasks = [...tasks];
    newTasks[index][field] = value;
    onTasksChange(newTasks);
  };

  const removeTask = (index) => {
    onTasksChange(tasks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div key={index} className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-700">Tool {index + 1}</h4>
              <button
                type="button" onClick={() => removeTask(index)}
                className="p-1 text-red-500 hover:bg-red-100 rounded-full"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Function Name</label>
                    <input type="text" value={task.name} onChange={(e) => updateTask(index, 'name', e.target.value)} placeholder="e.g., search_public_apis" className="w-full bg-white p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 transition"/>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">API Endpoint</label>
                    <input type="text" value={task.endpoint} onChange={(e) => updateTask(index, 'endpoint', e.target.value)} placeholder="https://api.example.com/search" className="w-full bg-white p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 transition"/>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={task.description} onChange={(e) => updateTask(index, 'description', e.target.value)} placeholder="A short description of what this tool does." className="w-full bg-white p-2 rounded-md border border-gray-300 focus:ring-2 focus:ring-blue-500 transition"/>
            </div>
        </div>
      ))}
      <button
        type="button" onClick={addTask}
        className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition"
      >
        <Plus className="h-4 w-4" /> Add Tool
      </button>
    </div>
  );
};


// Enhanced Chat Message Component
const ChatMessage = ({ sender, text, role }) => {
    const isUser = sender === 'UserProxy' || role === 'user';
    const isSupervisor = sender === 'Supervisor';
    
    let Icon, bgColor, textColor, alignment, avatarBg, senderName;

    if (isUser) {
        Icon = User;
        bgColor = 'bg-blue-600';
        textColor = 'text-white';
        alignment = 'justify-end';
        avatarBg = 'bg-blue-600';
        senderName = 'You';
    } else if (isSupervisor) {
        Icon = Brain;
        bgColor = 'bg-purple-600';
        textColor = 'text-white';
        alignment = 'justify-start';
        avatarBg = 'bg-purple-600';
        senderName = sender;
    } else { // Assistant Agent
        Icon = Bot;
        bgColor = 'bg-gray-200';
        textColor = 'text-gray-800';
        alignment = 'justify-start';
        avatarBg = 'bg-gray-500';
        senderName = sender;
    }

    return (
        <div className={`flex items-end gap-3 my-4 ${alignment}`}>
            {!isUser && <div className={`flex-shrink-0 w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center`}><Icon size={16} color="white" /></div>}
            <div className="max-w-2xl">
                 <p className={`text-xs text-gray-500 mb-1 ${isUser ? 'text-right' : 'text-left'}`}>{senderName}</p>
                 <div className={`px-4 py-3 rounded-xl shadow-md ${bgColor} ${textColor}`}>
                    <p className="whitespace-pre-wrap">{text}</p>
                 </div>
            </div>
            {isUser && <div className={`flex-shrink-0 w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center`}><Icon size={16} color="white"/></div>}
        </div>
    );
};


// --- Main Builder Component ---

const SuperAgentProfile = () => {
  const API_URL = "http://localhost:8000";

  // State for supervisor configuration and overall goal
  const [mission, setMission] = useState({
    supervisor_system_message: 'You are the Supervisor. Coordinate assistants step-by-step to complete the task. Ask the user for clarification if needed. End with TERMINATE.',
    initial_prompt: 'Find public APIs related to animals and tell me the name of the first one in the list.',
  });

  // State for the dynamic list of assistant agents
  const [assistants, setAssistants] = useState([
    {
      name: "APISearchAgent",
      system_message: "You are an expert at finding public APIs. Use your tools to search for APIs based on user queries.",
      tasks: [{
        name: "search_public_apis",
        description: "Search for public APIs by category or keyword.",
        endpoint: "https://api.publicapis.org/entries",
        params_schema: {
          type: "object",
          properties: { "category": { "type": "string", "description": "e.g., animals, books" } },
          required: ["category"]
        }
      }]
    }
  ]);

  // State for the interactive chat
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // --- Configuration Handlers ---

  const handleMissionChange = (e) => {
    const { name, value } = e.target;
    setMission(prev => ({ ...prev, [name]: value }));
  };

  const addAssistant = () => {
    setAssistants([...assistants, { name: '', system_message: '', tasks: [] }]);
  };

  const updateAssistant = (index, field, value) => {
    const newAssistants = [...assistants];
    newAssistants[index][field] = value;
    setAssistants(newAssistants);
  };
  
  const handleTasksChange = (agentIndex, newTasks) => {
      updateAssistant(agentIndex, 'tasks', newTasks);
  };

  const removeAssistant = (index) => {
    if (assistants.length > 1) {
      setAssistants(assistants.filter((_, i) => i !== index));
    }
  };

  // --- Chat Logic Handlers ---

  const handleStartChat = async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]);
    
    const validAssistants = assistants.filter(
        a => a.name.trim() && a.system_message.trim()
    );

    if (validAssistants.length === 0) {
        setError("Please configure at least one valid assistant with a name and system message.");
        setIsLoading(false);
        return;
    }

    const payload = {
      prompt: mission.initial_prompt,
      supervisor_system_message: mission.supervisor_system_message,
      assistants: validAssistants,
      max_turns: 15, // Can be made configurable
    };

    try {
      const response = await fetch(`${API_URL}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to start chat session.');
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setMessages(data.initial_messages);
      setIsChatStarted(true);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage = { sender: 'UserProxy', text: userInput, role: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/chat/${sessionId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userInput }),
      });
      
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to send message.');
      }

      const data = await response.json();
      setMessages(prev => [...prev, ...data.new_messages]);

    } catch (err) {
      setError(err.message);
      setUserInput(userMessage.text);
      setMessages(prev => prev.slice(0, -1)); 
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">AI Multi-Agent Builder</h1>
            <p className="text-gray-600">
            Configure and launch an interactive session with a team of AI agents.
            </p>
        </div>

        {!isChatStarted ? (
            <>
                <Expander title="Mission Control: Define Goal & Supervisor" icon={Zap} defaultOpen={true}>
                    <div className="mb-6">
                        <label htmlFor="initial_prompt" className="block text-sm font-medium text-gray-600 mb-1">Initial Goal / Prompt</label>
                        <textarea id="initial_prompt" name="initial_prompt" value={mission.initial_prompt} onChange={handleMissionChange} rows={3} className="w-full bg-slate-100 p-3 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white transition"/>
                    </div>
                    <div>
                        <label htmlFor="supervisor_system_message" className="block text-sm font-medium text-gray-600 mb-1">Supervisor Instructions</label>
                        <textarea id="supervisor_system_message" name="supervisor_system_message" value={mission.supervisor_system_message} onChange={handleMissionChange} rows={4} className="w-full bg-slate-100 p-3 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white transition"/>
                    </div>
                </Expander>
                
                <Expander title="Configure Agent Team" icon={Bot} defaultOpen={true}>
                    <div className="space-y-6">
                        {assistants.map((agent, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg bg-white shadow-sm p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-lg text-gray-800">Agent {index + 1}</h3>
                                    {assistants.length > 1 && (
                                        <button onClick={() => removeAssistant(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Agent Name</label>
                                        <input type="text" value={agent.name} onChange={(e) => updateAssistant(index, 'name', e.target.value)} placeholder="e.g., ResearchAgent" className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">System Message (Role)</label>
                                        <textarea value={agent.system_message} onChange={(e) => updateAssistant(index, 'system_message', e.target.value)} placeholder="Define this agent's expertise and instructions..." rows={3} className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-3">Available Tools</label>
                                        <TaskManager tasks={agent.tasks} onTasksChange={(newTasks) => handleTasksChange(index, newTasks)} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        <button onClick={addAssistant} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition">
                            <Plus size={18} /> Add Assistant Agent
                        </button>
                    </div>
                </Expander>

                <div className="mt-8 text-center">
                    <button 
                        onClick={handleStartChat}
                        disabled={isLoading}
                        className="w-full max-w-xs bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                    >
                        {isLoading ? <><Loader2 className="animate-spin mr-2" /> Starting Session...</> : "🚀 Launch Interactive Session"}
                    </button>
                    {error && <p className="text-red-500 mt-4">Error: {error}</p>}
                </div>
            </>
        ) : (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                <div className="p-4 border-b flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-700">Agent Conversation</h2>
                    <button onClick={() => setIsChatStarted(false)} className="text-sm text-blue-600 hover:underline">
                        &larr; Back to Configuration
                    </button>
                </div>
                
                <div ref={chatContainerRef} className="p-6 h-[60vh] overflow-y-auto bg-gray-50">
                    {messages.map((msg, index) => (
                        <ChatMessage key={index} sender={msg.sender} text={msg.text} role={msg.role} />
                    ))}
                    {isLoading && (
                        <div className="flex justify-start items-center gap-3 my-4">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center"><Bot size={18} color="white"/></div>
                            <div className="px-4 py-3 rounded-xl bg-gray-200 text-gray-800">
                                <Loader2 className="animate-spin" />
                            </div>
                        </div>
                    )}
                     {error && <p className="text-red-500 text-center my-4">Error: {error}</p>}
                </div>
                
                <div className="p-4 border-t bg-white">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Provide feedback or ask for clarification..."
                            className="flex-grow bg-slate-100 p-3 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                            disabled={isLoading}
                        />
                        <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default SuperAgentProfile;