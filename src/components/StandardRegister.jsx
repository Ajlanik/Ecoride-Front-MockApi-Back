import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

import Input from './ui/Input';
import Button from './ui/Button';

function StandardRegister({ setView }) {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth(); 
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await register(formData);

    if (success) {
        navigate('/dashboard');
    } else {
        setError("Erreur lors de l'inscription.");
        setLoading(false);
    }
  };

  // Styles spécifiques pour le mode sombre du login
  const darkInputClass = "bg-white/10 border-white/20 text-white placeholder-gray-400 focus:ring-emerald-400";

  return (
    <form onSubmit={handleSubmit} className="space-y-3 w-full">
      <h3 className="text-xl font-semibold mb-4 text-center text-white">Créer un compte</h3>
      
      {error && <div className="alert alert-error text-sm py-2 mb-2">{error}</div>}

      <div className="flex gap-3">
        <Input 
            name="firstName" placeholder="Prénom" required 
            value={formData.firstName} onChange={handleChange}
            className={darkInputClass}
        />
        <Input 
            name="lastName" placeholder="Nom" required 
            value={formData.lastName} onChange={handleChange}
            className={darkInputClass}
        />
      </div>

      <Input 
        name="email" type="email" placeholder="Email" required 
        value={formData.email} onChange={handleChange}
        className={darkInputClass}
      />
      
      <Input 
        name="password" type="password" placeholder="Mot de passe" required 
        value={formData.password} onChange={handleChange}
        className={darkInputClass}
      />
      
      <label className="label pt-0 pb-2">
        <span className="label-text-alt text-gray-400 text-xs">
          * Min. 8 caractères, 1 maj, 1 min, 1 chiffre.
        </span>
      </label>

      <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
        S'inscrire sur EcoRide
      </Button>

      <Button 
        type="button" variant="ghost" className="w-full text-gray-400 hover:text-white btn-sm"
        onClick={() => setView('initial')}
      >
        Retour
      </Button>
    </form>
  );
}

export default StandardRegister;