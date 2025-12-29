// src/components/ui/ConfirmPopup.jsx
import React from 'react';
import Popup from './Popup';
import Button from './Button';

const ConfirmPopup = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "Confirmation", 
    message = "Êtes-vous sûr ?", 
    confirmText = "Confirmer", 
    cancelText = "Annuler",
    isDanger = false 
}) => {
    return (
        <Popup isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
            <div className="flex flex-col gap-6">
                <p className="text-gray-600 text-base leading-relaxed">
                    {message}
                </p>
                
                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="secondary" onClick={onClose}>
                        {cancelText}
                    </Button>
                    <Button 
                        variant={isDanger ? "danger" : "primary"} 
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default ConfirmPopup;