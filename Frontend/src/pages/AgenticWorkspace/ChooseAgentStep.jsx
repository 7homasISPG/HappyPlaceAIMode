import React, { useState } from 'react';

const agentTemplates = {
    'Customer Support': 'You are a friendly and efficient customer support agent. Your goal is to resolve user issues and provide clear guidance.',
    'Brand AI Assistant': 'You are a brand ambassador AI. Your personality is enthusiastic and knowledgeable about the brand. Help customers with brand-related queries.',
    'Product Recommendation': 'You are an expert product recommender. Analyze user needs and suggest the most relevant items from the catalog.',
};

const ChooseAgentStep = ({ onNext, initialData }) => {
    const [name, setName] = useState(initialData.name);
    const [system_message, setSystemMessage] = useState(initialData.system_message);

    const selectTemplate = (templateName) => {
        setName(templateName);
        setSystemMessage(agentTemplates[templateName]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onNext({ name, system_message });
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-center mb-1">Choose an agent</h2>
            <p className="text-center text-gray-500 mb-6">This will configure how your bot behaves.</p>
            
            <div className="space-y-4 mb-6">
                {Object.keys(agentTemplates).map(key => (
                    <button key={key} type="button" onClick={() => selectTemplate(key)} className="w-full text-left p-4 border rounded-lg hover:bg-gray-100">
                        <h3 className="font-semibold">{key}</h3>
                        <p className="text-sm text-gray-600">{agentTemplates[key].substring(0, 70)}...</p>
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Agent Name</label>
                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div className="mb-6">
                    <label htmlFor="persona" className="block text-sm font-medium text-gray-700">Agent Persona / System Message</label>
                    <textarea id="persona" value={system_message} onChange={e => setSystemMessage(e.target.value)} required rows="4" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">
                    Next
                </button>
            </form>
        </div>
    );
};

// --- THIS IS THE FIX ---
export default ChooseAgentStep;