// Composant Navbar.jsx : Barre de navigation principale
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, MapPin, PlusCircle, Search } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <div className="navbar bg-[#0F172A]/90 backdrop-blur-md shadow-lg border-b border-white/5 mb-8 sticky top-0 z-50 px-4 md:px-8">

      {/* --- LOGO (Original Restauré) --- */}
      <div className="navbar-start w-auto mr-4">
        <Link to="/" className="btn btn-ghost hover:bg-white/5 px-2">
            {/* On utilise ton image logo.png */}
            <img src="/logo.png" alt="EcoRide" className="h-8 w-auto mr-2" />
            <span className="text-xl font-bold tracking-tight text-white">
                Eco<span className="text-emerald-400">Ride</span>
            </span>
        </Link>
      </div>

      {/* --- MENU CENTRAL (Desktop) --- */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
            
            {/* Lien RECHERCHER (Passager) -> Accueil */}
            <li>
                <Link 
                    to="/" 
                    className={`font-medium ${isActive('/') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                >
                    <Search className="w-4 h-4" />
                    Rechercher
                </Link>
            </li>

            {/* Lien PUBLIER (Conducteur) -> Dashboard Onglet Rides */}
            <li>
                <Link 
                    to="/dashboard?tab=rides" 
                    className={`font-medium ${location.search.includes('tab=rides') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                >
                    <PlusCircle className="w-4 h-4" />
                    Publier un trajet
                </Link>
            </li>

            {/* Lien MES RÉSERVATIONS */}
            <li>
                <Link 
                    to="/mybooking" 
                    className={`font-medium ${isActive('/mybooking') ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'}`}
                >
                    Mes Réservations
                </Link>
            </li>
        </ul>
      </div>

      {/* --- PARTIE DROITE (Profil) --- */}
      <div className="navbar-end flex-1 w-auto">
        
        {/* Crédits */}
        <div className="hidden md:flex items-center gap-2 mr-4 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Crédits</span>
            <span className="font-mono font-bold text-white">{user.credits || 0}</span>
        </div>

        {/* Dropdown Profil */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring ring-emerald-500 ring-offset-base-100 ring-offset-2 ring-offset-[#0F172A]">
            <div className="w-9 rounded-full">
               <img alt="Avatar" src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`} />
            </div>
          </div>
          
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-[#1e293b] border border-white/10 text-gray-200 rounded-xl w-60">
            <li className="menu-title px-4 py-2 text-gray-400 border-b border-white/5 mb-2">
                Bonjour {user.firstName}
            </li>

            {/* Menu Mobile */}
            <li className="lg:hidden"><Link to="/"><Search className="w-4 h-4"/> Rechercher un trajet</Link></li>
            <li className="lg:hidden"><Link to="/dashboard?tab=rides"><PlusCircle className="w-4 h-4"/> Publier un trajet</Link></li>
            
            <li><Link to="/dashboard"><User className="w-4 h-4"/> Mon Compte</Link></li>
            <li><Link to="/mybooking"><MapPin className="w-4 h-4"/> Mes Réservations</Link></li>
            
            <div className="divider my-1 border-white/10"></div>
            
            <li>
                <button onClick={handleLogout} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
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