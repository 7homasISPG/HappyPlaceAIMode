import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
    Home,
    Grid3X3,
    Layers,
    BookOpen,
    Briefcase,
    ChevronDown,
    Menu,
    Tag, 
    PlayCircle,
    X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserProfile from './UserProfile';
import LoginForm from './LoginForm';
import { Link, useLocation } from 'react-router-dom';

// Static dropdown menu data - moved outside component to prevent recreation
const MENU_ITEMS = {
    Platform: [
        {
            heading: "Enterprise-Grade Agentic AI Platform",
            description: "Leverage the power of 15+ cutting edge LLMs to drive exceptional autonomous experiences for your customers and employees"
        },
        { heading: "AI Agent Builder", description: "Create powerful enterprise-ready agents for any channel in minutes" },
        { heading: "Conversational Knowledge Base", description: "Unleash the true potential of enterprise intelligence via Agentic RAG" },
        { heading: "AI Copilot", description: "Preview, debug and optimize AI agent performance in no time" },
        { heading: "Automated Testing", description: "Ship reliable AI agents faster" },
        { heading: "Analytics", description: "Measure\nAnalyze" },
        { heading: "Channels", description: "Voice & Calls\nText & Chat\nEmail Automation" },
        { heading: "Human + AI", description: "Agent Assist" },
        { heading: "Safe AI", description: "Enterprise-grade Security" },
        { heading: "Integrations", description: "Zendesk, Freshdesk, Hubspot, Genesys, All Integrations" }
    ],
    Solutions: [
        { heading: "Customer Service", description: "Automate & personalize customer support" },
        { heading: "Employee Experience", description: "Enrich & elevate employee experience" },
        { heading: "BFSI", description: "Solutions for banking financial services & insurance industry" },
        { heading: "Healthcare", description: "Solutions for healthcare and pharmaceuticals industry" },
        { heading: "Utilities", description: "Solutions for oil, gas and utility industry" },
        { heading: "Retail", description: "Solution for retail and e-commerce industry" },
        { heading: "Other Industries", description: "Dynamic AI solutions for every industry" }
    ],
    Resources: [
        { heading: "Resource Library", description: "Dive into our strategic guides, industry insights, blogs, podcasts, and more" },
        { heading: "Case Studies & Testimonials", description: "Success stories and testimonials from our customers across industries" },
        { heading: "ROI Calculator", description: "See how much you can save with Yellow.ai" },
        { heading: "Agentic AI 101", description: "What Is It, How It Works, and How It Differs from AI Agents" },
        { heading: "Customer Service Automation", description: "A Full Guide" },
        { heading: "The Ultimate Guide to Voice AI Agents", description: "For Business" }
    ]
};

