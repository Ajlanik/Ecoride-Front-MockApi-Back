// src/services/apiClient.js
import axios from 'axios';

// Création de l'instance unique
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.monsite.com', // L'URL change selon l'env
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de REQUÊTE (Request)
// S'exécute avant que la requête ne parte vers le serveur
apiClient.interceptors.request.use(
  (config) => {
    // On récupère le token (ex: depuis le localStorage ou un store)
    const token = localStorage.getItem('authToken');
    
    // Si on a un token, on l'injecte automatiquement. 
    // Utile pour les routes protégées qui nécessitent une authentification 
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de RÉPONSE (Response)
// S'exécute dès que le serveur répond
apiClient.interceptors.response.use(
  (response) => {
    // Optionnel : On retourne directement 'data' pour éviter de faire response.data partout
    return response.data;
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response?.status === 401) {
      // par exemple rediriger vers la page de login si le token est expiré
      console.warn('Session expirée, déconnexion...');
      // window.location.href = '/login'; 
    }
    if (error.response?.status === 500) {
      // par exemple afficher une notification toast générique "Erreur serveur"
      alert('Oups, le serveur a un problème.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;