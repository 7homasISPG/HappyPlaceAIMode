// src/pages/Studio/FlowEditor/TriggerPalette.jsx

import React, { useState } from 'react';
import { Search, X, MessageSquare, FormInput, Zap, Clock, Code, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Reusable Collapsible Section Component (copied from PaletteSidebar)
const CollapsibleSection = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const Icon = isOpen ? '▲' : '▼'; // Simple arrow icons

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        className="flex justify-between items-center w-full py-3 px-1 text-sm font-semibold text-gray-800 hover:bg-gray-100 transition-colors duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{title}</span>
        <span className="h-4 w-4 text-gray-500">{Icon}</span>
      </button>
      {isOpen && <div className="pt-2 pb-3 px-1 space-y-2">{children}</div>}
    </div>
  );
};


// This is a reusable component for each draggable trigger in the palette.
const DraggableTrigger = ({ type, label, icon: Icon, description, initialData = {}, onTriggerSelect }) => {
  const handleClick = () => {
    onTriggerSelect({ type, label, description, initialData });
  };

  return (
    <div
      className="p-3 mb-2 border rounded-lg cursor-pointer bg-white hover:bg-green-50 hover:border-green-400 transition-colors duration-200 shadow-sm"
      onClick={handleClick}
    >
      <div className="flex items-center">
        <Icon className="h-6 w-6 mr-3 text-gray-600 flex-shrink-0" />
        <div>
          <span className="font-semibold text-sm text-gray-800">{label}</span>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
};

const TriggerPalette = ({ onTriggerSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const triggerNodes = [
    {
      category: 'General',
      triggers: [
        {
          type: 'chatTriggerNode',
          label: 'On chat message',
          icon: MessageSquare,
          description: 'Runs the flow when a user sends a chat message. For use with AI nodes.',
          initialData: { nodeType: 'chatTrigger' }
        },
        {
          type: 'formTriggerNode',
          label: 'On form submission',
          icon: FormInput,
          description: 'Generate webforms and pass their responses to the workflow.',
          initialData: {
            nodeType: 'formTrigger',
            formTitle: 'New Form',
            formDescription: 'Fill out this form.',
            formElements: [],
            respondWhen: 'Submitted'
          }
        },
        { type: 'webhookTriggerNode', label: 'On webhook call', icon: Zap, description: 'Runs the flow on receiving an HTTP request.', initialData: { nodeType: 'webhookTrigger' } },
        { type: 'scheduleTriggerNode', label: 'On a schedule', icon: Clock, description: 'Runs the flow every day, hour, or custom interval.', initialData: { nodeType: 'scheduleTrigger' } },
        { type: 'apiTriggerNode', label: 'Trigger manually', icon: Code, description: 'Runs the flow on clicking a button in n8n. Good for getting started quickly', initialData: { nodeType: 'manualTrigger' } },
        { type: 'executedTriggerNode', label: 'When executed by another workflow', icon: Users, description: 'Runs the flow when called by the Execute Workflow node from a different workflow.', initialData: { nodeType: 'executedTrigger' } },
      ]
    },
    // Add more categories if needed
  ];

  const filteredTriggers = triggerNodes.map(cat => ({
    ...cat,
    triggers: cat.triggers.filter(trigger =>
      trigger.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trigger.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.triggers.length > 0);

  return (
    <aside className="absolute top-4 right-4 z-10 w-80 h-[calc(100%-32px)] flex flex-col p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <h3 className="text-lg font-bold mb-4 text-gray-900">What triggers this workflow?</h3>
      <p className="text-sm text-gray-600 mb-4">A trigger is a step that starts your workflow.</p>

      {/* Search Bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search triggers"
          className="pl-9 pr-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 text-gray-500 hover:bg-gray-200"
            onClick={() => setSearchTerm('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Collapsible Sections for Triggers */}
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
        {filteredTriggers.map((categoryData, catIdx) => (
          <div key={catIdx} className="mb-4">
            <CollapsibleSection title={categoryData.category} defaultOpen={true}>
              {categoryData.triggers.map((trigger, triggerIdx) => (
                <DraggableTrigger key={triggerIdx} {...trigger} onTriggerSelect={onTriggerSelect} />
              ))}
            </CollapsibleSection>
          </div>
        ))}
      </div>

      {onClose && ( // Optional close button for trigger palette if needed
        <Button variant="ghost" onClick={onClose} className="mt-4">
          Close
        </Button>
      )}
    </aside>
  );
};

export default TriggerPalette;