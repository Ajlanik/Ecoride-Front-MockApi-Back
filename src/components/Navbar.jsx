// src/components/Navbar.jsx

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

  // Configuration des liens du menu (Facile à modifier)
  const MENU_ITEMS = [
    { path: "/", label: "Rechercher", icon: Search },
    { path: "/dashboard?tab=rides", label: "Publier un trajet", icon: PlusCircle, checkSearch: true },
    { path: "/mybooking", label: "Mes Réservations", icon: MapPin },
  ];

  // Helper pour les classes CSS actives/inactives
  const getLinkClass = (item) => {
    // Si l'item demande de vérifier les paramètres URL (ex: ?tab=rides) ou juste le path
    const isActive = item.checkSearch 
        ? location.search.includes("tab=rides") 
        : location.pathname === item.path;

    const baseStyle = "font-medium flex items-center gap-2 px-3 py-2 rounded-lg transition-all";
    const activeStyle = "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
    const inactiveStyle = "text-base-content/70 hover:text-base-content hover:bg-base-200";

    return `${baseStyle} ${isActive ? activeStyle : inactiveStyle}`;
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <div className="navbar bg-base-100/90 backdrop-blur-md shadow-sm border-b border-base-200 mb-8 sticky top-0 z-50 px-4 md:px-8 transition-colors duration-300">

      {/* --- LOGO --- */}
      <div className="navbar-start w-auto mr-4">
        <Link to="/" className="btn btn-ghost hover:bg-base-200 px-2 text-xl font-bold tracking-tight text-base-content">
            <img src="/logo.png" alt="EcoRide" className="h-8 w-auto mr-2" />
            Eco<span className="text-emerald-500">Ride</span>
        </Link>
      </div>

      {/* --- MENU CENTRAL (Desktop) --- */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1 gap-2">
            {MENU_ITEMS.map((item) => (
                <li key={item.path}>
                    <Link to={item.path} className={getLinkClass(item)}>
                        <item.icon className="w-4 h-4" /> {item.label}
                    </Link>
                </li>
            ))}
        </ul>
      </div>

      {/* --- PARTIE DROITE --- */}
      <div className="navbar-end flex-1 w-auto flex items-center gap-2">
        
        {/* Switch Thème */}
        <button onClick={toggleTheme} className="btn btn-ghost btn-circle btn-sm">
            {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        {/* Crédits */}
        <div className="hidden md:flex items-center gap-2 mr-2 bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase">Crédits</span>
            <span className="font-mono font-bold text-emerald-900 dark:text-white">{user.credits || 0}</span>
        </div>

        {/* Dropdown User */}
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
            <div className="w-9 rounded-full">
               <img alt="Avatar" src={user.picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.firstName}`} />
            </div>
          </div>
          
          <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow-2xl menu menu-sm dropdown-content bg-base-100 border border-base-200 rounded-xl w-60">
            <li className="menu-title border-b border-base-200 mb-2 pb-2">Bonjour {user.firstName}</li>

            {/* Liens Mobile (générés dynamiquement aussi !) */}
            {MENU_ITEMS.map((item) => (
                <li key={`mobile-${item.path}`} className="lg:hidden">
                    <Link to={item.path}><item.icon className="w-4 h-4"/> {item.label}</Link>
                </li>
            ))}
            
            <li><Link to="/dashboard"><User className="w-4 h-4"/> Mon Compte</Link></li>
            
            <div className="divider my-1"></div>
            
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