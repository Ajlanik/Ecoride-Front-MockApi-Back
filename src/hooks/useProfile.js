// src/hooks/useProfile.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { UserService } from '../services/userService';

export const useProfile = (user) => {
    const { updateUser, logout } = useAuth();
    const { triggerToast } = useToast();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        firstName: "", 
        lastName: "", 
        phoneNumber: "", 
        bio: "", 
        nationalId: "", 
        dateOfBirth: "", 
        avatar: ""
    });

    const [displayDate, setDisplayDate] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    // Est-ce que l'identité est verrouillée ?
    const isIdentityLocked = !!(user?.nationalId && user?.firstName && user?.lastName && user?.dateOfBirth);

    // Initialisation
    useEffect(() => {
        if (user) {
            let formattedDate = "";
            if (user.dateOfBirth) {
                try {
                    formattedDate = new Date(user.dateOfBirth).toISOString().split("T")[0];
                } catch (e) { console.error(e); }
            }
            setDisplayDate(formattedDate);

            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || "",
                bio: user.bio || "",
                nationalId: user.nationalId || "",
                dateOfBirth: user.dateOfBirth || "",
                avatar: user.picture || ""
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === "dateOfBirth") {
            setDisplayDate(value);
        }
    };

    const handleImageUploaded = (url) => {
        setFormData(prev => ({ ...prev, avatar: url }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const payload = { ...formData };
            
            // Nettoyage des champs vides pour envoyer null
            if (payload.dateOfBirth === "") payload.dateOfBirth = null;
            if (payload.bio === "") payload.bio = null;
            if (payload.nationalId === "") payload.nationalId = null;
            if (payload.phoneNumber === "") payload.phoneNumber = null;
            
            const updatedUser = await UserService.update(user.id, payload);
            updateUser(updatedUser);
            triggerToast("Profil mis à jour avec succès !", "success");

        } catch (error) {
            console.error("Erreur update", error);
            triggerToast("Erreur lors de la sauvegarde. Réessayez.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDeleteAccount = async () => {
        try {
            await UserService.delete(user.id);
            logout();
            navigate("/");
        } catch (error) {
            console.error("Erreur suppression", error);
            setShowDeletePopup(false);
            triggerToast("Impossible de supprimer le compte.", "error");
        }
    };

    return {
        formData,
        displayDate,
        isSaving,
        isIdentityLocked,
        showSecurity, setShowSecurity,
        showDeletePopup, setShowDeletePopup,
        handleChange,
        handleImageUploaded,
        handleSubmit,
        confirmDeleteAccount
    };
};