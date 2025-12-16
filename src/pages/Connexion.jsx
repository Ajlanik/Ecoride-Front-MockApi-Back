import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


import GoogleLoginBtn from '../components/GoogleLoginBtn';
import StandardLogin from '../components/StandardLogin';
import StandardRegister from '../components/StandardRegister';
import Button from '../components/ui/Button'; // Import UI Kit

function Connexion() {
  const [view, setView] = useState('initial');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (response) => {
    await login(response.credential, 'google');
    navigate('/dashboard');
  };

  const renderForm = () => {
    if (view === 'login') return <StandardLogin setView={setView} />;
    if (view === 'register') return <StandardRegister setView={setView} />;

    // Vue initiale (Choix de la méthode)
    return (
      <div className="space-y-4 w-full animate-fade-in">
        <Button 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white border-none shadow-lg shadow-emerald-500/20"
            onClick={() => setView('login')}
        >
          Se connecter avec Email
        </Button>
        
        <div className="divider text-gray-400 text-sm">OU</div>
        
        {/* Le bouton Google reste spécifique car il vient d'une librairie externe */}
        <div className="flex justify-center w-full">
             <GoogleLoginBtn onLoginSuccess={handleGoogleSuccess} onLoginError={() => console.error("Erreur Google")} />
        </div>

        <Button 
            variant="outline" 
            className="w-full"
        >
          Se connecter avec Facebook
        </Button>
        
        <p className="text-center text-sm text-gray-300 mt-6">
          Nouveau sur EcoRide ?{' '}
          <span className="text-emerald-400 cursor-pointer hover:underline font-bold"
            onClick={() => setView('register')}>
            Inscris-toi !
          </span>
        </p>
      </div>
    );
  };

  return (
    <div className="ecoride-bg min-h-screen flex items-center justify-center p-4">
      <div className="container max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">

        {/* COLONNE GAUCHE : TEXTE MARKETING */}
        <div className="text-white space-y-8 p-4 hidden md:block animate-slide-up">
          <div className="badge badge-outline text-emerald-300 border-emerald-300 p-3">Bougez mieux</div>
          <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
            Bougez mieux,<br />respirez mieux.
          </h1>
          <p className="text-gray-300 text-lg opacity-90 leading-relaxed max-w-md">
            Votre plateforme unique pour le covoiturage responsable.
            Fatigué des embouteillages ? Réduisez votre empreinte carbone dès aujourd'hui.
          </p>

          <div className="flex gap-4 pt-4">
            <StatsBox value="120k+" label="Trajets / mois" />
            <StatsBox value="4.9/5" label="Note Conducteurs" />
          </div>
        </div>

        {/* COLONNE DROITE : CARTE DE CONNEXION */}
        <div className="flex justify-center w-full">
            <div className="card w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl overflow-hidden">
                {/* Header de la card */}
                <div className="px-8 pt-8 pb-0 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        EcoRide 🌿
                    </h2>
                    <span className="badge bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold py-3">
                        Sécurisé
                    </span>
                </div>

                {/* Corps du formulaire avec padding uniforme */}
                <div className="card-body p-8">
                    {renderForm()}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}

// Petit composant local pour les stats marketing (évite de répéter le code)
const StatsBox = ({ value, label }) => (
    <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10 text-center min-w-[100px]">
        <p className="text-2xl font-bold text-emerald-400">{value}</p>
        <p className="text-xs text-gray-300 uppercase tracking-wider mt-1">{label}</p>
    </div>
);

export default Connexion;