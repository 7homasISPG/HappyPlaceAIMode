// src/pages/Studio/FlowEditor/PaletteSidebar.jsx

import React from 'react';
import { Bot, Zap, Search, X, ChevronDown, ChevronUp, MemoryStick, PlusCircle } from 'lucide-react';
import { SiGooglecloud, SiOpenai } from "@icons-pack/react-simple-icons";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Reusable component for the collapsible sections (e.g., Agents, Tools)
const CollapsibleSection = ({ title, children, defaultOpen = false, onAddClick }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const Icon = isOpen ? ChevronUp : ChevronDown;

  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <div className="flex justify-between items-center w-full py-3 px-1 text-sm font-semibold text-gray-800">
        <button
          className="flex-grow flex items-center text-left hover:opacity-80 transition-opacity"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{title}</span>
          <Icon className="h-4 w-4 text-gray-500 ml-auto" />
        </button>
        {onAddClick && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 ml-2 text-gray-500 hover:bg-gray-200"
            onClick={onAddClick}
            title="Add or manage tools"
          >
            <PlusCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
      {isOpen && <div className="pt-2 pb-3 px-1 space-y-2">{children}</div>}
    </div>
  );
};

// Reusable component for each draggable node item in the palette
const DraggableNode = ({ type, label, icon: Icon, description, initialData = {} }) => {
    const onDragStart = (event, nodeType, nodeData) => {
        const dataToTransfer = JSON.stringify({
          type: nodeType,
          ...nodeData
        });
        event.dataTransfer.setData('application/reactflow', dataToTransfer);
        event.dataTransfer.effectAllowed = 'move';
      };
    
      return (
        <div
          className="p-3 mb-2 border rounded-lg cursor-grab bg-white hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 shadow-sm"
          onDragStart={(event) => onDragStart(event, type, { label, description, ...initialData })}
          draggable
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

const PaletteSidebar = ({ onAddTool, dynamicTools }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeCategory, setActiveCategory] = React.useState('LangChain');
  
  // This defines the structure and content of the entire sidebar
  const paletteNodes = [
    {
        category: 'LangChain',
        section: 'Agents',
        nodes: [
          { 
            type: 'aiAgentNode',
            label: 'AI Agent', 
            icon: Bot, 
            description: 'Configurable agent that uses a model, memory, and tools.',
            initialData: {
              nodeType: 'aiAgent',
              label: 'AI Agent',
              systemMessage: 'You are a helpful AI assistant.',
              chatModel: null,
              memory: null,
              tools: [],
            }
          },
        ]
    },
    {
        category: 'LangChain',
        section: 'Chat Models',
        nodes: [
          { 
            type: 'chatModelNode', 
            label: 'Google Gemini', 
            icon: SiGooglecloud, 
            description: 'Connect to Google Gemini models.',
            initialData: {
              nodeType: 'chatModel',
              label: 'Google Gemini',
              provider: 'Google Gemini',
              model_name: 'gemini-1.5-pro-latest',
              credentials_id: null,
            }
          },
          { 
            type: 'chatModelNode', 
            label: 'OpenAI Chat', 
            icon: SiOpenai,
            description: 'Connect to OpenAI GPT models.',
            initialData: {
              nodeType: 'chatModel',
              label: 'OpenAI Chat',
              provider: 'OpenAI',
              model_name: 'gpt-4o',
              credentials_id: null,
            }
          },
        ]
    },
    {
        category: 'LangChain',
        section: 'Memory',
        nodes: [
          {
            type: 'memoryNode',
            label: 'Conversation Memory',
            icon: MemoryStick,
            description: 'Remembers the last few messages in a conversation.',
            initialData: {
              nodeType: 'memory',
              label: 'Conversation Memory',
              memory_type: 'ConversationBufferWindowMemory',
              k: 5
            }
          }
        ]
    },
    {
      category: 'LangChain',
      section: 'Tools',
      nodes: dynamicTools || [], // Use the tools passed in as a prop
    },
  ];

  // Logic to filter nodes based on the search term
  const filteredPaletteNodes = paletteNodes
    .filter(cat => cat.category === activeCategory)
    .map(cat => ({
      ...cat,
      nodes: cat.nodes.filter(node =>
        node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    // This ensures the "Tools" section is always visible, even if empty, so the "+" button is shown
    .filter(cat => cat.nodes.length > 0 || cat.section === 'Tools');

  return (
    <aside className="absolute top-4 left-4 z-10 w-72 h-[calc(100%-32px)] flex flex-col p-4 bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <h3 className="text-lg font-bold mb-4 text-gray-900">Add Nodes</h3>
      
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Search nodes"
          className="pl-9 pr-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
            <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setSearchTerm('')}>
                <X className="h-4 w-4" />
            </Button>
        )}
      </div>
      
      <div className="flex space-x-2 border-b pb-2 mb-4">
        {['LangChain'].map(category => (
          <Button key={category} variant='default' size="sm">{category}</Button>
        ))}
      </div>
      
      <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 -mr-2">
        {filteredPaletteNodes.map((categoryData, catIdx) => (
          <div key={catIdx} className="mb-4">
            <CollapsibleSection
              title={categoryData.section}
              defaultOpen={true}
              onAddClick={categoryData.section === 'Tools' ? onAddTool : null}
            >
              {categoryData.nodes.length > 0 ? (
                categoryData.nodes.map((node, nodeIdx) => (
                    <DraggableNode key={node.label + nodeIdx} {...node} />
                ))
              ) : (
                <p className="text-xs text-gray-500 px-2">No tools found. Click the + icon to add one.</p>
              )}
            </CollapsibleSection>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default PaletteSidebar;