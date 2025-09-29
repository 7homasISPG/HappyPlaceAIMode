import React, { useState, useRef, useCallback, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Added for Chatflows navigation
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
import {
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  CircularProgress,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  Skeleton,
  InputAdornment,
  Pagination,
  CardActionArea
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Added for Chatflows theming

// --- ICONS ---
import SaveIcon from '@mui/icons-material/Save';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import ChatIcon from '@mui/icons-material/Chat';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BuildIcon from '@mui/icons-material/Build';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CodeIcon from '@mui/icons-material/Code';
import KeyIcon from '@mui/icons-material/Key';
import DescriptionIcon from '@mui/icons-material/Description';
import { IconPlus, IconLayoutGrid, IconList, IconSearch } from '@tabler/icons-react';

// --- CUSTOM COMPONENTS (from original StudioPage)---
import PaletteSidebar from './FlowEditor/PaletteSidebar';
import PropertiesPanel from './FlowEditor/PropertiesPanel';
import { nodeTypes } from './FlowEditor/CustomNodes';
import FlowEditor from './FlowEditor/FlowEditor';

// ==============================|| MOCKED APIs & HOOKS ||============================== //

// --- Mock APIs to prevent crashes ---
const studioApi = {
    getFlow: async (id) => { console.log(`API Call: getFlow with id ${id}`); return null; },
    saveFlow: async (data) => { console.log('API Call: saveFlow'); return { id: data.id || uuidv4() }; },
    deployFlow: async (id) => { console.log(`API Call: deployFlow with id ${id}`); },
    runFlow: async (id) => { console.log(`API Call: runFlow with id ${id}`); return { result: 'success' }; },
    saveSupervisorProfile: async (data) => { console.log('API Call: saveSupervisorProfile'); },
    saveAssistantsConfig: async (data) => { console.log('API Call: saveAssistantsConfig'); },
    handleApiError: (error) => { return error.message || 'An API error occurred'; }
};

const mockChatflows = [
    { id: 'cf-1', name: 'Customer Service Bot', flowData: JSON.stringify({ nodes: [{ data: { name: 'openAI', label: 'OpenAI' } }, { data: { name: 'llmChain', label: 'LLM Chain' } }] }), category: 'Support' },
    { id: 'cf-2', name: 'Sales Inquiry Agent', flowData: JSON.stringify({ nodes: [{ data: { name: 'huggingFace', label: 'Hugging Face' } }] }), category: 'Sales' },
    { id: 'cf-3', name: 'Internal Knowledge Base', flowData: JSON.stringify({ nodes: [{ data: { name: 'documentLoader', label: 'Document Loader' } }] }), category: 'Internal' },
];

const chatflowsApi = {
    getAllChatflows: async () => {
        console.log('API Call: getAllChatflows');
        // Simulate network delay
        await new Promise(res => setTimeout(res, 500));
        return { data: { data: mockChatflows, total: mockChatflows.length } };
    }
};

// --- Mock Hooks for Chatflows Component ---
const useApi = (apiCall) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const request = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        try {
            const response = await apiCall(...args);
            setData(response.data);
        } catch (e) {
            setError(e);
        } finally {
            setLoading(false);
        }
    }, [apiCall]);

    return { loading, error, data, request };
};

const ErrorContext = React.createContext();
const useError = () => useContext(ErrorContext);
const ErrorProvider = ({ children }) => {
    const [error, setError] = useState(null);
    return <ErrorContext.Provider value={{ error, setError }}>{children}</ErrorContext.Provider>;
};


// ==============================|| MOCKED UI COMPONENTS for Chatflows ||============================== //

const gridSpacing = 3;
const baseURL = 'http://localhost:3000'; // Example baseURL

const MainCard = ({ children, ...props }) => (
    <Card sx={{ border: '1px solid #e0e0e0', borderRadius: 2 }} {...props}>{children}</Card>
);

const ItemCard = ({ data, images, onClick }) => {
    const theme = useTheme();
    return (
        <Card sx={{
            border: '1px solid #e0e0e0',
            '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
            transition: 'box-shadow 0.3s'
        }}>
            <CardActionArea onClick={onClick}>
                <CardContent>
                    <Typography variant="h5" component="div" noWrap>{data.name}</Typography>
                    <Typography sx={{ mb: 1.5 }} color="text.secondary">{data.category || 'No Category'}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 24, mt: 1 }}>
                        {(images || []).slice(0, 3).map((img, index) => (
                            <img key={index} src={img.imageSrc} alt={img.label} style={{ width: 24, height: 24, marginRight: 4, borderRadius: '50%' }} />
                        ))}
                    </Box>
                </CardContent>
            </CardActionArea>
        </Card>
    );
};

