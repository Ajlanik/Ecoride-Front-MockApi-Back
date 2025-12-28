import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; // Le contexte fait le lien avec le service
import { useToast } from '../contexts/ToastContext'; // Feedback utilisateur propre

import Input from './ui/Input';
import Button from './ui/Button';

function StandardRegister({ setView }) {
  const { register } = useAuth(); 
  const { triggerToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // L'AuthContext appelle AuthService.register qui appelle le Backend
    const success = await register(formData);

    if (success) {
        triggerToast("Compte créé avec succès ! Bienvenue.", "success");
        navigate('/dashboard');
    } else {
        triggerToast("Erreur lors de l'inscription. Vérifiez les champs.", "error");
        setLoading(false);
    }
  };

  // Styles spécifiques pour le mode sombre du login (Transparents)
  const darkInputClass = "bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-emerald-400 focus:border-emerald-400";
  const labelClass = "text-emerald-100 font-bold";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full animate-fade-in">
      <h3 className="text-xl font-bold mb-4 text-center text-white">Créer un compte</h3>
      
      <div className="flex gap-3">
        <div className="w-1/2">
            <Input 
                label="Prénom"
                name="firstName" placeholder="Prénom" required 
                value={formData.firstName} onChange={handleChange}
                className={darkInputClass}
                // On surcharge le style du label interne à l'input via CSS ou props si prévu, 
                // sinon Input gère le label standard. Ici on utilise le style global du Input modifié
            />
        </div>
        <div className="w-1/2">
            <Input 
                label="Nom"
                name="lastName" placeholder="Nom" required 
                value={formData.lastName} onChange={handleChange}
                className={darkInputClass}
            />
        </div>
      </div>

      <Input 
        label="Email"
        name="email" type="email" placeholder="Email" required 
        value={formData.email} onChange={handleChange}
        className={darkInputClass}
      />
      
      <div>
          <Input 
            label="Mot de passe"
            name="password" type="password" placeholder="Mot de passe" required 
            value={formData.password} onChange={handleChange}
            className={darkInputClass}
          />
          <span className="text-xs text-gray-300 mt-1 block pl-1">
             * Min. 8 caractères, 1 majuscule, 1 chiffre.
          </span>
      </div>

      <div className="pt-2 flex flex-col gap-3">
          <Button type="submit" variant="primary" className="w-full shadow-lg shadow-emerald-500/30 border-none" isLoading={loading}>
            S'inscrire sur EcoRide
          </Button>

          <Button 
            type="button" variant="ghost" className="w-full text-gray-300 hover:text-white btn-sm hover:bg-white/10"
            onClick={() => setView('initial')}
          >
            Retour
          </Button>
      </div>
    </form>
  );
}

export default StandardRegister;