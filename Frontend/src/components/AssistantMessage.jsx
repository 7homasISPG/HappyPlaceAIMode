import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import TableView from './TableView';
import AnswerView from './AnswerView';
import CardSelectionView from './CardSelectionView';
import PricingView from './PricingView';

const AssistantMessage = ({ message, onSendMessage, formattedTime }) => {
    const extractReadableSourceName = (src) => {
        try {
            if (src.startsWith("http")) {
                const url = new URL(src);
                return url.hostname.replace("www.", "");
            }
            return src.split("/").pop(); // for PDFs or file paths
        } catch {
            return src;
        }
    };

    const renderMessageContent = () => {
        const { content } = message;
        console.log("Assistant Message Content:", content);

        switch (content?.type) {
            case 'table': {
                console.log("TableData:", content.data);
                const rawData = content.data;

                const headers = Array.from(
                    new Set(rawData.flatMap(obj => Object.keys(obj).filter(key => key !== 'Source')))
                );

                const rows = rawData.map(obj =>
                    headers.map(header => obj[header] || '')
                );

                // ✅ Collect sources, deduplicate, make them human-readable
                const citations = [
                    ...new Map(
                        rawData
                            .flatMap(obj => obj["Source"]?.split(',') || [])
                            .map(src => src.trim())
                            .filter(Boolean)
                            .map(src => [src, { url: src, name: extractReadableSourceName(src) }])
                    ).values()
                ];

                if (citations.length > 0 && typeof onSendMessage === 'function') {
                    onSendMessage({ type: '__setSources', data: citations });
                }

                return <TableView data={{ headers, rows }} />;
            }
            case 'pricing':
                return <PricingView payload={content.data} />;
            case 'card_selection':
                return (
                    <div className="p-2">
                        <p className="px-4 pt-2 mb-2 text-sm text-gray-800">
                            {content.text}
                        </p>
                        <CardSelectionView data={content.data} onCardClick={onSendMessage} />
                    </div>
                );
            case 'answer':  
                console.log("Answer Content:", content);
                // ✅ Ensure citations also have readable names
                const citations = (content.citations || []).map(src => ({
                    url: src,
                    name: extractReadableSourceName(src)
                }));

                return (
                    <AnswerView
                        text={content.text}
                        citations={citations}
                        followUps={content.follow_ups}
                        onFollowUpClick={onSendMessage}
                    />
                );
            default:
                return (
                    <div className="p-4">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
                            {content?.text || 'Response format not recognized.'}
                        </p>
                    </div>
                );
        }
    };

    return (
        <div className="flex justify-start mb-4">
            <div className="flex items-start space-x-3 max-w-[85%] relative">
                <Avatar className="w-8 h-8 bg-blue-600 flex-shrink-0">
                    <AvatarFallback className="text-black text-sm font-medium">
                        A
                    </AvatarFallback>
                </Avatar>
                <Card className="bg-white border border-gray-200 shadow-sm relative">
                    <CardContent className="p-0 pb-5"> {/* extra padding for time */}
                        {renderMessageContent()}
                        {formattedTime && (
                            <span className="absolute bottom-1 right-2 text-[10px] text-black">
                                {formattedTime}
                            </span>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AssistantMessage;
