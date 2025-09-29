// src/pages/Studio/MainSidebar.jsx
import React from 'react';
import { Button } from '@/components/ui/button';

// --- ICONS ---
import ChatIcon from '@mui/icons-material/Chat';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlaylistPlayIcon from '@mui/icons-material/PlaylistPlay';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import StorefrontIcon from '@mui/icons-material/Storefront';
import BuildIcon from '@mui/icons-material/Build';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CodeIcon from '@mui/icons-material/Code';
import KeyIcon from '@mui/icons-material/Key';
import DescriptionIcon from '@mui/icons-material/Description';
import BugReportIcon from '@mui/icons-material/BugReport'; // <<< NEW ICON

// --- MENU ITEMS ---
const menuItems = [
  { text: 'Chatflow', icon: <ChatIcon />, id: 'Chatflow' },
  { text: 'Agentflow', icon: <AccountTreeIcon />, id: 'Agentflow' },
  { text: 'Execution', icon: <PlaylistPlayIcon />, id: 'Execution' },
  { text: 'Assistant', icon: <SupportAgentIcon />, id: 'Assistant' },
  { text: 'Marketplace', icon: <StorefrontIcon />, id: 'Marketplace' },
  { text: 'Tools', icon: <BuildIcon />, id: 'Tools' },
  { text: 'Credential', icon: <VpnKeyIcon />, id: 'Credential' },
  { text: 'Variable', icon: <CodeIcon />, id: 'Variable' },
  { text: 'API Key', icon: <KeyIcon />, id: 'APIKeys' },
  { text: 'Document Store', icon: <DescriptionIcon />, id: 'DocumentStore' },
  { text: 'Trigger Test', icon: <BugReportIcon />, id: 'TriggerTest' }, // <<< NEW LINK
];

const MainSidebar = ({ activeView, onSelectView }) => (
  <aside className="w-60 h-screen border-r bg-gray-50 p-2 flex-shrink-0">
    <nav className="flex flex-col space-y-1">
      {menuItems.map((item) => (
        <Button
          key={item.id}
          variant={activeView === item.id ? 'secondary' : 'ghost'}
          className="w-full justify-start font-medium"
          onClick={() => onSelectView(item.id)}
        >
          {item.icon}
          <span className="ml-2">{item.text}</span>
        </Button>
      ))}
    </nav>
  </aside>
);

export default MainSidebar;