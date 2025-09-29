import React, { useState } from 'react';
import { Plus, X, Play } from 'lucide-react';

const AIAssistancePanel = () => {
  const [tasks, setTasks] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const addTask = () => {
    setTasks([...tasks, {
      id: Date.now(),
      name: '',
      endpoint: '',
      params: '',
      description: ''
    }]);
  };

  const removeTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const updateTask = (taskId, field, value) => {
    setTasks(tasks.map(task => 
      task.id === taskId ? { ...task, [field]: value } : task
    ));
  };

  const handleSaveAndRun = async () => {
    if (tasks.length === 0) {
      setMessage('Please add at least one task before running the agent.');
      return;
    }

    // Basic required fields check
    for (let task of tasks) {
      if (!task.name.trim() || !task.endpoint.trim() || !task.description.trim()) {
        setMessage('Please fill in all required fields (Name, Endpoint, Description) for all tasks.');
        return;
      }
    }

    // JSON validation for params
    let parsedTasks;
    try {
      parsedTasks = tasks.map(task => ({
        name: task.name,
        endpoint: task.endpoint,
        params: task.params.trim() ? JSON.parse(task.params) : {}, // validate JSON
        description: task.description
      }));
    } catch (err) {
      setMessage(`Invalid JSON in parameters: ${err.message}`);
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/run-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks: parsedTasks })
      });

      if (response.ok) {
        const result = await response.json();
        setMessage('✅ Agent executed successfully! Check the console for results.');
        console.log('Agent execution result:', result);
      } else {
        const errorText = await response.text();
        setMessage(`Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      setMessage(`Network error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">AI Agent Builder</h1>
        <p className="text-gray-600 mb-8">Create and manage multiple agent tasks with custom endpoints and parameters.</p>

        {/* Task List */}
        <div className="space-y-6 mb-8">
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onUpdate={updateTask}
              onRemove={removeTask}
            />
          ))}

          {tasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <Plus className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-lg font-medium">No tasks created yet</p>
              <p className="text-sm text-gray-500">Click "Add Task" to get started</p>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={addTask}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" /> Add Task
          </button>

          <button
            onClick={handleSaveAndRun}
            disabled={isLoading || tasks.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
          >
            <Play className="h-5 w-5" /> {isLoading ? 'Running...' : 'Save & Run Agent'}
          </button>
        </div>

        {/* Status */}
        {message && (
          <div
            className={`mt-6 p-4 rounded-lg ${
              message.startsWith('Error') || message.startsWith('Invalid') || message.startsWith('Network')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard = ({ task, index, onUpdate, onRemove }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-semibold text-sm">
          {index + 1}
        </div>
        <h3 className="text-lg font-semibold">Agent Task {index + 1}</h3>
      </div>
      <button
        onClick={() => onRemove(task.id)}
        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
      >
        <X className="h-5 w-5" />
      </button>
    </div>

    {/* Inputs */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium mb-2">Task Name *</label>
        <input
          type="text"
          value={task.name}
          onChange={(e) => onUpdate(task.id, 'name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Endpoint URL *</label>
        <input
          type="text"
          value={task.endpoint}
          onChange={(e) => onUpdate(task.id, 'endpoint', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Parameters (JSON)</label>
        <textarea
          value={task.params}
          onChange={(e) => onUpdate(task.id, 'params', e.target.value)}
          placeholder='{"key": "value"}'
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description *</label>
        <textarea
          value={task.description}
          onChange={(e) => onUpdate(task.id, 'description', e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none"
        />
      </div>
    </div>
  </div>
);

export default AIAssistancePanel;