const ViewHeader = ({ title, description, onSearchChange, search, searchPlaceholder, children }) => (
    <Box>
        <Typography variant="h4">{title}</Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>{description}</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
            {search && (
                <TextField
                    variant="outlined"
                    placeholder={searchPlaceholder}
                    onChange={onSearchChange}
                    sx={{ flexGrow: 1 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <IconSearch />
                            </InputAdornment>
                        )
                    }}
                />
            )}
            {children}
        </Stack>
    </Box>
);

const ErrorBoundary = ({ error }) => (
    <Box sx={{ p: 3, border: '2px solid red', borderRadius: 2 }}>
        <Typography variant="h5" color="error">An Error Occurred</Typography>
        <Typography>{error?.message || 'Something went wrong.'}</Typography>
    </Box>
);

const TablePagination = ({ currentPage, total, onChange }) => (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={Math.ceil(total / 10)} page={currentPage} onChange={(e, page) => onChange(page, 10)} />
    </Box>
);


// ==============================|| CHATFLOWS COMPONENT ||============================== //

const Chatflows = () => {
    const navigate = useNavigate();
    const theme = useTheme();

    const [isLoading, setLoading] = useState(true);
    const [images, setImages] = useState({});
    const [search, setSearch] = useState('');
    const { error, setError } = useError(); // Assuming ErrorProvider is wrapping this component

    const getAllChatflowsApi = useApi(chatflowsApi.getAllChatflows);
    const [view, setView] = useState(localStorage.getItem('flowDisplayStyle') || 'card');

    const [currentPage, setCurrentPage] = useState(1);
    const [pageLimit, setPageLimit] = useState(10);
    const [total, setTotal] = useState(0);

    const onChange = (page, limit) => {
        setCurrentPage(page);
        setPageLimit(limit);
    };

    const handleChange = (event, nextView) => {
        if (nextView === null) return;
        localStorage.setItem('flowDisplayStyle', nextView);
        setView(nextView);
    };

    const onSearchChange = (event) => setSearch(event.target.value);

    const filterFlows = (data) =>
        data?.name.toLowerCase().includes(search.toLowerCase()) ||
        (data.category && data.category.toLowerCase().includes(search.toLowerCase()));

    const addNew = () => navigate('/canvas');
    const goToCanvas = (selectedChatflow) => navigate(`/canvas/${selectedChatflow.id}`);

    useEffect(() => {
        getAllChatflowsApi.request();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setLoading(getAllChatflowsApi.loading);
        if (getAllChatflowsApi.error) {
            setError(getAllChatflowsApi.error);
        }
    }, [getAllChatflowsApi.loading, getAllChatflowsApi.error, setError]);

    useEffect(() => {
        if (getAllChatflowsApi.data) {
            const chatflows = getAllChatflowsApi.data.data || [];
            setTotal(getAllChatflowsApi.data.total || 0);
            const loadedImages = {};
            chatflows.forEach(flow => {
                try {
                    const flowData = JSON.parse(flow.flowData);
                    const nodes = flowData.nodes || [];
                    loadedImages[flow.id] = nodes
                        .map(node => ({
                            imageSrc: `${baseURL}/api/v1/node-icon/${node.data.name}`,
                            label: node.data.label
                        }))
                        .filter((img, index, self) => index === self.findIndex(t => t.imageSrc === img.imageSrc));
                } catch (e) {
                    console.error("Failed to parse flowData: ", e);
                    loadedImages[flow.id] = [];
                }
            });
            setImages(loadedImages);
        }
    }, [getAllChatflowsApi.data]);

    const filteredData = getAllChatflowsApi.data?.data?.filter(filterFlows) || [];

    return (
        <ErrorProvider>
             <Box sx={{ p: 4, flexGrow: 1, backgroundColor: '#fff' }}>
                {error ? <ErrorBoundary error={error} /> : (
                    <Stack flexDirection='column' sx={{ gap: 3 }}>
                        <ViewHeader
                            onSearchChange={onSearchChange}
                            search={true}
                            searchPlaceholder='Search Name or Category'
                            title='Chatflows'
                            description='Build single-agent systems, chatbots and simple LLM flows'
                        >
                            <ToggleButtonGroup
                                sx={{ borderRadius: 2, maxHeight: 40 }} value={view} color='primary'
                                disabled={total === 0} exclusive onChange={handleChange}
                            >
                                <ToggleButton value='card' title='Card View'><IconLayoutGrid /></ToggleButton>
                                <ToggleButton value='list' title='List View'><IconList /></ToggleButton>
                            </ToggleButtonGroup>
                            <Button variant='contained' onClick={addNew} startIcon={<IconPlus />} sx={{ borderRadius: 2, height: 40 }}>
                                Add New
                            </Button>
                        </ViewHeader>

                        {isLoading && (
                            <Box display='grid' gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={gridSpacing}>
                                {[...Array(3)].map((_, i) => <Skeleton key={i} variant='rounded' height={160} />)}
                            </Box>
                        )}

                        {!isLoading && total > 0 && (
                             <Box display='grid' gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={gridSpacing}>
                                {filteredData.map((data, index) => (
                                    <ItemCard key={index} onClick={() => goToCanvas(data)} data={data} images={images[data.id]} />
                                ))}
                            </Box>
                        )}

                        {!isLoading && filteredData.length === 0 && (
                            <Stack sx={{ alignItems: 'center', justifyContent: 'center', mt: 4 }} flexDirection='column'>
                                <Typography variant="h6">No Chatflows Yet</Typography>
                                <Typography color="text.secondary">Click &quot;Add New&quot; to get started.</Typography>
                            </Stack>
                        )}
                        
                        {!isLoading && total > 0 && <TablePagination currentPage={currentPage} limit={pageLimit} total={total} onChange={onChange} />}
                    </Stack>
                )}
            </Box>
        </ErrorProvider>
    );
};


