import React from 'react';
import Button from './Button';
import { FolderOpen } from 'lucide-react';

const EmptyState = ({ message, actionLabel, onAction }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200 text-center animate-fade-in hover:bg-gray-50 transition-colors">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium text-lg max-w-md mb-6">
                {message}
            </p>
            
            {actionLabel && onAction && (
                <Button variant="secondary" onClick={onAction} className="border border-gray-200 shadow-sm">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
};

export default EmptyState;