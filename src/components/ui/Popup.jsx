// src/components/ui/Popup.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

const Popup = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg", padding = true }) => {
    
    // Empêcher le scroll de la page derrière la popup
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    // Contenu de la popup
    const popupContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            
            {/* Backdrop (Fond sombre) */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Fenêtre */}
            <div className={`
                bg-base-100 text-base-content
                rounded-[2rem] shadow-2xl w-full ${maxWidth} 
                relative z-10 flex flex-col 
                max-h-[90vh] animate-scale-up 
                border border-base-200 overflow-hidden
            `}>
                
                {/* Header */}
                <div className="flex justify-between items-center p-5 border-b border-base-200 shrink-0 bg-base-100">
                    <h3 className="text-xl font-bold truncate pr-4">
                        {title || "Détails"}
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="btn btn-circle btn-sm btn-ghost hover:bg-base-200 text-base-content/50"
                    >
                        ✕
                    </button>
                </div>

                {/* Body Scrollable */}
                <div className={`overflow-y-auto custom-scrollbar ${padding ? 'p-6' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );

    // Injection directe dans le body pour éviter les problèmes de z-index
    return createPortal(popupContent, document.body);
};

export default Popup;