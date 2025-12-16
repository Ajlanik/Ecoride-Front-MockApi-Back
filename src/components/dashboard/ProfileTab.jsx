import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { UserService } from '../../services/userService';
import { useNavigate } from 'react-router-dom';

const ProfileTab = ({ user }) => {
    const { updateUser, logout } = useAuth(); // Ajout de logout pour la suppression
    const navigate = useNavigate();
    
    // --- LOGIQUE DE VERROUILLAGE DU PROFIL POUR EVEITER LA MODIF ---
    // Si l'utilisateur a un ID national, son identité est scellée (visible mais non modifiable pour nom-prenom-date naissance et nat id)
    const isIdentityLocked = !!user?.nationalId;

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        bio: '',
        nationalId: '',
        dateOfBirth: ''
    });
    
    // État pour l'affichage (Date formatée pour l'input)
    const [displayDate, setDisplayDate] = useState('');

    // État de sauvegarde
    const [isSaving, setIsSaving] = useState(false);
    
    // Tiroir Sécurité uniquement (Email/Mdp reste caché par défaut)
    const [showSecurity, setShowSecurity] = useState(false);

    // Initialisation des données du formulaire à partir de l'utilisateur
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
                dateOfBirth: user.dateOfBirth || '' // On garde la date brute pour l'envoi
            });
        }
    }, [user]);
     
    // Gestion des changements dans le formulaire
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Si on change la date, on met à jour l'affichage local
        if (name === 'dateOfBirth') {
            setDisplayDate(value);
        }
    };

    // Soumission du formulaire
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        
        try {
            const apiResponse = await UserService.update(user.id, formData);
            updateUser(apiResponse);
            alert("Profil mis à jour !");
        } catch (error) {
            console.error("Erreur update", error);
            alert("Erreur lors de la sauvegarde.");
        } finally {
            setIsSaving(false);
        }
    };

    // Style pour le textarea de la bio
    const textareaStyle = "textarea textarea-bordered w-full bg-white text-gray-800 border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-base p-4 min-h-[120px]";

    // Style conditionnel pour les inputs verrouillés
    const lockedInputClass = "bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed font-medium";

    // Fonction de suppression de compte
    const handleDeleteAccount = async () => {
        if (window.confirm("Etes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
            try {
                await UserService.delete(user.id);
                logout(); // On vide le contexte
                navigate('/'); // On renvoie à l'accueil
                alert("Votre compte a été supprimé. Au revoir !");
            } catch (error) {
                console.error("Erreur suppression", error);
                alert("Impossible de supprimer le compte pour le moment.");
            }
        }
    };

    // Rendu du composant 
    return (
        <div className="animate-fade-in w-full">
            <form onSubmit={handleSubmit}>
                
                {/* --- ZONE 1 : IDENTITÉ (Visible mais conditionnellement verrouillée) --- */}
                <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                        <h3 className="text-lg font-bold text-emerald-900">
                            Identité & État Civil
                        </h3>
                        {isIdentityLocked && (
                            <span className="badge badge-success text-white text-xs gap-1">
                                Vérifié ✓
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Prénom */}
                        <div className="w-full">
                            <Input 
                                label="Prénom*" 
                                name="firstName"
                                value={formData.firstName} 
                                onChange={handleChange}
                                disabled={isIdentityLocked} 
                                className={isIdentityLocked ? lockedInputClass : ""}
                            />
                        </div>
                        
                        {/* Nom */}
                        <div className="w-full">
                            <Input 
                                label="Nom*" 
                                name="lastName"
                                value={formData.lastName} 
                                onChange={handleChange}
                                disabled={isIdentityLocked}
                                className={isIdentityLocked ? lockedInputClass : ""}
                            />
                        </div>

                        {/* Date de naissance */}
                        <div className="w-full">
                            <Input 
                                label="Date de naissance*" 
                                type="date"
                                name="dateOfBirth"
                                value={displayDate} 
                                onChange={handleChange}
                                disabled={isIdentityLocked}
                                className={isIdentityLocked ? lockedInputClass : ""}
                            />
                        </div>
                        
                        {/* Numéro National */}
                        <div className="w-full">
                            <Input 
                                label="Numéro National*" 
                                name="nationalId"
                                value={formData.nationalId} 
                                onChange={handleChange}
                                placeholder="ex: 90.10.10-123.45"
                                disabled={isIdentityLocked}
                                className={isIdentityLocked ? lockedInputClass : ""}
                            />
                        </div>
                    </div>
                    
                    {/* Message d'information si verrouillé */}
                    {isIdentityLocked && (
                        <p className="mt-3 text-xs text-gray-400 italic">
                            * Ces informations sont verrouillées. Contactez le support pour toute modification.
                        </p>
                    )}
                </div>

                {/* --- ZONE 2 : CONTACT & BIO (restera modifiable --- */}
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-emerald-900 mb-4 pb-2 border-b border-gray-100">
                        Contact & Profil
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                        <div className="w-full">
                            <Input 
                                label="Téléphone Mobile" 
                                name="phoneNumber"
                                value={formData.phoneNumber} 
                                onChange={handleChange}
                                placeholder="+32 123 45 67 89" 
                            />
                        </div>

                        <div className="w-full form-control">
                            <label className="label pt-0 pb-2 justify-start">
                                <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Bio & Préférences</span>
                            </label>
                            <textarea 
                                name="bio"
                                className={textareaStyle}
                                value={formData.bio}
                                onChange={handleChange}
                                placeholder="Présentez-vous brièvement... Indiquez aussi vos préférences : Fumeur/Non-fumeur ? Musique en voiture ? Animaux acceptés ?"
                            ></textarea>
                        </div>
                    </div>
                </div>

                {/* BOUTON D'ACTION PRINCIPAL */}
                <div className="flex justify-end pt-4 border-t border-gray-100 mb-8 gap-4 items-center">
                     {/* Si verrouillé, on affiche "Vérifié" à côté du bouton pour rappel */}
                     {isIdentityLocked && <span className="text-xs text-emerald-600 font-medium">Seuls le téléphone et la bio seront mis à jour</span>}
                     
                     <Button type="submit" isLoading={isSaving} className="px-8 shadow-emerald-500/20 shadow-lg">
                        Enregistrer les modifications
                     </Button>
                </div>
            </form>

            {/* --- ZONE 3 : SÉCURITÉ (Toujours cachée par défaut car rarement utilisée) --- */}
            <div className="mt-8 pt-6 border-t border-gray-200">
                {!showSecurity ? (
                    <div className="flex justify-start">
                        <Button 
                            variant="secondary" 
                            onClick={() => setShowSecurity(true)}
                            className="flex items-center gap-2 border border-gray-200 shadow-sm hover:shadow-md text-gray-600"
                        >
                            Avancé : Paramètres de sécurité et suppression de compte
                        </Button>
                    </div>
                ) : (
                    <div className="animate-fade-in bg-gray-50 p-6 rounded-xl border border-gray-200 mt-4 relative shadow-inner">
                        <button onClick={() => setShowSecurity(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>
                        
                        <h3 className="text-lg font-bold text-emerald-900 mb-4">Avancé : Paramètres de sécurité et suppression de compte</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-70">
                            <div className="w-full">
                                <Input label="Email actuel" value={user?.email || ''} disabled className="cursor-not-allowed bg-white" />
                            </div>
                            <div className="w-full">
                                 <Input label="Mot de passe" value="********" disabled type="password" className="cursor-not-allowed bg-white" />
                            </div>
                        </div>
                        
                        <div className="mt-6 flex justify-end">
                            <Button variant="danger" disabled className="btn-sm opacity-50"><span className="text-xs text-emerald-600 font-medium">Modifier (A VENIR)</span></Button>
                        </div>

                        {/* --- ZONE DE DANGER : SUPPRESSION (Correction : Placé ICI, dans le bloc ouvert) --- */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
                           
                            <button 
                                type="button"
                                onClick={handleDeleteAccount}
                                className="text-sm text-red-500 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium border border-transparent hover:border-red-100"
                            >
                                Supprimer mon compte
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileTab;