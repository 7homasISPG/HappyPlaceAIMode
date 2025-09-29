// src/pages/Studio/FlowEditor/PropertiesPanel.jsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Divider, TextField, Button, FormControl, 
  InputLabel, Select, MenuItem, Switch, FormControlLabel, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Plus, TestTube, Copy, Trash2 } from 'lucide-react';
import TestChatModal from '../TestChatModal';
import { triggerChatMessage } from '@/api';
import { useToast } from '@/hooks/use-toast';

// Model definitions for the dropdown
const MODEL_OPTIONS = {
  OpenAI: [
    { value: 'gpt-4o', label: 'GPT-4o (Omni)' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  'Google Gemini': [
    { value: 'gemini-1.5-pro-latest', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
  ],
};

const PropertiesPanel = ({ selectedNode, onNodeUpdate, onClose, flowId }) => {
  const [nodeData, setNodeData] = useState(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState(null);
  const [testError, setTestError] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    if (selectedNode) {
      setNodeData({ ...selectedNode.data });
    } else {
      setNodeData(null);
    }
  }, [selectedNode]);
  
  const handleSendTestMessage = async (message) => {
    setTestLoading(true);
    setTestResponse(null);
    setTestError(null);
    const apiKey = 'TEST_API_KEY_12345'; // Using a mock key for the test tool
    try {
      if (!flowId) {
        throw new Error("Flow has not been saved yet. Please save the flow to get an ID for testing.");
      }
      const payload = {
        flow_id: flowId,
        message: message,
        session_id: `test_session_${Date.now()}`,
        user_id: 'test_user'
      };
      const result = await triggerChatMessage(payload, apiKey);
      setTestResponse(result);
      toast({ title: "Test Successful", description: "Trigger received a valid response." });
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      setTestError(errorMessage);
      toast({ title: "Test Failed", description: errorMessage, variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied!", description: "Form link copied to clipboard." });
  };

  if (!selectedNode || !nodeData) {
    return (
      <Paper elevation={3} sx={{ width: 320, p: 2, position: 'absolute', top: 0, right: 0, height: '100%', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">Select a node to edit</Typography>
      </Paper>
    );
  }

  const handlePropertyChange = (property, value) => {
    setNodeData((prevData) => ({ ...prevData, [property]: value }));
  };

  const handleApplyChanges = () => {
    onNodeUpdate(selectedNode.id, nodeData);
    toast({ title: "Applied", description: "Node properties updated." });
  };
  
  const addFormElement = () => {
    setNodeData(prevData => ({
      ...prevData,
      formElements: [...(prevData.formElements || []), { name: `field${(prevData.formElements?.length || 0) + 1}`, label: '', type: 'text', required: false }]
    }));
  };

  const updateFormElement = (index, field, value) => {
    setNodeData(prevData => {
      const newElements = [...(prevData.formElements || [])];
      newElements[index] = { ...newElements[index], [field]: value };
      return { ...prevData, formElements: newElements };
    });
  };

  const removeFormElement = (index) => {
    setNodeData(prevData => {
      const newElements = (prevData.formElements || []).filter((_, i) => i !== index);
      return { ...prevData, formElements: newElements };
    });
  };

  const renderNodeSpecificFields = () => {
    const nodeType = nodeData.nodeType || selectedNode.type;

    if (nodeType === 'chatModelNode') {
      const providerModels = MODEL_OPTIONS[nodeData.provider] || [];
      return (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" fontWeight="medium">Model Configuration</Typography>
          <FormControl fullWidth margin="dense" size="small">
            <InputLabel id="model-select-label">Model</InputLabel>
            <Select
              labelId="model-select-label"
              id="model-select"
              value={nodeData.model_name || ''}
              label="Model"
              onChange={(e) => handlePropertyChange('model_name', e.target.value)}
            >
              {providerModels.map(model => (
                <MenuItem key={model.value} value={model.value}>
                  {model.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      );
    }

    switch (nodeType) {
      case 'chatTriggerNode':
      case 'chatTrigger':
        return (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>Trigger Testing</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, fontSize: '0.8rem' }}>
                Send a sample message to this workflow's endpoint to test its behavior.
              </Typography>
              <Button variant="outlined" fullWidth startIcon={<TestTube className="h-4 w-4" />} onClick={() => setIsTestModalOpen(true)} disabled={!flowId}>
                Test Trigger
              </Button>
              {!flowId && <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>Save the flow to enable testing.</Typography>}
            </>
        );

      case 'formTriggerNode':
      case 'formTrigger': {
        const formUrl = flowId ? `${window.location.origin}/form/${flowId}` : "Save the flow to generate a link";
        return (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight="medium">Form Configuration</Typography>
            <TextField fullWidth margin="dense" label="Form Title" value={nodeData.formTitle || ''} onChange={(e) => handlePropertyChange('formTitle', e.target.value)} size="small" />
            <TextField fullWidth margin="dense" label="Form Description" multiline rows={2} value={nodeData.formDescription || ''} onChange={(e) => handlePropertyChange('formDescription', e.target.value)} size="small" />
            
            <Typography variant="subtitle2" fontWeight="medium" sx={{ mt: 2, mb: 1 }}>Form Fields</Typography>
            <Box className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {(nodeData.formElements || []).map((el, index) => (
                <Paper key={index} variant="outlined" sx={{ p: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TextField label="Field Label" value={el.label} onChange={(e) => updateFormElement(index, 'label', e.target.value)} size="small" fullWidth />
                    <IconButton size="small" onClick={() => removeFormElement(index)}><Trash2 className="h-4 w-4 text-red-500" /></IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>Type</InputLabel>
                      <Select value={el.type} label="Type" onChange={(e) => updateFormElement(index, 'type', e.target.value)}>
                        <MenuItem value="text">Text</MenuItem>
                        <MenuItem value="email">Email</MenuItem>
                        <MenuItem value="textarea">Text Area</MenuItem>
                        <MenuItem value="number">Number</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControlLabel control={<Switch checked={el.required} onChange={(e) => updateFormElement(index, 'required', e.target.checked)} />} label="Required" />
                  </Box>
                </Paper>
              ))}
              <Button variant="outlined" startIcon={<Plus className="h-4 w-4" />} onClick={addFormElement} fullWidth className="border-dashed">Add Field</Button>
            </Box>

            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" fontWeight="medium" sx={{ mb: 1 }}>Public Form Link</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <TextField value={formUrl} size="small" fullWidth disabled />
              <Button variant="contained" size="small" onClick={() => handleCopy(formUrl)} disabled={!flowId}><Copy className="h-4 w-4" /></Button>
            </Box>
          </>
        );
      }
      
      case 'aiAgent':
        return (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="medium">Agent Configuration</Typography>
              <TextField fullWidth margin="dense" label="System Message" multiline rows={4} value={nodeData.systemMessage || ''} onChange={(e) => handlePropertyChange('systemMessage', e.target.value)} size="small" />
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight="medium">Connected Components</Typography>
              <Box sx={{ mt: 1, p: 1.5, border: '1px dashed #ccc', borderRadius: 1, backgroundColor: '#fafafa' }}>
                  <Typography variant="body2"><strong>Chat Model:</strong> {nodeData.chatModel?.label || <span style={{color: '#d32f2f'}}>Not Connected*</span>}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Memory:</strong> {nodeData.memory?.label || 'None'}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}><strong>Tools:</strong> {nodeData.tools?.length > 0 ? nodeData.tools.map(t => t.label).join(', ') : 'None'}</Typography>
              </Box>
            </>
          );
      default: return null;
    }
  };
  
  return (
    <>
      <Paper elevation={3} sx={{ width: 320, position: 'absolute', top: 0, right: 0, height: '100%', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e0e0', flexShrink: 0 }}>
          <Typography variant="h6" fontWeight="bold">{nodeData.label || 'Properties'}</Typography>
          <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
        </Box>
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
          <TextField fullWidth margin="dense" label="Label" value={nodeData.label || ''} onChange={(e) => handlePropertyChange('label', e.target.value)} size="small" />
          <TextField fullWidth margin="dense" label="Description" multiline rows={2} value={nodeData.description || ''} onChange={(e) => handlePropertyChange('description', e.target.value)} size="small" />
          {renderNodeSpecificFields()}
        </Box>
        <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', flexShrink: 0 }}>
          <Button variant="contained" color="primary" fullWidth onClick={handleApplyChanges}>Apply Changes</Button>
        </Box>
      </Paper>
      <TestChatModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSend={handleSendTestMessage}
        isLoading={testLoading}
        response={testResponse}
        error={testError}
      />
    </>
  );
};

export default PropertiesPanel;