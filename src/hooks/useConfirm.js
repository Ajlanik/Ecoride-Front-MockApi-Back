// src/hooks/useConfirm.js
import { useState, useCallback } from 'react';

export const useConfirm = () => {
    const [confirmState, setConfirmState] = useState({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'Confirmer',
        isDanger: false,
        onConfirm: () => { },
    });

    const askConfirmation = useCallback(({ 
        title, 
        message, 
        confirmText = "Confirmer", 
        isDanger = false, 
        onConfirm 
    }) => {
        setConfirmState({
            isOpen: true,
            title,
            message,
            confirmText,
            isDanger,
            // On enveloppe l'action pour fermer le popup automatiquement après
            onConfirm: async () => {
                if (onConfirm) await onConfirm();
                close();
            }
        });
    }, []);

    const close = useCallback(() => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
    }, []);

    return {
        confirmState,
        askConfirmation,
        closeConfirm: close
    };
};