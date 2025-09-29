// src/pages/Studio/ApiKeysView.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, MoreHorizontal, Edit, Trash2, Eye, EyeOff, Copy, Search,
  Loader2, CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock API - Replace with real backend
const mockApi = {
  getApiKeys: async () => {
    await new Promise(res => setTimeout(res, 500));
    return [
      { id: '1', name: 'DefaultKey', key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxqthTw', usage: 0, lastUsed: null, createdAt: new Date().toISOString() },
    ];
  },
  createApiKey: async (name, customKey) => {
    await new Promise(res => setTimeout(res, 300));
    return { 
      id: Math.random().toString(36).slice(2, 9), 
      name, 
      key: customKey || `sk-new_${Math.random().toString(36).substr(2, 28)}`, 
      usage: 0, 
      lastUsed: null, 
      createdAt: new Date().toISOString() 
    };
  },
  deleteApiKey: async (id) => {
    console.log(`Deleting API key ${id}`);
    await new Promise(res => setTimeout(res, 300));
  },
};

const ApiKeyRow = ({ apiKey, onEdit, onDelete }) => {
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(apiKey.key);
    setCopied(true);
    toast({ title: "Copied!", description: "API Key copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{apiKey.name}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <span>{showKey ? apiKey.key : `sk-••••••••••••••••••••••••${apiKey.key.slice(-5)}`}</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowKey(!showKey)}>
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy}>
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
      </TableCell>
      <TableCell>{apiKey.usage}</TableCell>
      <TableCell>{new Date(apiKey.createdAt).toLocaleDateString()}</TableCell>
      <TableCell className="text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(apiKey)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(apiKey)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

const ApiKeysView = () => {
  const { isAuthenticated } = useAuth();
  const [keys, setKeys] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [customKey, setCustomKey] = useState('');

  useEffect(() => {
    const fetchKeys = async () => {
      if (!isAuthenticated) {
        setError("You must be logged in.");
        setIsLoading(false);
        return;
      }
      try {
        const data = await mockApi.getApiKeys();
        setKeys(data);
      } catch (err) {
        setError("Failed to fetch API keys.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchKeys();
  }, [isAuthenticated]);

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    const newKey = await mockApi.createApiKey(newKeyName, customKey.trim());
    setKeys([...keys, newKey]);
    setNewKeyName('');
    setCustomKey('');
    setIsModalOpen(false);
  };

  const handleDeleteKey = async (keyToDelete) => {
    await mockApi.deleteApiKey(keyToDelete.id);
    setKeys(keys.filter(k => k.id !== keyToDelete.id));
  };
  
  return (
    <div className="p-6 sm:p-8 h-full bg-white flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
          <p className="text-gray-500 mt-1">Manage API keys for authenticating with your agents and services.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          <div className="relative"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search API Keys..." className="pl-8" /></div>
          <Button onClick={() => setIsModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Create Key</Button>
        </div>
      </header>
      
      <main className="flex-grow rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key Name</TableHead>
              <TableHead>API Key</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : error ? (
              <TableRow><TableCell colSpan={5} className="text-center text-red-500">{error}</TableCell></TableRow>
            ) : keys.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-gray-500 h-24">No API keys found.</TableCell></TableRow>
            ) : (
              keys.map(key => <ApiKeyRow key={key.id} apiKey={key} onDelete={handleDeleteKey} onEdit={() => alert(`Editing ${key.name}`)} />)
            )}
          </TableBody>
        </Table>
      </main>
      
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New API Key</DialogTitle>
            <DialogDescription>Give your new API key a descriptive name, or paste an existing key.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input id="keyName" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g., My-WebApp-Key" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="customKey">Custom API Key (optional)</Label>
              <Input id="customKey" value={customKey} onChange={(e) => setCustomKey(e.target.value)} placeholder="Paste your own API key here..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateKey} disabled={!newKeyName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApiKeysView;
