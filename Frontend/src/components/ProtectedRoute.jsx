// src/components/ProtectedRoute.jsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react'; // Or your preferred loading spinner

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // Show a full-page loader while auth state is being determined
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // If the user is not logged in, redirect them to the landing page.
    // We also pass the original location they tried to access, so we can
    // redirect them back after they log in (optional but good UX).
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If the user is authenticated, render the child component (the protected page).
  return children;
};

export default ProtectedRoute;