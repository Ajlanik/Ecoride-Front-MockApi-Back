import api from './api';
// --- import du mapper centralisé ---
import { transformUserFromApi } from '../utils/mappers';

// On utilise l'endpoint défini dans MockAPI
const ENDPOINT = '/Users';

export const AuthService = {
  
  /**
   * Authentification (Standard ou Google)
   * @param {Object} credentials - { email, password } (Optionnel pour Google)
   * @param {string} type - 'google' ou 'standard'
   */
  login: async (credentials, type = 'standard') => {
    try {
      // On récupère TOUS les utilisateurs (@@@@@@@@@@@@@car MockAPI ne gère pas le vrai login check)
      const users = await api.get(ENDPOINT);
      
      let userFound = null;

      if (type === 'google') {
        // --- LOGIQUE SIMULATION GOOGLE ---
        // On prend le 2ème utilisateur s'il existe (Sofia), sinon le 1er
        if (users.length >= 2) userFound = users[1];
        else if (users.length > 0) userFound = users[0];
      
      } else {
        // --- LOGIQUE STANDARD ---
        // On cherche l'utilisateur qui a cet email ET ce mot de passe
        userFound = users.find(u => 
          u.email === credentials.email && 
          u.password === credentials.password
        );
      }

      if (userFound) {
        return {
          success: true,
          // --- UTILISATION DU MAPPER CENTRALISÉ ---
          user: transformUserFromApi(userFound),
          token: userFound.token || "fake-jwt-" + Date.now()
        };
      } else {
        return { success: false, message: "Email ou mot de passe incorrect." };
      }

    } catch (error) {
      console.error("Erreur Auth:", error);
      return { success: false, message: "Erreur serveur lors de la connexion." };
    }
  },

  //------ Inscription d'un nouvel utilisateur ------
  
  register: async (userData) => {
    try {
      // C'EST ICI LA CORRECTION IMPORTANTE POUR "NEO/DARIO" !
      // On envoie les clés en CamelCase pour que MockAPI ne génère pas de faux noms
      const payload = {
        firstName: userData.firstName, // Plus de 'first_name'
        lastName: userData.lastName,   // Plus de 'last_name'
        email: userData.email,
        password: userData.password,
        roleId: 1,                     // Client par défaut
        credits: 0,
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.firstName}`,
        isActive: true,
        bio: "",
        // On ajoute une date de naissance par défaut si manquante
        dateOfBirth: userData.dateOfBirth || new Date().toISOString(),
        phoneNumber: userData.phoneNumber || ""
      };
  
      const response = await api.post(ENDPOINT, payload);
  
      return {
        success: true,
        // --- UTILISATION DU MAPPER CENTRALISE ---
        user: transformUserFromApi(response),
        token: response.token || "fake-jwt-" + Date.now()
      };

    } catch (error) {
      console.error("Erreur Inscription:", error);
      return { success: false, message: "Impossible de créer le compte." };
    }
  }
};

