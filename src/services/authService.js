// src/services/authService.js
import apiClient, { isMock } from './apiClient';
import { transformUserFromApi } from '../utils/mappers';

const LOGIN_ENDPOINT = '/login_check';
const USERS_ENDPOINT = '/users';

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
        const data = await apiClient.post(LOGIN_ENDPOINT, {
          username: credentials.email,
          password: credentials.password
        });

        if (data?.token) {
          return {
            success: true,
            user: transformUserFromApi(data.user),
            token: data.token
          };
        }
      } else {
        const data = await apiClient.post('/login/social', {
          provider: type,
          token: credentials.accessToken || credentials.credential || credentials
        });

        if (data?.token) {
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
            plainPassword: userData.password,
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
  }
};
