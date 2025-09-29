import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const SystemMessage = ({ message, formattedTime }) => {
    return (
        <div className="flex justify-center mb-4">
            <Card className="bg-gray-100 border border-gray-200 max-w-md relative">
                <CardContent className="p-3 pb-5"> {/* extra bottom padding for time */}
                    <p className="text-sm text-gray-600 text-center">
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

export default SystemMessage;
