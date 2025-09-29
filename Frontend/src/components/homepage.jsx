// src/components/homepage.jsx (MainLayout1)

import React, { useState } from 'react';
import TopBar from './TopBar';
import LandingPage from './LandingPage';
import LoginForm from './LoginForm';
import { useAuth } from '../contexts/AuthContext';

const MainLayout1 = () => {
    const { isAuthenticated } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [loginInitialMode, setLoginInitialMode] = useState('login');

    const openLogin = () => {
        setLoginInitialMode('login');
        setShowLoginModal(true);
    };

    const openSignup = () => {
        setLoginInitialMode('signup');
        setShowLoginModal(true);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* The TopBar will receive handlers to open the login/signup modal */}
            <TopBar 
                isAuthenticated={isAuthenticated}
                onLoginClick={openLogin}
                onSignupClick={openSignup}
            />
            
            <main className="pt-16">
                {/* This component can now have its own content, like the LandingPage */}
                <LandingPage />
            </main>
            
            {/* The LoginForm is rendered as a modal controlled by this layout */}
            {showLoginModal && (
                <LoginForm
                    onClose={() => setShowLoginModal(false)}
                    initialMode={loginInitialMode}
                />
            )}
        </div>
    );
};

export default MainLayout1;