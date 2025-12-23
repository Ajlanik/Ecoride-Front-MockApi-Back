import axios from 'axios';

// On récupère l'URL depuis le .env (ou une valeur par défaut)
// VITE_API_URL doit être défini dans ton .env (ex: l'URL MockAPI pour l'instant)
const API_URL = import.meta.env.VITE_API_URL || "https://692fd198778bbf9e006e9693.mockapi.io/api/v1";

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    // 'Accept': 'application/json', // Utile pour Symfony plus tard
  },
  timeout: 10000, // 10 secondes max
});

// --- INTERCEPTEUR DE REQUÊTE ---
// Injecte le token automatiquement s'il existe
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- INTERCEPTEUR DE RÉPONSE ---
// Simplifie la réponse et gère les erreurs globales (ex: 401 déconnecté)
apiClient.interceptors.response.use(
  (response) => {
    // On retourne directement la data pour ne pas répéter response.data partout
    return response.data;
  },
  (error) => {
    // Si l'erreur est une 401 (Non autorisé), on déconnecte proprement
    if (error.response && error.response.status === 401) {
      console.warn("Session expirée. Déconnexion...");
      localStorage.removeItem('token');
      localStorage.removeItem('user_data');
      // Optionnel : rediriger vers /login via window.location.href = '/login';
    }
    
    // On propage l'erreur pour que le composant puisse afficher un toast
    return Promise.reject(error);
  }
);

export default apiClient;