import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    FileText, 
    Info, 
    GraduationCap, 
    Tag, 
    MapPin,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const suggestionChips = [
    { label: 'Courses Information', icon: FileText },
    { label: 'Know more about us', icon: Info },
    { label: 'Training Courses', icon: GraduationCap },
    { label: 'Offers', icon: Tag },
    { label: 'Find Us', icon: MapPin },
];

const SuggestionChips = ({ onSendMessage }) => {
    return (
        <div className="flex items-center justify-center gap-2 mb-8">
            <Button variant="ghost" size="sm" disabled className="p-2">
                <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex gap-2 flex-wrap justify-center">
                {suggestionChips.map((chip, index) => {
                    const IconComponent = chip.icon;
                    return (
                        <Button
                            key={chip.label}
                            variant={index === 0 ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => onSendMessage(chip.label)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all hover:shadow-md ${
                                index === 0 
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                            }`}
                        >
                            <IconComponent className="h-4 w-4" />
                            {chip.label}
                        </Button>
                    );
                })}
            </div>
            
            <Button variant="ghost" size="sm" className="p-2">
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
};

export default SuggestionChips;

