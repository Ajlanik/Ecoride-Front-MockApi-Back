import React from 'react';
import Button from './Button';

const EmptyState = ({ message, icon = "📂", actionLabel, onAction }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 text-center animate-fade-in">
            <div className="text-5xl mb-4 opacity-50 grayscale">
                {icon}
            </div>
            <p className="text-gray-500 font-medium text-lg max-w-md mb-6">
                {message}
            </p>
            
            {actionLabel && onAction && (
                <Button variant="secondary" onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;