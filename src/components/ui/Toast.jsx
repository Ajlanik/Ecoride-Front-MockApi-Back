import React, { useEffect } from 'react';

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
    
    // Auto-fermeture après 'duration' (3 secondes par défaut)
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [message, duration, onClose]);

    if (!message) return null;

    // Styles selon le type
    const styles = {
        success: "alert-success text-white border-emerald-500 bg-emerald-600",
        error: "alert-error text-white bg-red-500 border-red-500",
        info: "alert-info text-white bg-blue-500",
        warning: "alert-warning text-black bg-yellow-400"
    };

    return (
        <div className="toast toast-bottom toast-end z-[9999] animate-fade-in-up">
            <div className={`alert ${styles[type] || styles.info} shadow-xl rounded-xl flex items-center gap-3 pr-6 min-w-[250px]`}>
                {/* Icône selon le type */}
                <span className="text-xl">
                    {type === 'success' && '✅'}
                    {type === 'error' && '❌'}
                    {type === 'warning' && '⚠️'}
                    {type === 'info' && 'ℹ️'}
                </span>
                <span className="font-bold text-sm">{message}</span>
            </div>
        </div>
    );
};

export default Toast;