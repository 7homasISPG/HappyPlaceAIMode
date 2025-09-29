// SuperAgentBuilder.jsx
import React, { useState, useRef, useEffect } from "react";
import {
  ChevronDown, ChevronUp, Bot, User, Send, Loader2, Brain, Zap, Edit, CheckCircle, Save
} from 'lucide-react';

// --- Reusable UI Components (No changes) ---
const Expander = ({ title, children, defaultOpen = true, icon: Icon }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-200 rounded-lg bg-white shadow-sm mb-6">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 text-left text-gray-800 transition-colors hover:bg-gray-50">
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

const ChatMessage = ({ sender, text, role }) => {
  const isUser = sender === 'UserProxy' || role === 'user';
  const isSupervisor = sender === 'Supervisor';
  let Icon, bgColor, textColor, alignment, avatarBg, senderName;
  if (isUser) {
    Icon = User; bgColor = 'bg-blue-600'; textColor = 'text-white'; alignment = 'justify-end'; avatarBg = 'bg-blue-600'; senderName = 'You';
  } else if (isSupervisor) {
    Icon = Brain; bgColor = 'bg-purple-600'; textColor = 'text-white'; alignment = 'justify-start'; avatarBg = 'bg-purple-600'; senderName = sender;
  } else {
    Icon = Bot; bgColor = 'bg-gray-200'; textColor = 'text-gray-800'; alignment = 'justify-start'; avatarBg = 'bg-gray-500'; senderName = sender;
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
      {isUser && <div className={`flex-shrink-0 w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center`}><Icon size={16} color="white" /></div>}
    </div>
  );
};

// --- Super Agent Profile & Edit Modal ---
const SuperAgentEditModal = ({ isOpen, onClose, profile, onSave }) => {
  const [tempProfile, setTempProfile] = useState(profile);

  useEffect(() => {
    setTempProfile(profile);
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(tempProfile);
    onClose();
  };

  const personas = [
    { key: 'Polite', title: 'Polite and persuasive', desc: 'Ideal for sales agents' },
    { key: 'Empathetic', title: 'Empathetic and helpful', desc: 'Ideal for support agents' },
    { key: 'Witty', title: 'Witty', desc: 'Ideal for marketing agents' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Edit super agent profile</h2>
        <div className="space-y-4">
          
          {/* --- MODIFIED: Added Agent Name input --- */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Agent Name</label>
            <input 
              type="text" 
              value={tempProfile.name} 
              onChange={(e) => setTempProfile(p => ({ ...p, name: e.target.value }))} 
              className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition" 
            />
          </div>
          {/* --- End of modification --- */}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Model</label>
            <input type="text" value={tempProfile.model} onChange={(e) => setTempProfile(p => ({ ...p, model: e.target.value }))} className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Select a persona</label>
            <div className="grid grid-cols-3 gap-4">
              {personas.map(p => (
                <button key={p.key} onClick={() => setTempProfile(profile => ({ ...profile, persona: p.key }))} className={`relative p-4 border rounded-lg text-left transition ${tempProfile.persona === p.key ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-blue-400'}`}>
                  <h3 className="font-semibold text-gray-800">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.desc}</p>
                  {tempProfile.persona === p.key && <CheckCircle size={18} className="text-blue-500 absolute top-2 right-2" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Describe your AI agent's role</label>
            <textarea value={tempProfile.role} onChange={(e) => setTempProfile(p => ({ ...p, role: e.target.value }))} rows={5} className="w-full bg-slate-100 p-2 rounded-md border-transparent focus:ring-2 focus:ring-blue-500 transition" maxLength={400} />
            <p className="text-xs text-gray-400 text-right mt-1">{tempProfile.role.length} / 400</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
        </div>
      </div>
    </div>
  );
};

const SuperAgentConfig = ({ profile, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Expander title="Super Agent Profile" icon={Brain} defaultOpen={true}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {profile.name.charAt(0)}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
              <p className="text-sm text-gray-500"><strong>Model:</strong> {profile.model}</p>
              <p className="text-sm text-gray-500"><strong>Persona:</strong> {profile.persona}</p>
              <p className="text-sm text-gray-500 mt-2"><strong>My role:</strong></p>
              <p className="text-sm text-gray-700 max-w-xl">{profile.role}</p>
            </div>
          </div>
          <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 text-sm text-blue-600 font-medium hover:underline">
            <Edit size={14} /> Edit
          </button>
        </div>
      </Expander>
      <SuperAgentEditModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profile={profile}
        onSave={onUpdate}
      />
    </>
  );
};

// --- MAIN BUILDER COMPONENT (No other changes needed) ---
const SuperAgentBuilder = () => {
  const API_URL = "http://localhost:8000";

  const [supervisorProfile, setSupervisorProfile] = useState({
    name: 'Emma',
    model: 'gpt-4o-2024-08-06',
    persona: 'Witty',
    role: 'You are the Supervisor. Coordinate assistants step-by-step to complete the task. Ask the user for clarification if needed. End with TERMINATE.'
  });

  const [initialPrompt, setInitialPrompt] = useState('Find public APIs related to animals and tell me the name of the first one in the list.');

  const [isChatStarted, setIsChatStarted] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  const handleStartChat = async () => {
    setIsLoading(true);
    setError(null);
    setMessages([]);

    alert("Note: Interactive chat mode is deprecated. Please use the 'AI Agents' tab for the full run-to-completion experience.");
    
    const payload = {
      prompt: initialPrompt,
      supervisor_system_message: supervisorProfile.role,
      assistants: [],
      max_turns: 15,
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
      setMessages(data.initial_messages || []);
      setIsChatStarted(true);
    } catch (err) {
      setError(`Failed to start interactive chat. ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSaveProfile = async () => {
    setIsSaving(true);
    const payload = {
      name: supervisorProfile.name,
      model: supervisorProfile.model,
      persona: supervisorProfile.persona,
      supervisor_system_message: supervisorProfile.role,
      prompt: initialPrompt,
    };

    try {
      const response = await fetch(`${API_URL}/api/save-supervisor-profile/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Failed to save profile.');
      }
      await response.json();
      alert('Supervisor profile saved successfully to supervisor_profile.json on the server!');
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
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
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Super agent profile</h1>
          <p className="text-gray-600">Configure and save the properties of your main coordinating agent.</p>
        </div>

        {!isChatStarted ? (
          <>
            <SuperAgentConfig profile={supervisorProfile} onUpdate={setSupervisorProfile} />

            <Expander title="Mission Control: Define Initial Goal" icon={Zap} defaultOpen={true}>
              <label htmlFor="initial_prompt" className="block text-sm font-medium text-gray-600 mb-1">Initial Goal / Prompt for this run</label>
              <textarea id="initial_prompt" name="initial_prompt" value={initialPrompt} onChange={(e) => setInitialPrompt(e.target.value)} rows={3} className="w-full bg-slate-100 p-3 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
            </Expander>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    Save Profile
                  </>
                )}
              </button>
              
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg shadow-lg border border-gray-200">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-700">Agent Conversation</h2>
              <button onClick={() => setIsChatStarted(false)} className="text-sm text-blue-600 hover:underline">&larr; Back to Configuration</button>
            </div>
            <div ref={chatContainerRef} className="p-6 h-[60vh] overflow-y-auto bg-gray-50">
              {messages.map((msg, index) => (
                <ChatMessage key={index} sender={msg.sender} text={msg.text} role={msg.role} />
              ))}
              {isLoading && (
                <div className="flex justify-start items-center gap-3 my-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center"><Bot size={18} color="white" /></div>
                  <div className="px-4 py-3 rounded-xl bg-gray-200 text-gray-800"><Loader2 className="animate-spin" /></div>
                </div>
              )}
              {error && <p className="text-red-500 text-center my-4">Error: {error}</p>}
            </div>
            <div className="p-4 border-t bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <input type="text" value={userInput} onChange={(e) => setUserInput(e.e.target.value)} placeholder="Provide feedback or ask for clarification..." className="flex-grow bg-slate-100 p-3 rounded-lg border-transparent focus:ring-2 focus:ring-blue-500 focus:bg-white transition" disabled={isLoading} />
                <button type="submit" className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:bg-gray-400" disabled={isLoading}><Send size={20} /></button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAgentBuilder;