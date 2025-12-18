// components/ui/Popup.jsx
// pour afficher une popup modale avec un fond sombre et un contenu centré

import React, { useEffect } from 'react';

const Popup = ({ isOpen, onClose, title, children, maxWidth = "max-w-lg", padding = true }) => {
    // Empêcher le scroll du body quand la popup est ouverte
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
            {/* Backdrop (Fond sombre) */}
            <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" 
                onClick={onClose}
            ></div>

            {/* Contenu Popup */}
            <div className={`bg-white rounded-[2rem] shadow-2xl w-full ${maxWidth} relative z-10 flex flex-col max-h-[90vh] animate-slide-up border border-white/20 overflow-hidden`}>
                
                {/* Header (Affiché uniquement si un titre est donné) */}
                {title && (
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 shrink-0">
                        <h3 className="text-xl font-bold text-emerald-950 truncate pr-4">{title}</h3>
                        <button 
                            onClick={onClose} 
                            className="btn btn-circle btn-sm btn-ghost hover:bg-gray-100 text-gray-500 border-none"
                        >
                            ✕
                        </button>
                    </div>
                )}

                {/* Body */}
                <div className={`overflow-y-auto custom-scrollbar ${padding ? 'p-6' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Popup;