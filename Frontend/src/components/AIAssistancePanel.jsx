import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Bot } from 'lucide-react';

// --- Reusable UI Components ---

const Expander = ({ title, children, defaultOpen = true, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 text-left text-gray-800 transition-colors hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="h-5 w-5 text-blue-600" />}
          <span className="font-semibold">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
      </button>
      {isOpen && <div className="p-6 border-t border-gray-200">{children}</div>}
    </div>
  );
};

const TaskManager = ({ tasks, onTasksChange }) => {
    const addTask = () => {
        const defaultSchema = JSON.stringify({ type: 'object', properties: {}, required: [] }, null, 2);
        const newTask = { name: '', description: '', endpoint: '', params_schema: defaultSchema };
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
                        <button type="button" onClick={() => removeTask(index)} className="p-1 text-red-500 hover:bg-red-100 rounded-full">
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
                     <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Parameters Schema (JSON)</label>
                        <textarea value={task.params_schema} onChange={(e) => updateTask(index, 'params_schema', e.target.value)} rows={5} placeholder="Enter a valid JSON schema" className="w-full bg-white p-2 rounded-md border border-gray-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 transition"/>
                    </div>
                </div>
            ))}
            <button type="button" onClick={addTask} className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 hover:border-gray-400 transition">
                <Plus className="h-4 w-4" /> Add Tool
            </button>
        </div>
    );
};

// --- Main Agent Assistance Panel ---

const AIAssistancePanel = () => {
  const defaultParamsSchema = JSON.stringify({
    type: "object",
    properties: {
      category: { type: "string", description: "The category of APIs, e.g., 'Animals'" }
    },
    required: ["category"]
  }, null, 2);

  const [agents, setAgents] = useState([
    {
      id: Date.now(),
      name: "APISearchAgent",
      system_message: "You are an expert at finding public APIs. You must use the tools provided to find APIs based on an orchestrator's request.",
      tasks: [
        { name: "search_apis_by_category", description: "Fetches public APIs in a specific category.", endpoint: "https://api.publicapis.org/entries", params_schema: defaultParamsSchema },
      ]
    }
  ]);

  // --- Handlers for Agent Configuration ---
  const updateAgent = (id, field, value) => {
    setAgents(agents.map(agent => 
      agent.id === id ? { ...agent, [field]: value } : agent
    ));
  };
  
  const handleAgentTasksChange = (id, newTasks) => {
    setAgents(agents.map(agent =>
      agent.id === id ? { ...agent, tasks: newTasks } : agent
    ));
  };

  const addAgent = () => {
    setAgents([
      ...agents,
      { id: Date.now(), name: "", system_message: "", tasks: [] },
    ]);
  };

  const removeAgent = (id) => {
    if (agents.length > 1) {
      setAgents(agents.filter(agent => agent.id !== id));
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-bold text-slate-800">AI Assistance Panel</h1>
          <p className="text-gray-600 mt-2">Configure a team of tool-enabled AI assistant agents.</p>
        </header>
        
        <Expander title="Configure Assistant Agent Team" icon={Bot} defaultOpen={true}>
            <div className="space-y-6">
                {agents.map((agent) => (
                    <div key={agent.id} className="border border-gray-200 rounded-lg bg-white shadow-sm p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg text-gray-800">{agent.name || "New Agent"}</h3>
                            {agents.length > 1 && (
                                <button onClick={() => removeAgent(agent.id)} className="p-1 text-red-500 hover:bg-red-100 rounded-full"><Trash2 size={16} /></button>
                            )}
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Agent Name</label>
                                <input type="text" value={agent.name} onChange={(e) => updateAgent(agent.id, 'name', e.target.value)} placeholder="e.g., ResearchAgent" className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">System Message (Role)</label>
                                <textarea value={agent.system_message} onChange={(e) => updateAgent(agent.id, 'system_message', e.target.value)} placeholder="Define this agent's expertise..." rows={3} className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-3">Available Tools</label>
                                <TaskManager tasks={agent.tasks} onTasksChange={(newTasks) => handleAgentTasksChange(agent.id, newTasks)} />
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={addAgent} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition">
                    <Plus size={18} /> Add Assistant Agent
                </button>
            </div>
        </Expander>
      </div>
    </div>
  );
};

export default AIAssistancePanel;