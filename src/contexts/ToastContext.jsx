// contexts/ToastContext.jsx
// pour gérer les notifications toast dans l'application

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/ui/Toast';

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({ show: false, message: "", type: "info" });

    // useCallback pour éviter les re-rendus inutiles
    const triggerToast = useCallback((message, type = "success") => {
        setToast({ show: true, message, type });
    }, []);

    const hideToast = useCallback(() => {
        setToast((prev) => ({ ...prev, show: false }));
    }, []);

    return (
        <ToastContext.Provider value={{ triggerToast }}>
            {children}
            
            
            {toast.show && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={hideToast} 
                />
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast doit être utilisé à l'intérieur d'un ToastProvider");
    }
    return context;
};