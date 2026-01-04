// src/services/authService.js
import apiClient, { isMock } from './apiClient';
import { transformUserFromApi } from '../utils/mappers';

const LOGIN_ENDPOINT = '/auth/login';
const USERS_ENDPOINT = '/users';
const SOCIAL_ENDPOINT = '/auth/social';

export const AuthService = {
  login: async (credentials, type = 'standard') => {
    try {
      // --- MODE MOCK ---
      if (isMock) {
        const users = await apiClient.get(USERS_ENDPOINT, {
          params: { email: credentials.email }
        });
        const user = Array.isArray(users) ? users[0] : null;
        if (!user || user.password !== credentials.password) {
          return { success: false, message: "Identifiants incorrects." };
        }
        return {
          success: true,
          user: transformUserFromApi(user),
          token: `mock-token-${user.id}`
        };
      }

      // --- MODE SYMFONY ---
      if (type === 'standard') {
        const response = await apiClient.post(LOGIN_ENDPOINT, {
          email: credentials.email,     // Attention: mon code Java attend "email", pas "username"
          password: credentials.password
        });

        if (response?.token) {
          // Sauvegarde le token dans le localStorage pour qu'il survive au refresh
          localStorage.setItem('token', response.token);

          return {
            success: true,
            user: response.user, // Ton Java renvoie l'user nettoyé
            token: response.token
          };
        }
      } else {

        let payload = { provider: type };

        if (type === 'facebook') {
          // Pour Facebook, 'credentials' contient déjà { email, firstName, lastName, token... }
          // On fusionne tout cet objet dans le payload pour l'envoyer au Java
          payload = { ...payload, ...credentials };
        } else {
          // Pour Google, 'credentials' est souvent juste le token ou un objet avec 'credential'
          payload.token = credentials.accessToken || credentials.credential || credentials;
        }

        console.log(`[AuthService] Envoi payload ${type}:`, payload); // Pour débugger

        const data = await apiClient.post(SOCIAL_ENDPOINT, payload);





        /*        const data = await apiClient.post(SOCIAL_ENDPOINT, {
          provider: type,
          token: credentials.accessToken || credentials.credential || credentials
        });
*/





        if (data?.token) {
          localStorage.setItem('token', data.token);
          return {
            success: true,
            user: transformUserFromApi(data.user),
            token: data.token
          };
        }
      }

      return { success: false, message: "Échec de l'authentification." };

    } catch (error) {
      console.error("Erreur Auth:", error);
      if (error?.response?.status === 401) {
        return { success: false, message: "Identifiants incorrects." };
      }
      return { success: false, message: "Erreur serveur." };
    }
  },

  register: async (userData) => {
    try {
      // mock: password en clair
      // symfony: plainPassword (plus tard quand backend prêt)
      const payload = isMock
        ? {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber

        }
        : {
          email: userData.email,
          password: userData.password,
          firstName: userData.firstName,
          lastName: userData.lastName,
          dateOfBirth: userData.dateOfBirth,
          phoneNumber: userData.phoneNumber
        };

      const created = await apiClient.post(USERS_ENDPOINT, payload);

      return {
        success: true,
        user: transformUserFromApi(created.user || created),
        token: created.token || null
      };

    } catch (error) {
      console.error("Erreur Register:", error);
      return { success: false, message: "Erreur lors de l'inscription." };
    }
  },
  // fonction pour appeler l'endpoint /auth/me et récupérer les infos de l'utilisateur courant 
  // Utile pour vérifier la validité du token au chargement de l'app
  // Renvoie { success: true, user } ou { success: false }


  getCurrentUser: async () => {
    try {
      const response = await apiClient.get('/auth/me'); // Appelle  Java
      return { success: true, user: transformUserFromApi(response) };
    } catch (error) {
      console.warn("Token invalide ou session expirée");
      return { success: false };
    }
  }
};