// Optimized dropdown component with better performance
const DropdownMenu = React.memo(({ title, icon: Icon, items }) => (
    <div className="group relative flex items-center">
        <button 
            className="flex items-center text-gray-700 hover:text-blue-600 px-3 py-2 font-medium text-sm transition-colors duration-200"
            aria-label={`${title} menu`}
        >
            <Icon className="h-4 w-4 mr-1" aria-hidden="true" />
            {title}
            <ChevronDown className="ml-1 h-4 w-4 transition-transform duration-200 group-hover:rotate-180" aria-hidden="true" />
        </button>
        <div className="absolute top-full left-0 hidden group-hover:block bg-white shadow-xl border border-gray-200 w-[600px] p-6 z-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
                {items.map((item, idx) => (
                    <div 
                        key={`${title}-${idx}`} 
                        className={`${item.highlight ? "bg-gradient-to-r from-purple-100 to-yellow-100 p-3 rounded-lg" : "p-2"} hover:bg-gray-50 transition-colors duration-150 cursor-pointer`}
                    >
                        <h4 className="font-semibold text-sm text-gray-900">{item.heading}</h4>
                        <p className="text-xs text-gray-600 mt-1 whitespace-pre-line leading-relaxed">{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
    </div>
));

DropdownMenu.displayName = 'DropdownMenu';

// Navigation link component for better reusability
const NavLink = React.memo(({ to, icon: Icon, children, isActive, className = "" }) => (
    <Link to={to}>
        <Button 
            variant="ghost" 
            size="sm" 
            className={`font-medium hover:bg-blue-50 text-sm transition-colors duration-200 ${
                isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-600'
            } ${className}`}
        >
            {Icon && <Icon className="h-4 w-4 mr-1" aria-hidden="true" />}
            {children}
        </Button>
    </Link>
));

NavLink.displayName = 'NavLink';

// Mobile menu component
const MobileMenu = React.memo(({ isOpen, onClose, isAuthenticated, onLogin, onSignup }) => {
    const location = useLocation();
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 lg:hidden">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
            <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-xl">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
                <nav className="p-4 space-y-2">
                    <NavLink to="/" icon={Home} isActive={location.pathname === '/'}>
                        Home Page
                    </NavLink>
                    <NavLink to="/ai-assistance" icon={Grid3X3} isActive={location.pathname === '/ai-assistance'}>
                        AI Assistance
                    </NavLink>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                        <Layers className="h-4 w-4 mr-2" />
                        Platform
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Solutions
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                        <Grid3X3 className="h-4 w-4 mr-2" />
                        Resources
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-gray-700">
                        Pricing
                    </Button>
                    <NavLink to="/ai-page" icon={PlayCircle} isActive={location.pathname === '/ai-page'}>
                        Demo Hub
                    </NavLink>
        
                </nav>
                {!isAuthenticated && (
                    <div className="p-4 border-t space-y-2">
                        <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() => {
                                onLogin();
                                onClose();
                            }}
                        >
                            Login
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full border-blue-600 text-blue-600 hover:bg-blue-50"
                            onClick={() => {
                                onSignup();
                                onClose();
                            }}
                        >
                            Sign up
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
});

MobileMenu.displayName = 'MobileMenu';

const TopBar = ({ isAuthenticated }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [startInLoginMode, setStartInLoginMode] = useState(true);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Memoized handlers to prevent unnecessary re-renders
    const openLogin = useCallback(() => {
        setStartInLoginMode(true);
        setShowLoginModal(true);
    }, []);

    const openSignup = useCallback(() => {
        setStartInLoginMode(false);
        setShowLoginModal(true);
    }, []);

    const closeLoginForm = useCallback(() => {
        setShowLoginModal(false);
    }, []);

    const toggleMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(prev => !prev);
    }, []);

    const closeMobileMenu = useCallback(() => {
        setIsMobileMenuOpen(false);
    }, []);

    // Memoized dropdown menus to prevent recreation
    const dropdownMenus = useMemo(() => [
        { title: "Platform", icon: Layers, items: MENU_ITEMS.Platform },
        { title: "Solutions", icon: BookOpen, items: MENU_ITEMS.Solutions },
        { title: "Resources", icon: Grid3X3, items: MENU_ITEMS.Resources }
    ], []);

    return (
        <>
            <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 backdrop-blur-sm bg-white/95">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center">
                                <img
                                    src="/oorjit_logo.png"
                                    alt="oorjit Logo"
                                    className="h-10 "
                                    loading="eager"
                                />
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <nav className="hidden lg:flex items-center space-x-1">
                            <NavLink to="/" icon={Home} isActive={location.pathname === '/'}>
                                Home Page
                            </NavLink>
                            <NavLink to="/ai-assistance" icon={Grid3X3} isActive={location.pathname === '/ai-assistance'}>
                                AI Assistance
                            </NavLink>
                            
                            {dropdownMenus.map(menu => (
                                <DropdownMenu 
                                    key={menu.title}
                                    title={menu.title} 
                                    icon={menu.icon} 
                                    items={menu.items} 
                                />
                            ))}
                            
                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-700 hover:text-blue-600 text-sm transition-colors duration-200"
                            >
                            <Tag className="h-4 w-4 mr-1" aria-hidden="true" />
                            Pricing
                            </Button>

                            <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-700 hover:text-blue-600 text-sm transition-colors duration-200"
                            >
                            <PlayCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                            Demo Hub
                            </Button>
    
                        </nav>

                        {/* Auth Buttons & Mobile Menu */}
                        <div className="flex items-center space-x-3">
                            {isAuthenticated ? (
                                <UserProfile compact={true} />
                            ) : (
                                <div className="hidden sm:flex items-center space-x-3">
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 text-sm transition-colors duration-200"
                                        onClick={openLogin}
                                    >
                                        Login
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="border-blue-600 text-blue-600 hover:bg-blue-50 rounded-full px-6 text-sm transition-colors duration-200"
                                        onClick={openSignup}
                                    >
                                        Sign up
                                    </Button>
                                </div>
                            )}
                            
                            {/* Mobile menu button */}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="lg:hidden"
                                onClick={toggleMobileMenu}
                                aria-label="Toggle mobile menu"
                            >
                                <Menu className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            <MobileMenu
                isOpen={isMobileMenuOpen}
                onClose={closeMobileMenu}
                isAuthenticated={isAuthenticated}
                onLogin={openLogin}
                onSignup={openSignup}
            />

            {/* Login Modal */}
            {showLoginModal && (
                <LoginForm
                    onClose={closeLoginForm}
                    initialMode={startInLoginMode ? 'login' : 'signup'}
                />
            )}
        </>
    );
};

export default TopBar;