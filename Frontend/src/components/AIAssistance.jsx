import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, Settings, Zap, Users,
  Link, CheckCircle, Copy,
  Code, Palette, Globe, MessageSquare
} from 'lucide-react';
import AIAssistancePanel from "./SuperAgentBuilder_1";
import SuperAgentProfile from "./SuperAgentBuilder";

const AIAssistance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);

  const integrationCode = `<!-- Add this to your website -->
<script src="https://happyplacevoice.ai/widget.js"></script>
<div id="ai-mode-widget" data-config="your-config-id"></div>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(integrationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div initial="initial" animate="animate" variants={fadeInUp} className="mb-8">
        <div className="flex items-center mb-4">
          <Bot className="w-8 h-8 text-purple-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">AI Assistance Configuration</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Configure and manage your website's AI assistance features
        </p>
      </motion.div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8">
          {[
  { id: 'overview',    label: 'Overview',      icon: Bot },
  { id: 'superagent',   label: 'Super Agent',   icon: Bot },
  { id: 'agents',       label: 'AI Agents',     icon: Users },
  { id: 'integration',  label: 'Integration',   icon: Code },
  { id: 'customization',label: 'Customization', icon: Palette }
].map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <motion.div key={activeTab} initial="initial" animate="animate" variants={fadeInUp}>

        {/* ---------------------- OVERVIEW TAB ---------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Agents</p>
                    <p className="text-2xl font-semibold text-gray-900">4</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversations</p>
                    <p className="text-2xl font-semibold text-gray-900">1,247</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-2xl font-semibold text-gray-900">94%</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Websites</p>
                    <p className="text-2xl font-semibold text-gray-900">3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---------------------- SUPER AGENT TAB ---------------------- */}
        {activeTab === 'superagent' && (
          <div className="space-y-6">
            <SuperAgentProfile />
          </div>
        )}

        {/* ----------------------- AGENTS TAB (REPLACED) ----------------------- */}
        {activeTab === 'agents' && (
          <div className="space-y-6">
            <AIAssistancePanel />
          </div>
        )}

        {/* --------------------- INTEGRATION TAB --------------------- */}
        {activeTab === 'integration' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Code</h3>
              <p className="text-gray-600 mb-4">
                Copy and paste this code into your website to enable AI assistance features.
              </p>
              <div className="relative">
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{integrationCode}</code>
                </pre>
                <button
                  onClick={handleCopyCode}
                  className="absolute top-2 right-2 bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                >
                  {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copied && <p className="text-green-600 text-sm mt-2">Code copied to clipboard!</p>}
            </div>
          </div>
        )}

        {/* --------------------- CUSTOMIZATION TAB --------------------- */}
        {activeTab === 'customization' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Interface Customization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input type="color" value="#7c3aed" className="w-10 h-10 rounded border" />
                    <input type="text" value="#7c3aed" className="flex-1 px-3 py-2 border rounded-md" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Widget Position</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>Bottom Right</option>
                    <option>Bottom Left</option>
                    <option>Top Right</option>
                    <option>Top Left</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Widget Size</label>
                  <select className="w-full px-3 py-2 border rounded-md">
                    <option>Medium</option>
                    <option>Small</option>
                    <option>Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Welcome Message</label>
                  <input
                    type="text"
                    placeholder="Hi! How can I help you today?"
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
              </div>
              <div className="mt-6">
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                  Save Changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="bg-gray-50 rounded-lg p-4 min-h-[200px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-2" />
                  <p>Widget preview will appear here</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default AIAssistance;
