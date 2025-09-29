// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import MainLayout1 from './components/homepage'; // This is your Landing Page
import AIAssistance from './components/AIAssistance'; // The configuration page
import ProtectedRoute from './components/ProtectedRoute'; // Import our new component
import EmbedPage from './pages/EmbedPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* --- Public Route --- */}
          {/* Everyone can see the landing page. */}
          <Route path="/" element={<MainLayout1 />} />
          <Route path="/embed/:agentId" element={<EmbedPage />} /> 

          {/* --- Protected Routes --- */}
          {/* Only logged-in users can access these routes. */}
          {/* The ProtectedRoute component will handle the logic. */}
          
          <Route 
            path="/ai-assistance" 
            element={
              <ProtectedRoute>
                <MainLayout /> 
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/agent-config" // A more descriptive name for the AIAssistance page
            element={
              <ProtectedRoute>
                <AIAssistance /> 
              </ProtectedRoute>
            } 
          />
          
          {/* You can add more protected routes here as needed */}
          {/* For example:
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          */}

          {/* --- Catch-all Route for 404 Not Found (Optional but recommended) --- */}
          <Route path="*" element={<h1>404: Page Not Found</h1>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;