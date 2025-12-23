import React, { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
    
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    // Configuration des styles et icônes
    const config = {
        success: { 
            style: "alert-success text-white border-emerald-500 bg-emerald-600", 
            Icon: CheckCircle 
        },
        error: { 
            style: "alert-error text-white bg-red-500 border-red-500", 
            Icon: XCircle 
        },
        info: { 
            style: "alert-info text-white bg-blue-500 border-blue-500", 
            Icon: Info 
        },
        warning: { 
            style: "alert-warning text-black bg-yellow-400 border-yellow-400", 
            Icon: AlertTriangle 
        }
    };

    const { style, Icon } = config[type] || config.info;

    return (
        <div className="toast toast-bottom toast-end z-[9999] animate-fade-in-up">
            <div className={`alert ${style} shadow-xl rounded-xl flex items-center gap-3 pr-4 min-w-[300px]`}>
                
                {/* Icône SVG */}
                <Icon className="w-6 h-6 shrink-0" />
                
                <span className="font-medium flex-1">{message}</span>
                
                {/* Bouton fermer discret */}
                <button onClick={onClose} className="btn btn-xs btn-circle btn-ghost opacity-70 hover:opacity-100">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Toast;