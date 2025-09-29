import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const faqQuestions = [
    'Which license types do you offer?',
    'How do I switch from automatic to manual driving licence?',
    'What Light Motor Vehicle packages are available?',
    'Can I get Price for LMV Courses',
    'Can I reschedule lessons or add extra hours?',
    'How many tests do I need to pass to obtain my LMV licence?',
    'Which documents are needed to register?',
    'Are there packages for students/corporate groups?',
    'Can I add extra practice sessions before the final test?'
];

const FAQGrid = ({ onSendMessage }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
            {faqQuestions.map((question, index) => (
                <Card
                    key={index}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-blue-300 bg-white border border-gray-200 rounded-xl"
                    onClick={() => onSendMessage(question)}
                >
                    <CardContent className="p-4">
                        <p className="text-sm text-gray-800 leading-relaxed">
                            {question}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default FAQGrid;

