// Composant Navbar.jsx : Barre de navigation principale
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext'; 
import { LogOut, User, MapPin, PlusCircle, Search, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); 
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    // Barre de navigation principale 
    // MODIFICATION : bg-base-100/90 et border-base-200 pour s'adapter au thème
    // Sticky en haut avec z-index élevé
    // Transition douce des couleurs
    // Ajout de padding horizontal pour espacement
    <div className="navbar bg-base-100/90 backdrop-blur-md shadow-sm border-b border-base-200 mb-8 sticky top-0 z-50 px-4 md:px-8 transition-colors duration-300">

      {/* --- LOGO --- */}
      <div className="navbar-start w-auto mr-4">
        <Link to="/" className="btn btn-ghost hover:bg-base-200 px-2">
            <img src="/logo.png" alt="EcoRide" className="h-8 w-auto mr-2" />
            {/* text-base-content s'adapte (Noir en Light / Blanc en Dark) */}
            <span className="text-xl font-bold tracking-tight text-base-content">
                Eco<span className="text-emerald-500">Ride</span>
            </span>
        </Link>
      </div>

      {/* --- MENU CENTRAL  --- */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
            
            {/* Lien RECHERCHER */}
            <li>
                <Link 
                    to="/" 
                    // Styles dynamiques (base-content pour le texte, base-200 pour le hover)
                    className={`font-medium ${isActive('/') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                >
                    <Search className="w-4 h-4" />
                    Rechercher
                </Link>
            </li>

            {/* Lien PUBLIER */}
            <li>
                <Link 
                    to="/dashboard?tab=rides" 
                    className={`font-medium ${location.search.includes('tab=rides') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                >
                    <PlusCircle className="w-4 h-4" />
                    Publier un trajet
                </Link>
            </li>

            {/* Lien MES RÉSERVATIONS */}
            <li>
                <Link 
                    to="/mybooking" 
                    className={`font-medium ${isActive('/mybooking') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                >
                    Mes Réservations
                </Link>
            </li>
        </ul>
      </div>

      {/* --- PARTIE DROITE (Switch + Profil) --- */}
      <div className="navbar-end flex-1 w-auto flex items-center gap-2">
        
        {/* --- BOUTON SWITCH THEME  --- */}
        <button 
            onClick={toggleTheme} 
            className="btn btn-ghost btn-circle btn-sm text-base-content hover:bg-base-200"
            title="Changer le thème"
        >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Crédits */}
        <div className="hidden md:flex items-center gap-2 mr-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Crédits</span>
            <span className="font-mono font-bold text-emerald-900 dark:text-white">{user.credits || 0}</span>
        </div>

        {/* Dropdown Profil */}
        <div className="dropdown dropdown-end">
          {/* ring-offset-base-100 pour que le contour matche le fond */}
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
            <div className="w-9 rounded-full">
               <img alt="Avatar" src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`} />
            </div>
          </div>
          
          {/*  bg-base-100 et text-base-content pour le menu déroulant */}
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 border border-base-200 text-base-content rounded-xl w-60">
            <li className="menu-title px-4 py-2 text-base-content/50 border-b border-base-200 mb-2">
                Bonjour {user.firstName}
            </li>

            {/* Menu Mobile  */}
            <li className="lg:hidden"><Link to="/"><Search className="w-4 h-4"/> Rechercher un trajet</Link></li>
            <li className="lg:hidden"><Link to="/dashboard?tab=rides"><PlusCircle className="w-4 h-4"/> Publier un trajet</Link></li>
            
            <li><Link to="/dashboard"><User className="w-4 h-4"/> Mon Compte</Link></li>
            <li><Link to="/mybooking"><MapPin className="w-4 h-4"/> Mes Réservations</Link></li>
            
            <div className="divider my-1 border-base-200"></div>
            
            <li>
                <button onClick={handleLogout} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut className="w-4 h-4" /> Se déconnecter 
                </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;