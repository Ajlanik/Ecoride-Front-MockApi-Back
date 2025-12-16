// Composant StandardLogin.jsx : Formulaire de connexion standard avec email et mot de passe

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';


import Input from './ui/Input';
import Button from './ui/Button';

const StandardLogin = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const credentials = { email, password };
    const success = await login(credentials, 'standard');
    
    if (success) {
        navigate('/dashboard');
    } else {
        setIsLoading(false);
        alert("Erreur de connexion"); 
    }
  };

  // Classes pour le style "Dark Mode" dans la card Login
  // On force le texte blanc et les bordures claires
  const darkInputClass = "bg-white/5 border-white/20 text-white placeholder-gray-400 focus:ring-emerald-400 focus:border-emerald-400 focus:bg-white/10";
  const darkLabelClass = "text-emerald-300"; // Surcharge la couleur du label

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
      
      {/* Titre centré */}
      <div className="text-center mb-2">
          <h3 className="text-2xl font-bold text-white">Connexion</h3>
          <p className="text-sm text-gray-300 mt-1">Heureux de vous revoir !</p>
      </div>

      {/* Champs avec labels personnalisés en couleur */}
      <div className="space-y-4">
        <div>
            <label className="label pt-0 pb-2 justify-start">
                <span className={`label-text font-bold text-xs uppercase tracking-wide ${darkLabelClass}`}>Email</span>
            </label>
            <Input 
                type="email" 
                placeholder="votre-email@domaine.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={darkInputClass}
                // On passe label={null} car on l'a fait manuellement au dessus pour changer la couleur
                required
            />
        </div>

        <div>
            <label className="label pt-0 pb-2 justify-start">
                <span className={`label-text font-bold text-xs uppercase tracking-wide ${darkLabelClass}`}>Mot de passe</span>
            </label>
            <Input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={darkInputClass}
                required
            />
        </div>
      </div>

      {/* Boutons actions */}
      <div className="mt-4 flex flex-col gap-3">
        <Button type="submit" variant="primary" className="w-full shadow-lg shadow-emerald-500/20" isLoading={isLoading}>
            Se connecter
        </Button>

        <Button 
            type="button" 
            variant="ghost" 
            className="w-full text-gray-400 hover:text-white font-normal btn-sm hover:bg-white/5"
            onClick={() => setView('initial')}
        >
            Retour
        </Button>
      </div>
    </form>
  );
};

export default StandardLogin;