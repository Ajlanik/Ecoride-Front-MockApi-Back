// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
//                                          VAncienne version du profil utilisateur
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------



import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function UserProfile() {
  const { user, login } = useAuth(); // On récupère l'user et la fonction pour mettre à jour le contexte
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');

  // État local pour le formulaire (initialisé avec les données du contexte)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    bio: ''
  });

  // Quand le composant charge ou que l'user change, on remplit le formulaire
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '', 
        dateOfBirth: user.dateOfBirth || '', 
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
        console.log("Envoi au back (simulation) :", formData);
        
        // --- ICI : APPEL API PUT /users/:id ---
        // const response = await fetch('/api/users/update', ...);
        
        // Simulation de mise à jour réussie
        setTimeout(() => {
            // On met à jour le contexte global pour que le nom change aussi dans la Navbar par exemple
            const updatedUser = { ...user, ...formData };
            localStorage.setItem('user_data', JSON.stringify(updatedUser));
            
            // On force un rechargement simple (ou on crée une méthode update dans le contexte)
            window.location.reload(); 
            
            setIsEditing(false);
            setMessage('Profil mis à jour avec succès !');
        }, 500);

    } catch (error) {
        console.error(error);
        setMessage("Erreur lors de la mise à jour.");
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
            
            {/* En-tête avec Photo */}
            <div className="flex flex-col items-center gap-4 mb-6">
                <div className="avatar">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                        <img src={user?.picture || "https://placehold.co/150"} alt="Profil" />
                    </div>
                </div>
                <h2 className="card-title text-2xl">
                    {user?.firstName} {user?.lastName}
                </h2>
                <div className="badge badge-outline">{user?.role === 1 ? 'Passager' : 'Conducteur'}</div>
            </div>

            {message && <div className="alert alert-success mb-4">{message}</div>}

            {/* Formulaire */}
            <form onSubmit={handleSave}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Prénom (Editable) */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Prénom</span></label>
                        <input 
                            type="text" 
                            name="firstName"
                            className="input input-bordered" 
                            value={formData.firstName} 
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Nom (Editable) */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Nom</span></label>
                        <input 
                            type="text" 
                            name="lastName"
                            className="input input-bordered" 
                            value={formData.lastName} 
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Email (Lecture seule) */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Email</span></label>
                        <input 
                            type="email" 
                            className="input input-bordered bg-base-200" 
                            value={formData.email} 
                            disabled={true} 
                        />
                        <label className="label"><span className="label-text-alt text-warning">L'email ne peut pas être modifié.</span></label>
                    </div>

                    {/* Téléphone (Editable ) */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Téléphone</span></label>
                        <input 
                            type="tel" 
                            name="phoneNumber"
                            placeholder="06 12 34 56 78"
                            className="input input-bordered" 
                            value={formData.phoneNumber} 
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>

                    {/* Date de naissance (Editable ?????????) */}
                    <div className="form-control">
                        <label className="label"><span className="label-text">Date de naissance</span></label>
                        <input 
                            type="date" 
                            name="dateOfBirth"
                            className="input input-bordered" 
                            value={formData.dateOfBirth} 
                            onChange={handleChange}
                            disabled={!isEditing}
                        />
                    </div>
                </div>

                {/* Bio / Description */}
                <div className="form-control mt-4">
                    <label className="label"><span className="label-text">Ma bio</span></label>
                    <textarea 
                        name="bio"
                        className="textarea textarea-bordered h-24" 
                        placeholder="Dites-en un peu plus sur vous..."
                        value={formData.bio}
                        onChange={handleChange}
                        disabled={!isEditing}
                    ></textarea>
                </div>

                {/* Boutons d'action */}
                <div className="card-actions justify-end mt-6">
                    {!isEditing ? (
                        <button 
                            type="button" 
                            className="btn btn-primary"
                            onClick={() => setIsEditing(true)}
                        >
                            Modifier mon profil
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button 
                                type="button" 
                                className="btn btn-ghost"
                                onClick={() => setIsEditing(false)}
                            >
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-success text-white">
                                Enregistrer
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}