// ==============================|| FLOW EDITOR COMPONENT (Agentflows) ||============================== //

const FlowEditor = () => {
  // This is the original code for the ReactFlow editor
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [showProperties, setShowProperties] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [saveDialog, setSaveDialog] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [flowId, setFlowId] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const reactFlowWrapper = useRef(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setFlowId(id);
      loadFlow(id);
    }
  }, []);

  const loadFlow = async (id) => {
    setLoading(true);
    try {
      const flowData = await studioApi.getFlow(id);
      if (flowData) {
        setFlowName(flowData.name);
        const processedNodes = flowData.nodes.map(node => ({
          ...node,
          data: {
            ...node.data,
            onNodeClick: onNodeClick,
            onSettingsClick: (id) => {
              const node = flowData.nodes.find(n => n.id === id);
              if (node) { setSelectedNode(node); setShowProperties(true); }
            },
            onInfoClick: (id) => {
              const node = flowData.nodes.find(n => n.id === id);
              if (node) { setSnackbar({ open: true, message: `Node Info: ${node.data.label || node.id}`, severity: 'info' }); }
            }
          }
        }));
        setNodes(processedNodes);
        setEdges(flowData.edges);
        setSnackbar({ open: true, message: 'Flow loaded successfully', severity: 'success' });
      }
    } catch (error) {
      console.error('Error loading flow:', error);
      setSnackbar({ open: true, message: studioApi.handleApiError(error), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const saveFlow = async () => {
    if (!flowName) {
      setSaveDialog(true);
      return;
    }
    setLoading(true);
    try {
      const flowData = { id: flowId, name: flowName, nodes, edges };
      const response = await studioApi.saveFlow(flowData);
      if (response && response.id) {
        setFlowId(response.id);
        window.history.pushState({}, '', `?id=${response.id}`);
      }
      setSnackbar({ open: true, message: 'Flow saved successfully', severity: 'success' });
    } catch (error) {
      console.error('Error saving flow:', error);
      setSnackbar({ open: true, message: studioApi.handleApiError(error), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDialogConfirm = () => {
    setSaveDialog(false);
    if (flowName) saveFlow();
  };

  const deployFlow = async () => {
    if (!flowId) {
      setSnackbar({ open: true, message: 'Please save the flow before deploying', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      await saveFlow();
      await studioApi.deployFlow(flowId);
      setSnackbar({ open: true, message: 'Flow deployed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deploying flow:', error);
      setSnackbar({ open: true, message: studioApi.handleApiError(error), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const runFlow = async () => {
    if (!flowId) {
      setSnackbar({ open: true, message: 'Please save the flow before running', severity: 'warning' });
      return;
    }
    setLoading(true);
    try {
      const result = await studioApi.runFlow(flowId);
      setSnackbar({ open: true, message: 'Flow executed successfully', severity: 'success' });
      console.log('Flow execution result:', result);
    } catch (error) {
      console.error('Error running flow:', error);
      setSnackbar({ open: true, message: studioApi.handleApiError(error), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    setShowProperties(true);
  }, []);

  const onNodeUpdate = useCallback((id, data) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...data, onNodeClick: node.data.onNodeClick, onSettingsClick: node.data.onSettingsClick, onInfoClick: node.data.onInfoClick } };
        }
        return node;
      })
    );
    if (data.type === 'supervisorNode') studioApi.saveSupervisorProfile(id, data);
    else if (data.type === 'agentNode' || data.type === 'toolNode') studioApi.saveAssistantsConfig(id, data);
    setSnackbar({ open: true, message: 'Node updated', severity: 'success' });
  }, [setNodes]);

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, id: `edge_${uuidv4().substring(0, 8)}`, type: 'smoothstep', animated: true, style: { stroke: '#555' } }, eds)), [setEdges]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeData = JSON.parse(event.dataTransfer.getData('application/reactflow'));
      if (!nodeData || !reactFlowInstance) return;

      const position = reactFlowInstance.project({ x: event.clientX - reactFlowBounds.left, y: event.clientY - reactFlowBounds.top });
      const newNode = {
        id: `${nodeData.type}_${uuidv4().substring(0, 8)}`,
        type: nodeData.type,
        position,
        data: {
          ...nodeData.data,
          onNodeClick: onNodeClick,
          onSettingsClick: (id) => {
            const node = nodes.find(n => n.id === id);
            if (node) { setSelectedNode(node); setShowProperties(true); }
          },
          onInfoClick: (id) => {
            const node = nodes.find(n => n.id === id);
            if (node) { setSnackbar({ open: true, message: `Node Info: ${node.data.label || node.id}`, severity: 'info' }); }
          }
        },
      };
      setNodes((nds) => nds.concat(newNode));
    }, [reactFlowInstance, nodes, onNodeClick]
  );
  
  const toggleLock = () => {
      setIsLocked(!isLocked);
      setNodes((nds) => nds.map((node) => ({ ...node, draggable: isLocked })));
      setSnackbar({ open: true, message: `Canvas is now ${!isLocked ? 'locked' : 'unlocked'}`, severity: 'info' });
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Agentflow Editor
          </Typography>
          <Button color="inherit" startIcon={<SaveIcon />} onClick={saveFlow} disabled={loading}>Save</Button>
          <Button color="inherit" startIcon={<PlayArrowIcon />} onClick={deployFlow} disabled={loading}>Deploy</Button>
        </Toolbar>
      </AppBar>
      
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {loading && <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255, 255, 255, 0.7)', zIndex: 1000 }}><CircularProgress /></Box>}
        <ReactFlowProvider>
          <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
            <PaletteSidebar />
            <Box ref={reactFlowWrapper} sx={{ flexGrow: 1, height: '100%' }}>
              <ReactFlow nodes={nodes} edges={edges} onNodesChange={isLocked ? () => {} : onNodesChange} onEdgesChange={isLocked ? () => {} : onEdgesChange} onConnect={isLocked ? () => {} : onConnect} onInit={setReactFlowInstance} onDrop={isLocked ? () => {} : onDrop} onDragOver={onDragOver} onNodeClick={onNodeClick} nodeTypes={nodeTypes} fitView deleteKeyCode={isLocked ? null : ['Delete', 'Backspace']}>
                <Controls />
                <Background variant="dots" gap={12} size={1} />
                <Panel position="top-right">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={() => reactFlowInstance?.zoomIn()} size="small" sx={{ bgcolor: 'background.paper' }}><ZoomInIcon /></IconButton>
                    <IconButton onClick={() => reactFlowInstance?.zoomOut()} size="small" sx={{ bgcolor: 'background.paper' }}><ZoomOutIcon /></IconButton>
                    <IconButton onClick={() => reactFlowInstance?.fitView()} size="small" sx={{ bgcolor: 'background.paper' }}><FitScreenIcon /></IconButton>
                    <IconButton onClick={toggleLock} size="small" sx={{ bgcolor: 'background.paper' }}>{isLocked ? <LockIcon /> : <LockOpenIcon />}</IconButton>
                  </Box>
                </Panel>
                <Panel position="bottom-center"><Button variant="contained" color="primary" startIcon={<PlayArrowIcon />} onClick={runFlow} disabled={loading}>Run Flow</Button></Panel>
              </ReactFlow>
            </Box>
            {showProperties && <PropertiesPanel selectedNode={selectedNode} onNodeUpdate={onNodeUpdate} onClose={() => setShowProperties(false)} />}
          </Box>
        </ReactFlowProvider>
      </Box>
      
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}><Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert></Snackbar>
      
      <Dialog open={saveDialog} onClose={() => setSaveDialog(false)}>
        <DialogTitle>Save Flow</DialogTitle>
        <DialogContent>
          <DialogContentText>Please enter a name for your flow.</DialogContentText>
          <TextField autoFocus margin="dense" label="Flow Name" fullWidth variant="outlined" value={flowName} onChange={(e) => setFlowName(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveDialogConfirm} disabled={!flowName}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};


// ==============================|| MAIN STUDIO PAGE COMPONENT ||============================== //

const menuItems = [
  { text: 'Chatflows', icon: <ChatIcon />, id: 'Chatflows' },
  { text: 'Agentflows', icon: <AccountTreeIcon />, id: 'Agentflows' },
  { text: 'Executions', icon: <PlaylistPlayIcon />, id: 'Executions' },
  { text: 'Assistants', icon: <SupportAgentIcon />, id: 'Assistants' },
  { text: 'Marketplaces', icon: <StorefrontIcon />, id: 'Marketplaces' },
  { text: 'Tools', icon: <BuildIcon />, id: 'Tools' },
  { text: 'Credentials', icon: <VpnKeyIcon />, id: 'Credentials' },
  { text: 'Variables', icon: <CodeIcon />, id: 'Variables' },
  { text: 'API Keys', icon: <KeyIcon />, id: 'APIKeys' },
  { text: 'Document Stores', icon: <DescriptionIcon />, id: 'DocumentStores' },
];

const MainSidebar = ({ activeView, onSelectView }) => (
  <Box sx={{ width: 240, height: '100vh', borderRight: '1px solid #e0e0e0', p: 1, backgroundColor: '#f8f9fa' }}>
    <List component="nav">
      {menuItems.map((item) => (
        <ListItemButton
          key={item.id}
          selected={activeView === item.id}
          onClick={() => onSelectView(item.id)}
          sx={{
            borderRadius: '8px', mb: 0.5,
            '&.Mui-selected': { backgroundColor: '#ede7f6', color: '#5e35b1', '& .MuiListItemIcon-root': { color: '#5e35b1' } },
            '&.Mui-selected:hover': { backgroundColor: '#d1c4e9' },
            '&:hover': { backgroundColor: '#f1f3f5' }
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      ))}
    </List>
  </Box>
);

const PlaceholderView = ({ title }) => (
  <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <Typography variant="h4" color="text.secondary">{title}</Typography>
  </Box>
);

const StudioPage = () => {
    const [currentView, setCurrentView] = useState('Chatflows');

    const renderView = () => {
        switch (currentView) {
            case 'Chatflows':
                return <Chatflows />; // Replaced placeholder with the actual component
            case 'Agentflows':
                return <FlowEditor />;
            case 'Executions':
                return <PlaceholderView title="Executions" />;
            case 'Assistants':
                return <PlaceholderView title="Assistants" />;
            case 'Marketplaces':
                return <PlaceholderView title="Marketplaces" />;
            case 'Tools':
                return <PlaceholderView title="Tools" />;
            case 'Credentials':
                return <PlaceholderView title="Credentials" />;
            case 'Variables':
                return <PlaceholderView title="Variables" />;
            case 'APIKeys':
                return <PlaceholderView title="API Keys" />;
            case 'DocumentStores':
                return <PlaceholderView title="Document Stores" />;
            default:
                return <Chatflows />;
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#fff' }}>
            <MainSidebar activeView={currentView} onSelectView={setCurrentView} />
            <Box component="main" sx={{ flexGrow: 1, height: '100%', overflow: 'auto' }}>
                <ErrorProvider>
                    {renderView()}
                </ErrorProvider>
            </Box>
        </Box>
    );
};

export default StudioPage;