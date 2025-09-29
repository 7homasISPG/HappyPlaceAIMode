import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

const LoadingIndicator = () => {
    return (
        <div className="flex justify-start mb-4">
            <div className="flex items-start space-x-3">
                <Avatar className="w-8 h-8 bg-blue-600 flex-shrink-0">
                    <AvatarFallback className="text-black text-sm font-medium">
                        A
                    </AvatarFallback>
                </Avatar>
                <Card className="bg-white border border-gray-200 shadow-sm">
                    <CardContent className="p-4">
                        <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default LoadingIndicator;

