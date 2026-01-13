import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Input from './ui/Input';
import Button from './ui/Button';

const StandardLogin = ({ setView }) => {
  const { login } = useAuth();
  const { triggerToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Appel au Contexte -> Service -> API Symfony
    const success = await login({ email, password }, "standard");
    
    if (success) {
        triggerToast("Connexion réussie.", "success");
        navigate("/dashboard");
    } else {
        triggerToast("Email ou mot de passe incorrect.", "error");
        setIsLoading(false);
    }
  };

  // Styles Dark Mode pour la carte Login
  const darkInputClass = "bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-emerald-400 focus:border-emerald-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full animate-fade-in">
        <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white">Connexion</h3>
            <p className="text-sm text-gray-300">Accédez à votre espace EcoRide</p>
        </div>

        <Input 
            label="Email"
            type="email" 
            placeholder="votre-email@domaine.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={darkInputClass}
            required
        />

        <div>
            <Input 
                label="Mot de passe"
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={darkInputClass}
                required
            />
            <div className="text-right mt-1">
                <button type="button" className="text-xs text-emerald-300 hover:text-emerald-200 underline">
                    Mot de passe oublié ?
                </button>
            </div>
        </div>

      {/* Boutons actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Button type="submit" variant="primary" className="w-full shadow-lg shadow-emerald-500/30 border-none" isLoading={isLoading}>
            Se connecter
        </Button>

        <Button 
            type="button" 
            variant="ghost" 
            className="w-full text-gray-300 hover:text-white font-normal btn-sm hover:bg-white/10"
            onClick={() => setView("initial")}
        >
            Retour
        </Button>
      </div>
    </form>
  );
};

export default StandardLogin;