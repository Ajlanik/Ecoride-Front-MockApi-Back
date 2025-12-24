// Ce service gère les appels API liés aux utilisateurs.

import apiClient from './apiClient';

// On définit la ressource spécifique.
const ENDPOINT = '/Users';

export const UserService = {
  // Récupérer tous les utilisateurs
  getAll: async () => {
    return await apiClient.get(ENDPOINT);
  },

  // Récupérer un utilisateur par son ID
  getById: async (id) => {
    return await apiClient.get(`${ENDPOINT}/${id}`);
  },

  // Créer un nouvel utilisateur
  create: async (userData) => {
    return await apiClient.post(ENDPOINT, userData);
  },

  // Mettre à jour un utilisateur
  update: async (id, userData) => {
    return await apiClient.put(`${ENDPOINT}/${id}`, userData);
  },

  // Supprimer un utilisateur
  delete: async (id) => {
    return await apiClient.delete(`${ENDPOINT}/${id}`);
  },
  
  // Upload avatar (Simulation pour MockAPI / Préparation Symfony)
  uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    

    // On simule l'upload vers une route spécifique d'upload d'avatar
    // (Avec un vrai backend Symfony, on aurait une route dédiée pour ça)
    // Exemple : POST /users/{id}/avatar @@@@@@@@@@@@@@@VOIR NICO!!!!@@@@@@@@@@@@@@@
    return await apiClient.post(`${ENDPOINT}/${userId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

};