// src/pages/Studio/FlowEditor/CustomNodes.jsx

import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Typography, Paper, Divider, IconButton, Tooltip } from '@mui/material';

// --- ICONS ---
import InfoIcon from '@mui/icons-material/Info';
import SettingsIcon from '@mui/icons-material/Settings';
import MemoryIcon from '@mui/icons-material/Memory'; // For Memory Node
import ApiIcon from '@mui/icons-material/Api'; // For Generic Tool Node
import { Bot as BotIcon, MessageSquare, FormInput, PlusCircle } from "lucide-react";
import { SiGooglecloud } from "@icons-pack/react-simple-icons"; // For Gemini/Google icon

// Base node styling
const nodeStyles = {
  padding: '10px 15px',
  borderRadius: '8px',
  minWidth: '220px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e0e0e0',
};

// --- Reusable Base Node (for triggers and simple nodes) ---
const BaseCustomNode = memo(({ data, selected, id, icon: Icon, backgroundColor, defaultLabel, defaultDescription, isTrigger = false }) => {
  return (
    <Paper 
      sx={{
        ...nodeStyles,
        border: selected ? '2px solid #2196f3' : '1px solid #e0e0e0',
        backgroundColor: backgroundColor || '#ffffff',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {Icon && <Icon className="h-5 w-5 mr-2 text-gray-600" />}
        <Typography variant="subtitle2" fontWeight="bold">
          {data.label || defaultLabel}
        </Typography>
      </Box>
      
      <Divider />
      
      <Box sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
          {data.description || defaultDescription}
        </Typography>
      </Box>
      
      {!isTrigger && (
        <Handle type="target" position={Position.Left} style={{ background: '#555' }} id="input"/>
      )}
      
      <Handle type="source" position={Position.Right} style={{ background: '#555' }} id="output"/>
    </Paper>
  );
});


// --- Custom Handle for AI Agent ---
const SubNodeHandle = memo(({ id, label, isConnected }) => (
  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 10px', color: isConnected ? '#1b5e20' : '#757575' }}>
    <Handle
      type="target"
      position={Position.Bottom}
      id={id}
      style={{
        width: 22,
        height: 22,
        background: isConnected ? '#a5d6a7' : '#fafafa',
        border: `2px solid ${isConnected ? '#388e3c' : '#bdbdbd'}`,
      }}
    />
    {!isConnected && <PlusCircle size={14} style={{ position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />}
    <Typography variant="caption" sx={{ mt: 0.5, fontWeight: isConnected ? '600' : '400' }}>
      {label}
    </Typography>
  </div>
));

// --- NEW AI AGENT NODE ---
export const AIAgentNode = memo(({ data, selected }) => {
  const isChatModelConnected = !!data.chatModel;
  const isMemoryConnected = !!data.memory;
  const isToolConnected = data.tools && data.tools.length > 0;

  return (
    <Paper 
      sx={{
        ...nodeStyles,
        border: selected ? '2px solid #c62828' : '1px solid #ffcdd2',
        backgroundColor: '#fffafa',
        minWidth: 280,
      }}
    >
      <Handle type="target" position={Position.Left} id="input" style={{ background: '#555' }} />

      <Box sx={{ p: 1.5, pb: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BotIcon className="h-6 w-6 mr-2 text-red-800" />
            <Typography variant="subtitle1" fontWeight="bold">
              {data.label || 'AI Agent'}
            </Typography>
          </Box>
          <Box>
            <Tooltip title="Settings"><IconButton size="small"><SettingsIcon fontSize="small" /></IconButton></Tooltip>
          </Box>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-around', padding: '16px 8px 8px 8px', borderTop: '1px solid #ffebee', mt: 1 }}>
        <SubNodeHandle id="chatModel" label="Chat Model*" isConnected={isChatModelConnected} />
        <SubNodeHandle id="memory" label="Memory" isConnected={isMemoryConnected} />
        <SubNodeHandle id="tool" label="Tool" isConnected={isToolConnected} />
      </Box>

      <Handle type="source" position={Position.Right} id="output" style={{ background: '#555' }} />
    </Paper>
  );
});

// --- Simple Config Node Components ---
const ConfigNode = memo(({ data, selected, icon: Icon, backgroundColor, defaultLabel }) => (
    <Paper sx={{ ...nodeStyles, padding: '8px 12px', backgroundColor, border: selected ? '2px solid #2196f3' : '1px solid #e0e0e0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Icon && <Icon className="h-5 w-5 mr-2 text-gray-700" />}
            <Typography variant="body2" fontWeight="500">{data.label || defaultLabel}</Typography>
        </Box>
        <Handle type="source" position={Position.Right} id="output" style={{ background: '#555' }} />
    </Paper>
));

export const ChatModelNode = memo((props) => <ConfigNode {...props} icon={SiGooglecloud} backgroundColor="#e3f2fd" defaultLabel="Chat Model" />);
export const MemoryNode = memo((props) => <ConfigNode {...props} icon={MemoryIcon} backgroundColor="#f3e5f5" defaultLabel="Memory" />);
export const ToolNode = memo((props) => <ConfigNode {...props} icon={ApiIcon} backgroundColor="#e8f5e9" defaultLabel="Tool" />);

// --- Trigger Node Components ---
export const ChatTriggerNode = memo((props) => (
  <BaseCustomNode 
    {...props}
    icon={MessageSquare} 
    backgroundColor="#e0f7fa"
    defaultLabel="On Chat Message" 
    defaultDescription="Starts the flow when a message is received" 
    isTrigger={true}
  />
));

export const FormTriggerNode = memo((props) => (
  <BaseCustomNode 
    {...props}
    icon={FormInput} 
    backgroundColor="#e8f5e9"
    defaultLabel="On Form Submission" 
    defaultDescription="Starts the flow when a form is submitted" 
    isTrigger={true}
  />
));

// Export node types object for ReactFlow
export const nodeTypes = {
  // Triggers
  chatTriggerNode: ChatTriggerNode,
  formTriggerNode: FormTriggerNode,
  
  // Main Nodes
  aiAgentNode: AIAgentNode,
  
  // Config Nodes
  chatModelNode: ChatModelNode,
  memoryNode: MemoryNode,
  toolNode: ToolNode,
};