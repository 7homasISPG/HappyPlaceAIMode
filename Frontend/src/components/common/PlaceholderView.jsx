// src/components/common/PlaceholderView.jsx
import React from 'react';

const PlaceholderView = ({ title }) => (
  <div className="flex-grow flex justify-center items-center h-full p-6">
    <div className="text-center">
      <h2 className="text-2xl font-semibold text-gray-400">{title}</h2>
      <p className="text-gray-500">This feature is coming soon.</p>
    </div>
  </div>
);

export default PlaceholderView;