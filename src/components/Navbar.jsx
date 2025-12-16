// Composant Navbar.jsx : Barre de navigation principale

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const btnLinkStyle = "btn btn-ghost btn-sm text-xs font-normal text-gray-300 hover:text-white hover:bg-white/10";

// Composant Navbar
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Petit etat local pour gerer l'affichage (pour encore DEV ATTENTE DE LA REPONSE AU MAIL)
  const [currentLang, setCurrentLang] = useState('FR');
  
  // Gestion de la déconnexion
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  // Si pas d'utilisateur connecté, ne pas afficher la navbar
  if (!user) return null;

  return (
    // J'ai ajouté backdrop-blur et bg-opacity pour que la navbar se fonde mieux dans le thème sombre
    <div className="navbar bg-[#0F172A]/80 backdrop-blur-md shadow-sm border-b border-white/5 mb-8 sticky top-0 z-50">

      {/* Servira à revenir à la page d'accueil */}
      <div className="navbar-start">
        <Link to="/dashboard" className="btn btn-ghost text-xl text-emerald-400 font-bold hover:bg-transparent">
          EcoRide AJOUTER LE LOGO !
        </Link>
      </div>

      {/* Menu pour naviguer dans le site */}
      <div className="navbar-center hidden lg:flex">
        <div className="flex gap-1">
          <Link to="/" className={btnLinkStyle}>Proposer trajet</Link>
          <Link to="/" className={btnLinkStyle}>Commander trajet</Link>
          <Link to="/" className={btnLinkStyle}>Micromobilité</Link>
          <Link to="/" className={btnLinkStyle}>Historique</Link>
          <Link to="/" className={btnLinkStyle}>Amis</Link>
        </div>
      </div>

      {/* partie langue et profil */}
      <div className="navbar-end gap-2">

        {/* partie langue */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-sm text-white opacity-80 hover:opacity-100">
            <span className="text-xs font-bold mr-1">{currentLang}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
          </div>
          <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-[#1e293b] border border-white/10 rounded-box w-32 mt-2">
            <li>
              <button onClick={() => setCurrentLang('FR')} className={`text-sm ${currentLang === 'FR' ? 'text-emerald-400' : 'text-gray-300'}`}>
                Français
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentLang('EN')} className={`text-sm ${currentLang === 'EN' ? 'text-emerald-400' : 'text-gray-300'}`}>
                English
              </button>
            </li>
          </ul>
        </div>

        {/*partie profil*/}
        <div className="dropdown dropdown-end ml-2">

          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring ring-emerald-500 ring-offset-base-100 ring-offset-2 ring-offset-[#0F172A]">
            <div className="w-9 rounded-full">
              <img
                alt="Avatar"
                src={user.picture || "https://placehold.co/100"}  // Image de profil par défaut si aucune n'est fournie
              />
            </div>
          </div>
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-lg menu menu-sm dropdown-content bg-[#1e293b] border border-white/10 text-gray-200 rounded-box w-52">
            <li><Link to="/dashboard" className="hover:text-emerald-400">Mon Compte</Link></li>
            <li><Link to="/mybooking" className="hover:text-emerald-400">Mes Réservations</Link></li>
            <div className="divider my-0 border-white/10"></div>
            <li><button onClick={handleLogout} className="text-red-400 hover:bg-red-400/10">Se déconnecter</button></li>
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Navbar;