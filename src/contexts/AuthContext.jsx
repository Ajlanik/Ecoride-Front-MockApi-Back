// Contexte d'authentification : gestion de l'état utilisateur et des fonctions de login, register, logout et updateUser

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Chargement initial au démarrage de l'app
  useEffect(() => {
    const storedUser = localStorage.getItem('user_data');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Erreur lecture localStorage", e);
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  }, []);

  // 2. Fonction de Connexion
  const login = async (credentials, type = 'standard') => {
    setLoading(true);
    try {
      console.log(`[AuthContext] Login via ${type}...`);
      const result = await AuthService.login(credentials, type);

      if (result.success) {
        setUser(result.user);
        // On sauvegarde pour rester connecté au refresh
        localStorage.setItem('user_data', JSON.stringify(result.user));
        if (result.token) localStorage.setItem('token', result.token);
        return true;
      } else {
        console.error("[AuthContext] Erreur Login :", result.message);
        return false;
      }
    } catch (error) {
      console.error("[AuthContext] Exception Login :", error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 3. Fonction d'Inscription
  const register = async (userData) => {
    setLoading(true);
    try {
      const result = await AuthService.register(userData);
      
      if (result.success) {
        setUser(result.user);
        localStorage.setItem('user_data', JSON.stringify(result.user));
        if (result.token) localStorage.setItem('token', result.token);
        return true;
      }
      return false;
    } catch (e) {
      console.error("[AuthContext] Erreur Register", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 4. Fonction de Déconnexion
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user_data');
    localStorage.removeItem('token');
  };

  // 5. NOUVELLE FONCTION : Mise à jour du profil en temps réel
  // Permet de mettre à jour le state 'user' sans recharger la page
  const updateUser = (newData) => {
    // On fusionne l'utilisateur actuel avec les nouvelles données
    const updatedUser = { ...user, ...newData };
    
    // Mise à jour immédiate de l'interface
    setUser(updatedUser);
    
    // Mise à jour du stockage pour le prochain démarrage
    localStorage.setItem('user_data', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);