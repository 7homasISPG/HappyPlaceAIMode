// src/pages/Studio/DocumentStore.jsx
import React from 'react';
import KnowledgeBaseStep from '../AgenticWorkspace/KnowledgeBaseStep';

const DocumentStore = ({ onBack }) => {
  return (
    <div className="p-6 overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Document Store</h1>
      <p className="text-gray-600 mb-6">
        Manage your knowledge base documents and web sources here. 
        These will be available across your agents and chatflows.
      </p>

      <KnowledgeBaseStep
        initialData={{}} // You can hydrate with existing sources
        onNext={(data) => console.log("Saved sources:", data)}
        onBack={onBack}
      />
    </div>
  );
};

export default DocumentStore;
