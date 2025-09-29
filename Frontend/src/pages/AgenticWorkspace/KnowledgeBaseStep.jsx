// --- START OF FILE: src/pages/AgenticWorkspace/KnowledgeBaseStep.jsx (Modified) ---

import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { UploadCloud, XCircle, Link as LinkIcon } from 'lucide-react';

const API_UPLOAD_URL = 'http://localhost:8000/api/upload';
const API_INGEST_URL = 'http://localhost:8000/api/ingest-url'; // <<< New API endpoint

const KnowledgeBaseStep = ({ onNext, onBack, initialData }) => {
    const { token } = useAuth();
    
    // State for both files and URLs
    const [files, setFiles] = useState(initialData.knowledge_base_files || []);
    const [urls, setUrls] = useState(initialData.knowledge_base_urls || []);
    
    // State for the URL input field
    const [currentUrl, setCurrentUrl] = useState('');
    
    // State for loading and errors
    const [isUploading, setIsUploading] = useState(false);
    const [isIngestingUrl, setIsIngestingUrl] = useState(false);
    const [error, setError] = useState('');

    const fileInputRef = useRef(null);

    // --- File Upload Logic (Unchanged) ---
    const handleFileChange = async (event) => {
        const selectedFile = event.target.files[0];
        if (!selectedFile) return;
        setIsUploading(true);
        setError('');
        const formData = new FormData();
        formData.append('file', selectedFile);
        try {
            await axios.post(API_UPLOAD_URL, formData, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setFiles(prev => [...prev, selectedFile.name]);
        } catch (err) {
            setError(err.response?.data?.detail || 'File upload failed.');
        } finally {
            setIsUploading(false);
        }
    };
    
    // --- NEW: URL Ingestion Logic ---
    const handleAddUrl = async () => {
        if (!currentUrl.trim()) return;
        setIsIngestingUrl(true);
        setError('');
        try {
            await axios.post(API_INGEST_URL, { url: currentUrl }, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            setUrls(prev => [...prev, currentUrl]);
            setCurrentUrl(''); // Clear the input field on success
        } catch (err) {
            setError(err.response?.data?.detail || `Failed to ingest URL: ${currentUrl}`);
        } finally {
            setIsIngestingUrl(false);
        }
    };

    // --- Functions to remove items from the lists ---
    const removeFile = (fileName) => setFiles(files.filter(f => f !== fileName));
    const removeUrl = (urlToRemove) => setUrls(urls.filter(u => u !== urlToRemove));
    
    // --- Pass all knowledge sources to the next step ---
    const handleSubmit = () => {
        onNext({ knowledge_base_files: files, knowledge_base_urls: urls });
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold text-center mb-1">Knowledge Base</h2>
            <p className="text-center text-gray-500 mb-6">Add content for your bot to learn from.</p>
            
            {/* --- NEW: URL Input Section --- */}
            <div className="mb-6">
                <label htmlFor="url-input" className="block text-sm font-medium text-gray-700 mb-1">
                    Add from Website URL
                </label>
                <div className="flex gap-2">
                    <input
                        id="url-input"
                        type="url"
                        value={currentUrl}
                        onChange={(e) => setCurrentUrl(e.target.value)}
                        placeholder="https://example.com/about"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                        onClick={handleAddUrl}
                        disabled={isIngestingUrl}
                        className="bg-blue-600 text-white px-4 rounded-md hover:bg-blue-700 font-semibold disabled:bg-blue-300"
                    >
                        {isIngestingUrl ? 'Adding...' : 'Add'}
                    </button>
                </div>
            </div>

            {/* File Upload Section (Unchanged UI) */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-6">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileInputRef.current.click()} disabled={isUploading} className="mx-auto bg-gray-100 p-4 rounded-full">
                    <UploadCloud className="h-8 w-8 text-gray-500" />
                </button>
                <p className="mt-2 text-sm text-gray-600">
                    {isUploading ? 'Uploading...' : 'or click to upload files'}
                </p>
            </div>
            
            {/* Display error message if any */}
            {error && <p className="text-red-500 text-center text-sm mb-4">{error}</p>}

            {/* --- NEW: Combined Display for All Sources --- */}
            {(files.length > 0 || urls.length > 0) && (
                <div className="mb-6">
                    <h3 className="font-semibold mb-2">Ingested Sources:</h3>
                    <ul className="space-y-2">
                        {urls.map(url => (
                            <li key={url} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="flex items-center gap-2 text-sm">
                                    <LinkIcon className="h-4 w-4 text-gray-500" /> {url}
                                </span>
                                <button onClick={() => removeUrl(url)}>
                                    <XCircle className="h-5 w-5 text-gray-500 hover:text-red-600" />
                                </button>
                            </li>
                        ))}
                        {files.map(file => (
                            <li key={file} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm">{file}</span>
                                <button onClick={() => removeFile(file)}>
                                    <XCircle className="h-5 w-5 text-gray-500 hover:text-red-600" />
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            {/* Navigation Buttons (Unchanged) */}
            <div className="flex justify-between mt-8">
                <button onClick={onBack} className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 font-semibold">
                    Back
                </button>
                <button onClick={handleSubmit} className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-semibold">
                    Next
                </button>
            </div>
        </div>
    );
};

export default KnowledgeBaseStep;