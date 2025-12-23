import apiClient from './apiClient';
import { transformUserFromApi } from '../utils/mappers';

// Endpoint MockAPI
const ENDPOINT = '/Users';

export const AuthService = {
  
  /**
   * Login unifié (Email/Pass ou Google)
   * @param {Object} credentials - { email, password } (ou juste email pour Google)
   * @param {string} type - 'google' ou 'standard'
   */
  login: async (credentials, type = 'standard') => {
    try {
      // 1. On récupère les utilisateurs
      // (Avec un vrai backend Symfony, on ferait un POST /login direct)
      const users = await apiClient.get(ENDPOINT);
      
      let userFound = null;

      if (type === 'google') {
        // Logique Google : On cherche si un user existe avec cet email
        userFound = users.find(u => u.email === credentials.email);
      } else {
        // Logique Standard : Email + Password
        userFound = users.find(u => 
          u.email === credentials.email && 
          u.password === credentials.password
        );
      }

      if (userFound) {
        // Simulation d'un token (Symfony renverra un vrai JWT)
        const fakeToken = "mock-jwt-token-" + userFound.id + "-" + Date.now();
        
        return {
          success: true,
          user: transformUserFromApi(userFound),
          token: fakeToken
        };
      } else {
        return { success: false, message: "Identifiants incorrects ou compte inexistant." };
      }

    } catch (error) {
      console.error("Erreur Auth:", error);
      return { success: false, message: "Erreur serveur lors de la connexion." };
    }
  },

  /**
   * Inscription
   */
  register: async (userData) => {
    try {
      // Préparation propre pour l'API
      const payload = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        roleId: 1, // Client
        credits: 0,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}`,
        isActive: true,
        bio: "",
        dateOfBirth: userData.dateOfBirth || new Date().toISOString(),
        phoneNumber: userData.phoneNumber || ""
      };
  
      const response = await apiClient.post(ENDPOINT, payload);
  
      return {
        success: true,
        user: transformUserFromApi(response),
        token: "mock-jwt-token-" + Date.now()
      };
    } catch (error) {
      console.error("Erreur Inscription:", error);
      return { success: false, message: "Impossible de créer le compte." };
    }
  }
};