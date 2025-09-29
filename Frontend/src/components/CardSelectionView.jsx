import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CardSelectionView = ({ data, onCardClick }) => {
    if (!data || !Array.isArray(data)) {
        return (
            <div className="p-4">
                <p className="text-sm text-gray-500">No card data available</p>
            </div>
        );
    }

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.map((card, index) => (
                    <Card
                        key={index}
                        className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-blue-300 bg-white border border-gray-200"
                        onClick={() => onCardClick(card.title || card.text || card)}
                    >
                        <CardContent className="p-4">
                            {card.title && (
                                <h3 className="font-medium text-sm text-gray-900 mb-2">
                                    {card.title}
                                </h3>
                            )}
                            {card.description && (
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    {card.description}
                                </p>
                            )}
                            {!card.title && !card.description && (
                                <p className="text-sm text-gray-800">
                                    {typeof card === 'string' ? card : JSON.stringify(card)}
                                </p>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CardSelectionView;

