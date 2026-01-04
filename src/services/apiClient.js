// src/services/apiClient.js
import axios from 'axios';

// Choix backend : "mock" ou "symfony"
const backend = import.meta.env.VITE_BACKEND || 'mock';

// Base URL selon le backend
const API_URL =
  backend === 'mock'
    ? (import.meta.env.VITE_MOCK_API_URL || '')
    : (import.meta.env.VITE_API_URL || '/');

export const isMock = backend === 'mock';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Intercepteur de requête: injecte Bearer token si présent
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse: renvoie directement response.data
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn("Session expirée. Déconnexion...");
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      // AJOUT : Redirection forcée vers la page de login
      // Attention : on utilise window.location car on n'est pas dans un composant React
      if (window.location.pathname !== '/login') {
          window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
