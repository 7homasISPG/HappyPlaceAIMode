import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

const AnswerView = ({ text, citations, followUps, onFollowUpClick, formattedTime }) => {
    return (
        <div className="p-4 space-y-4 relative">
            {/* Main answer text */}
            <div className="prose prose-sm max-w-none">
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                    {text}
                </p>
            </div>

            {/* Citations */}
            {citations && citations.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Sources ({citations.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {citations.slice(0, 3).map((citation, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="text-xs cursor-pointer hover:bg-gray-50"
                                onClick={() => citation.source && window.open(citation.source, '_blank')}
                            >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {index + 1}
                            </Badge>
                        ))}
                        {citations.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{citations.length - 3} more
                            </Badge>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">
                        View full sources in the right panel
                    </p>
                </div>
            )}

            {/* Follow-up questions */}
            {followUps && followUps.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                        Related Questions
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {followUps.map((followUp, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => onFollowUpClick(followUp)}
                                className="text-xs h-auto py-2 px-3 rounded-full hover:bg-blue-50 hover:border-blue-300"
                            >
                                {followUp}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Timestamp */}
            {formattedTime && (
                <p className="absolute bottom-1 right-2 text-[10px] text-gray-500">
                    {formattedTime}
                </p>
            )}
        </div>
    );
};


export default AnswerView;

