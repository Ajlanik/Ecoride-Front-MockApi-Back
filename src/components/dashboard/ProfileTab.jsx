// components/dashboard/ProfileTab.jsx
// pour gérer l'onglet "Mon Profil" dans le tableau de bord utilisateur

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';

// --- IMPORTS UI (DESIGN SYSTEM) ---
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';           
import Popup from '../ui/Popup';         
// Note : On n'importe plus 'Toast' ici car il est géré globalement par App.jsx
import { useToast } from '../../contexts/ToastContext'; // <--- IMPORT DU HOOK GLOBAL

const ProfileTab = ({ user }) => {
    const { updateUser, logout } = useAuth();
    const { triggerToast } = useToast(); // <--- RÉCUPÉRATION DE LA FONCTION GLOBALE
    const navigate = useNavigate();
    
    const isIdentityLocked = !!(user?.nationalId && user?.firstName && user?.lastName && user?.dateOfBirth);

    const [formData, setFormData] = useState({
        firstName: '', lastName: '', phoneNumber: '', bio: '', nationalId: '', dateOfBirth: ''
    });
    
    const [displayDate, setDisplayDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [showSecurity, setShowSecurity] = useState(false);
    const [showDeletePopup, setShowDeletePopup] = useState(false);

    // --- (SUPPRESSION DE L'ÉTAT LOCAL DU TOAST) ---
    // On n'a plus besoin de const [toast, setToast] ni de la fonction showToast locale

    // --- INITIALISATION ---
    useEffect(() => {
        if (user) {
            let formattedDate = '';
            if (user.dateOfBirth) {
                try {
                    formattedDate = new Date(user.dateOfBirth).toISOString().split('T')[0];
                } catch (e) { console.error(e); }
            }
            setDisplayDate(formattedDate);

            setFormData({
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                phoneNumber: user.phoneNumber || '',
                bio: user.bio || '',
                nationalId: user.nationalId || '',
                dateOfBirth: user.dateOfBirth || '' 
            });
        }
    }, [user]);
     
    // --- HANDLERS ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'dateOfBirth') {
            setDisplayDate(value);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const payload = { ...formData };
            const apiResponse = await UserService.update(user.id, payload);
            updateUser(apiResponse);
            
            // --- UTILISATION DU TOAST GLOBAL ---
            triggerToast("Profil mis à jour avec succès !", "success");
            
        } catch (error) {
            console.error("Erreur update", error);
            // --- UTILISATION DU TOAST GLOBAL ---
            triggerToast("Erreur lors de la sauvegarde. Réessayez.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const confirmDeleteAccount = async () => {
        try {
            await UserService.delete(user.id);
            logout(); 
            navigate('/'); 
            // Note: Comme on change de page, le toast ne sera peut-être pas vu, 
            // mais c'est moins grave pour une suppression/déconnexion.
        } catch (error) {
            console.error("Erreur suppression", error);
            setShowDeletePopup(false);
            triggerToast("Impossible de supprimer le compte.", "error");
        }
    };

    const textareaStyle = "textarea textarea-bordered w-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all border-gray-300 text-base min-h-[120px]";
    const lockedInputClass = "bg-gray-100 border-gray-300 text-gray-900 font-bold cursor-not-allowed opacity-100";

    // --- RENDU ---
    return (
        <div className="animate-fade-in w-full space-y-6">
            
            {/* (SUPPRESSION DU COMPOSANT <Toast /> DANS LE RENDU) */}
            {/* Il est maintenant rendu une seule fois tout en haut dans App.jsx */}

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* --- ZONE 1 : IDENTITÉ --- */}
                    <Card className="p-6 h-full">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-emerald-900">Identité & État Civil</h3>
                            {isIdentityLocked && (
                                <span className="badge badge-success text-white text-xs gap-1">
                                    Vérifié ✓
                                </span>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <Input 
                                    label="Prénom*" name="firstName" value={formData.firstName} onChange={handleChange}
                                    disabled={isIdentityLocked} 
                                    className={isIdentityLocked ? lockedInputClass : ""}
                                />
                                <Input 
                                    label="Nom*" name="lastName" value={formData.lastName} onChange={handleChange}
                                    disabled={isIdentityLocked}
                                    className={isIdentityLocked ? lockedInputClass : ""}
                                />
                            </div>

                            <Input 
                                label="Date de naissance*" type="date" name="dateOfBirth" value={displayDate} onChange={handleChange}
                                disabled={isIdentityLocked}
                                className={isIdentityLocked ? lockedInputClass : ""}
                            />
                            
                            <Input 
                                label="Numéro National*" name="nationalId" value={formData.nationalId} onChange={handleChange} placeholder="ex: 90.10.10-123.45"
                                disabled={isIdentityLocked}
                                className={isIdentityLocked ? lockedInputClass : ""}
                            />
                            
                            {isIdentityLocked ? (
                                <p className="text-xs text-emerald-600 italic mt-1 font-medium">
                                    * Votre identité est validée et sécurisée.
                                </p>
                            ) : (
                                <p className="text-xs text-gray-400 italic mt-1">
                                    * Remplissez tous les champs pour valider votre identité.
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* --- ZONE 2 : CONTACT & BIO --- */}
                    <div className="space-y-6">
                        <Card className="p-6">
                            <h3 className="text-lg font-bold text-emerald-900 mb-6 pb-2 border-b border-gray-100">
                                Contact & Profil
                            </h3>
                            
                            <div className="space-y-4">
                                <Input 
                                    label="Téléphone Mobile" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} 
                                    placeholder="+32 123 45 67 89" 
                                />

                                <div className="form-control w-full">
                                    <label className="label pt-0 pb-2 justify-start">
                                        <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Bio & Préférences</span>
                                    </label>
                                    <textarea 
                                        name="bio"
                                        className={textareaStyle}
                                        value={formData.bio}
                                        onChange={handleChange}
                                        placeholder="Présentez-vous brièvement... Fumeur ? Musique ? Animaux ?"
                                    ></textarea>
                                </div>
                            </div>

                            {/* BOUTON D'ACTION PRINCIPAL */}
                            <div className="flex justify-end pt-6 mt-4">
                                <Button type="submit" isLoading={isSaving} className="px-8 shadow-emerald-500/20 shadow-lg">
                                    Enregistrer les modifications
                                </Button>
                            </div>
                        </Card>

                        {/* BOUTON ACCÈS SÉCURITÉ */}
                        {!showSecurity && (
                            <div className="flex justify-end">
                                <button 
                                    type="button"
                                    onClick={() => setShowSecurity(true)}
                                    className="text-sm text-gray-400 hover:text-gray-600 underline decoration-dotted"
                                >
                                    Afficher les paramètres avancés (Suppression)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* --- ZONE 3 : TIROIR SÉCURITÉ --- */}
            {showSecurity && (
                <div className="animate-fade-in mt-8">
                     <Card className="p-6 border-red-100 bg-red-50/30 relative">
                        <button onClick={() => setShowSecurity(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                        
                        <h3 className="text-lg font-bold text-red-900 mb-4">Zone de Danger</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60 mb-6">
                            <Input label="Email actuel" value={user?.email || ''} disabled className="bg-white cursor-not-allowed" />
                            <Input label="Mot de passe" value="********" disabled type="password" className="bg-white cursor-not-allowed" />
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-red-100">
                            <span className="text-sm text-red-800/60 font-medium">Cette action est irréversible.</span>
                            <Button 
                                variant="danger" 
                                onClick={() => setShowDeletePopup(true)} 
                                className="btn-sm"
                            >
                                Supprimer mon compte
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* --- POPUP DE CONFIRMATION --- */}
            <Popup 
                isOpen={showDeletePopup} 
                onClose={() => setShowDeletePopup(false)}
                title="Suppression de compte"
                maxWidth="max-w-md"
            >
                <div className="text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-gray-600 mb-8 leading-relaxed">
                        Êtes-vous sûr de vouloir supprimer définitivement votre compte <strong>{user?.email}</strong> ?<br/>
                        Toutes vos données (trajets, véhicules, historique) seront perdues.
                    </p>
                    <div className="flex justify-center gap-4">
                        <Button variant="secondary" onClick={() => setShowDeletePopup(false)}>
                            Annuler
                        </Button>
                        <Button variant="danger" onClick={confirmDeleteAccount}>
                            Oui, tout supprimer
                        </Button>
                    </div>
                </div>
            </Popup>
        </div>
    );
};

export default ProfileTab;