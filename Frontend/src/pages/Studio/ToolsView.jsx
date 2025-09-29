
// src/pages/Studio/ToolsView.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Save, Loader2, X } from 'lucide-react'; // Added X for close button
import TaskManager from './FlowEditor/TaskManager';
import { useToast } from '@/hooks/use-toast';
import { fetchTools, saveTools } from '@/api';

// MODIFIED: Added onClose and onToolsSaved props
const ToolsView = ({ onClose, onToolsSaved }) => {
  const { isAuthenticated, token } = useAuth();
  const [tools, setTools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const loadTools = async () => {
      if (!isAuthenticated) {
        setError("You must be logged in to manage tools.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true); // Ensure loading state is true at the start
      try {
        const fetchedTools = await fetchTools();
        setTools(fetchedTools);
      } catch (err) {
        setError("Failed to fetch tools.");
        toast({ title: "Error", description: "Could not load your tools.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    loadTools();
  }, [isAuthenticated, token, toast]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updatedTools = await saveTools(tools); // API should return the saved list
      toast({ title: "Success", description: "All tools have been saved." });
      if (onToolsSaved) {
        onToolsSaved(updatedTools); // Notify parent component of the update
      }
      if (onClose) {
        onClose(); // Close the modal on successful save
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save tools.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    // The main container is now more flexible for modal/page use
    <div className="flex-grow p-6 sm:p-8 flex flex-col bg-white h-full overflow-y-auto">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Tools</h1>
          <p className="text-gray-500 mt-1">Manage reusable tools and functions that your agents can use.</p>
        </div>
        <div className="flex items-center gap-2 mt-4 sm:mt-0">
          {onClose && ( // Show close button only if it's a modal
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
          <Button size="lg" onClick={handleSaveChanges} disabled={isSaving}>
            {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isSaving ? 'Saving...' : 'Save All Tools'}
          </Button>
        </div>
      </header>
      <main className="flex-grow">
        {isLoading && <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-gray-400" /></div>}
        {!isLoading && error && <div className="text-center mt-16 text-red-500">{error}</div>}
        {!isLoading && !error && (
          <TaskManager tasks={tools} onTasksChange={setTools} />
        )}
      </main>
    </div>
  );
};

export default ToolsView;