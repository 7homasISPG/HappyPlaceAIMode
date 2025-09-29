import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const UserMessage = ({ message, formattedTime }) => {
    return (
        <div className="flex justify-end mb-4">
            <Card className="bg-white border border-gray-200 shadow-sm relative">
                <CardContent className="p-4 pb-6"> {/* extra bottom padding for time */}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {message.content?.text}
                    </p>
                    {formattedTime && (
                        <span className="absolute bottom-1 right-2 text-[10px] text-black">
                            {formattedTime}
                        </span>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default UserMessage;
