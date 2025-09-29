

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Added missing imports for Save dialog
import { Input } from '@/components/ui/input'; // Added missing import for Save dialog
import { Label } from '@/components/ui/label'; // Added missing import for Save dialog
import { Save, Play, Lock, LockOpen, Plus, Zap } from 'lucide-react'; // <<< THIS IS THE FIX: Import Zap icon here
import PaletteSidebar from './PaletteSidebar';
import PropertiesPanel from './PropertiesPanel';
import TriggerPalette from './TriggerPalette';
import { nodeTypes } from './CustomNodes';
import ExecuteWorkflowModal from './ExecuteWorkflowModal';
import ToolsView from '../ToolsView'; 
// MODIFIED: Remove Zap from this import line as it's not an API function
import { createWorkflow, updateWorkflow, fetchWorkflowDetails, executeWorkflow, fetchTools } from '@/api';

const FlowEditor = ({ flowId: initialFlowId }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('Untitled Agentflow');
  const [flowId, setFlowId] = useState(initialFlowId);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTriggerPalette, setShowTriggerPalette] = useState(!initialFlowId);
  const [isExecuting, setIsExecuting] = useState(false);
  const [execModalOpen, setExecModalOpen] = useState(false);
  const [execResponse, setExecResponse] = useState(null);
  const [execError, setExecError] = useState(null);

  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);
  const [dynamicTools, setDynamicTools] = useState([]);

  const reactFlowWrapper = useRef(null);
  const { toast } = useToast();

  const refreshToolsForPalette = useCallback(async () => {
    try {
      const fetchedTools = await fetchTools();
      const paletteTools = fetchedTools.map(tool => ({
        type: 'toolNode',
        label: tool.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        icon: Zap, // Using Zap icon for tools
        description: tool.description,
        initialData: { nodeType: 'tool', ...tool }
      }));
      setDynamicTools(paletteTools);
    } catch (error) {
      console.error("Failed to refresh tools for palette:", error);
      toast({ title: "Error", description: "Could not reload tools list.", variant: "destructive" });
    }
  }, [toast]);

  useEffect(() => {
    refreshToolsForPalette();
  }, [refreshToolsForPalette]);
  
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const loadFlow = useCallback(async (id) => {
    if (!id) return;
    setIsSaving(true);
    try {
      const flowData = await fetchWorkflowDetails(id);
      if (flowData && flowData.definition) {
        setFlowName(flowData.name);
        setFlowId(flowData.id);
        const processedNodes = (flowData.definition.nodes || []).map(node => ({
          ...node,
          data: {
            ...node.data,
            onNodeClick: onNodeClick,
            onSettingsClick: () => {
              setNodes(currentNodes => {
                const foundNode = currentNodes.find(n => n.id === node.id);
                if (foundNode) setSelectedNode(foundNode);
                return currentNodes;
              });
            },
          }
        }));
        setNodes(processedNodes);
        setEdges(flowData.definition.edges || []);
        setShowTriggerPalette(false);
        toast({ title: "Flow Loaded", description: `Flow "${flowData.name}" loaded successfully.` });
      } else {
        throw new Error(`Flow with ID ${id} not found or has an invalid format.`);
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      toast({ title: "Error", description: error.message || "Failed to load flow.", variant: "destructive" });
      setNodes([]);
      setEdges([]);
      setFlowId(null);
      setFlowName('Untitled Agentflow');
      setShowTriggerPalette(true);
    } finally {
      setIsSaving(false);
    }
  }, [setNodes, setEdges, toast, onNodeClick]);

  useEffect(() => {
    setFlowId(initialFlowId);
    if (initialFlowId) {
      loadFlow(initialFlowId);
    } else {
      setNodes([]);
      setEdges([]);
      setFlowName('Untitled Agentflow');
      setShowTriggerPalette(true);
    }
  }, [initialFlowId, loadFlow]);

  useEffect(() => {
    if (nodes.length > 0) {
      setShowTriggerPalette(false);
    } else if (!initialFlowId) {
      setShowTriggerPalette(true);
    }
  }, [nodes.length, initialFlowId]);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onNodeUpdate = useCallback((id, data) => {
    setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data } : node)));
    if (selectedNode?.id === id) {
      setSelectedNode(prev => ({ ...prev, data }));
    }
  }, [setNodes, selectedNode]);

  const onConnect = useCallback((params) => {
    const { source, target, targetHandle } = params;
    const targetNode = reactFlowInstance.getNode(target);
    const sourceNode = reactFlowInstance.getNode(source);

    if (targetNode?.type === 'aiAgentNode' && ['chatModel', 'memory', 'tool'].includes(targetHandle)) {
      setNodes(nds => 
        nds.map(node => {
          if (node.id === target) {
            const updatedData = JSON.parse(JSON.stringify(node.data));
            if (targetHandle === 'tool') {
              const existingTools = updatedData.tools || [];
              if (!existingTools.some(t => t.name === sourceNode.data.name)) {
                updatedData.tools = [...existingTools, sourceNode.data];
              }
            } else {
              updatedData[targetHandle] = sourceNode.data;
            }
            return { ...node, data: updatedData };
          }
          return node;
        })
      );
      const configEdge = { ...params, type: 'step', style: { stroke: '#aaa', strokeDasharray: '5 5' }, animated: false };
      setEdges((eds) => addEdge(configEdge, eds));
      return;
    }
    
    const defaultEdge = { ...params, type: 'smoothstep', animated: true, style: { stroke: '#555' } };
    setEdges((eds) => addEdge(defaultEdge, eds));
    
  }, [reactFlowInstance, setNodes, setEdges]);
  
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const transferDataString = event.dataTransfer.getData('application/reactflow');
    if (!transferDataString || !reactFlowInstance) return;

    try {
      const { type, ...nodeData } = JSON.parse(transferDataString);
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      const newNode = {
        id: `${type}_${uuidv4().substring(0, 8)}`,
        type,
        position,
        data: { ...nodeData, onNodeClick, onSettingsClick: (id) => {
            const node = reactFlowInstance.getNode(id);
            if (node) setSelectedNode(node);
        }},
      };
      setNodes((nds) => nds.concat(newNode));
    } catch (error) {
      console.error("Failed to parse node data from palette:", error);
      toast({ title: "Error adding node", description: "Invalid data from palette.", variant: "destructive" });
    }
  }, [reactFlowInstance, onNodeClick, setNodes, toast]);

  const handleTriggerSelect = useCallback((trigger) => {
    const position = { x: 250, y: 50 };
    const newNode = {
      id: `${trigger.type}_${uuidv4().substring(0, 8)}`,
      type: trigger.type,
      position,
      data: {
        ...trigger.initialData,
        label: trigger.label,
        description: trigger.description,
        onNodeClick,
        onSettingsClick: () => setSelectedNode(newNode),
      },
    };
    setNodes([newNode]);
    setShowTriggerPalette(false);
    setSelectedNode(newNode);
  }, [reactFlowInstance, onNodeClick, setNodes]);

  const handleSave = async () => { 
    if (!flowName.trim()) {
      toast({ title: "Error", description: "Flow name cannot be empty.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      const flowData = { name: flowName, description: "An agentic workflow.", definition: { nodes, edges } };
      let result;
      if (flowId) {
        result = await updateWorkflow(flowId, flowData);
      } else {
        result = await createWorkflow(flowData);
      }
      setFlowId(result.id);
      toast({ title: "Flow Saved", description: `Flow "${result.name}" saved successfully.` });
      setSaveDialogOpen(false);
    } catch (error) {
      toast({ title: "Error Saving Flow", description: error.message || "An unknown error occurred.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExecute = async (inputData) => {
    if (!flowId) {
      toast({ title: "Error", description: "Please save the flow before executing.", variant: "destructive" });
      return;
    }
    setIsExecuting(true);
    setExecResponse(null);
    setExecError(null);
    try {
      const result = await executeWorkflow(flowId, inputData);
      setExecResponse(result);
      toast({ title: "Execution Successful", description: "Workflow finished running." });
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      setExecError(errorMessage);
      toast({ title: "Execution Failed", description: "Check the execution modal for details.", variant: "destructive" });
    } finally {
      setIsExecuting(false);
    }
  };


  return (
    <div className="w-full h-full flex flex-col">
      <header className="flex items-center justify-between p-2 border-b bg-gray-50 flex-shrink-0">
        <h2 className="text-xl font-bold ml-2">{flowName}</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setSaveDialogOpen(true)} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button 
            onClick={() => {
              setExecResponse(null);
              setExecError(null);
              setExecModalOpen(true);
            }} 
            disabled={isSaving || !flowId}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Play className="h-4 w-4 mr-2" />
            Execute Workflow
          </Button>
        </div>
      </header>
      <div className="flex-grow relative" ref={reactFlowWrapper}>
        <ReactFlowProvider>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={!isLocked ? onNodesChange : undefined} 
            onEdgesChange={!isLocked ? onEdgesChange : undefined} 
            onConnect={!isLocked ? onConnect : undefined} 
            onInit={setReactFlowInstance} 
            onDrop={!isLocked ? onDrop : undefined} 
            onDragOver={onDragOver} 
            onNodeClick={onNodeClick} 
            onPaneClick={onPaneClick} 
            nodeTypes={nodeTypes} 
            fitView
          >
            <Controls />
            <Background variant="dots" gap={12} size={1} />
            <Panel position="top-right">
              {nodes.length === 0 && (
                <Button variant="outline" size="sm" onClick={() => setShowTriggerPalette(true)} className="mr-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Step
                </Button>
              )}
              <Button variant="outline" size="icon" onClick={() => setIsLocked(!isLocked)}>
                {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
              </Button>
            </Panel>
            {nodes.length === 0 && showTriggerPalette ? (
                <TriggerPalette onTriggerSelect={handleTriggerSelect} onClose={() => setShowTriggerPalette(false)} />
            ) : (
                <PaletteSidebar 
                  onAddTool={() => setIsToolsModalOpen(true)}
                  dynamicTools={dynamicTools}
                />
            )}
            {nodes.length === 0 && !showTriggerPalette && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Button variant="outline" className="text-gray-500 text-lg py-8 px-12 border-dashed border-2 pointer-events-auto" onClick={() => setShowTriggerPalette(true)}>
                        <Plus className="h-8 w-8 mr-4" />
                        Add first step...
                    </Button>
                </div>
            )}
            {selectedNode && (
              <PropertiesPanel 
                selectedNode={selectedNode} 
                onNodeUpdate={onNodeUpdate} 
                onClose={() => setSelectedNode(null)}
                flowId={flowId}
              />
            )}
          </ReactFlow>
        </ReactFlowProvider>
      </div>
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Agentflow</DialogTitle>
            <DialogDescription>Enter a name for your agent flow to save it.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="flowName" className="text-right">Name</Label>
              <Input id="flowName" value={flowName} onChange={(e) => setFlowName(e.target.value)} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isSaving || !flowName.trim()}>{isSaving ? 'Saving...' : 'Save Flow'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <ExecuteWorkflowModal
        isOpen={execModalOpen}
        onClose={() => setExecModalOpen(false)}
        onExecute={handleExecute}
        isLoading={isExecuting}
        response={execResponse}
        error={execError}
      />

      <Dialog open={isToolsModalOpen} onOpenChange={setIsToolsModalOpen}>
        <DialogContent className="sm:max-w-[80vw] h-[80vh] flex flex-col p-0">
          <ToolsView 
            onClose={() => setIsToolsModalOpen(false)}
            onToolsSaved={refreshToolsForPalette}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FlowEditor;