// src/pages/AgenticWorkspace/ThemeCustomizer.jsx
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

// Mock chat bubble component for preview
const ChatBubble = ({ type, theme }) => (
  <div className={`p-3 max-w-[70%] rounded-lg ${type === 'incoming' ? 'bg-gray-200' : 'text-white'}`}
    style={{
      backgroundColor: type === 'outgoing' ? theme.primaryColor : '#E5E7EB',
      borderRadius: `${theme.radius}px`
    }}
  >
    {type === 'incoming' ? 'Incoming' : 'Outgoing'} message
  </div>
);

const ThemeCustomizer = ({ theme, setTheme }) => {
  const handleThemeChange = (key, value) => {
    setTheme(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-8">
      {/* --- Color --- */}
      <div>
        <Label className="font-semibold">Primary Color</Label>
        <p className="text-sm text-gray-500 mb-2">Customize the main color of your bot.</p>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={theme.primaryColor}
            onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
            className="w-10 h-10 p-1 border rounded-md cursor-pointer"
          />
          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">#</span>
            <input
              type="text"
              value={theme.primaryColor.substring(1)}
              onChange={(e) => handleThemeChange('primaryColor', `#${e.target.value}`)}
              className="w-full p-2 pl-6 border rounded-md"
              maxLength="6"
            />
          </div>
        </div>
      </div>

      {/* --- Message Style --- */}
      <div>
        <Label className="font-semibold">Messages</Label>
        <p className="text-sm text-gray-500 mb-4">Preview how messages will appear.</p>
        <div className="p-4 bg-gray-100 rounded-lg space-y-3">
          <div className="flex justify-start"><ChatBubble type="incoming" theme={theme} /></div>
          <div className="flex justify-end"><ChatBubble type="outgoing" theme={theme} /></div>
        </div>
      </div>

      {/* --- Radius --- */}
      <div>
        <Label htmlFor="radius-slider" className="font-semibold">Radius</Label>
        <p className="text-sm text-gray-500 mb-2">Adjust the roundness of the corners.</p>
        <div className="flex items-center gap-4">
          <Slider
            id="radius-slider"
            min={0}
            max={24}
            step={1}
            value={[theme.radius]}
            onValueChange={(value) => handleThemeChange('radius', value[0])}
          />
          <span className="text-sm text-gray-600 w-8 text-center">{theme.radius}px</span>
        </div>
      </div>

      {/* --- Font --- */}
      <div>
        <Label htmlFor="font-select" className="font-semibold">Font</Label>
        <p className="text-sm text-gray-500 mb-2">Select a font for your bot.</p>
        <Select value={theme.font} onValueChange={(value) => handleThemeChange('font', value)}>
          <SelectTrigger id="font-select">
            <SelectValue placeholder="Select a font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Inter">Inter</SelectItem>
            <SelectItem value="Roboto">Roboto</SelectItem>
            <SelectItem value="Open Sans">Open Sans</SelectItem>
            <SelectItem value="Lato">Lato</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
       {/* --- Custom CSS --- */}
      <div>
        <Label htmlFor="custom-css" className="font-semibold">Custom Styles (CSS)</Label>
        <p className="text-sm text-gray-500 mb-2">Apply your own custom CSS for advanced styling.</p>
        <textarea
          id="custom-css"
          value={theme.customCSS}
          onChange={(e) => handleThemeChange('customCSS', e.target.value)}
          rows={8}
          className="w-full p-2 border rounded-md font-mono text-sm"
          placeholder="/* Your CSS styles here */"
        />
      </div>

      <div className="pt-4 border-t">
        <Button>Save Configuration</Button>
      </div>
    </div>
  );
};

export default ThemeCustomizer;