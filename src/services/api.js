// src/services/api.js
import axios from 'axios';

// Votre URL de base (la racine)
const API_URL = "https://692fd198778bbf9e006e9693.mockapi.io/api/v1";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur de réponse (Optionnel mais recommandé)
// Cela permet de récupérer directement les données sans avoir à faire ".data" à chaque fois dans vos composants
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    console.error("Erreur API :", error);
    return Promise.reject(error);
  }
);

export default api;