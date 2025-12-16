// Ce service gère les appels API liés aux utilisateurs et stocke donc la photo de profil.

// src/services/userService.js
import api from './api';

// On définit la ressource spécifique.
// L'URL finale sera : https://.../api/v1/users
const ENDPOINT = '/Users';

export const UserService = {
  // Récupérer tous les utilisateurs
  getAll: async () => {
    return await api.get(ENDPOINT);
  },

  // Récupérer un utilisateur par son ID
  getById: async (id) => {
    return await api.get(`${ENDPOINT}/${id}`);
  },

  // Créer un nouvel utilisateur
  create: async (userData) => {
    return await api.post(ENDPOINT, userData);
  },

  // Mettre à jour un utilisateur
  update: async (id, userData) => {
    return await api.put(`${ENDPOINT}/${id}`, userData);
  },

  // Supprimer un utilisateur
  delete: async (id) => {
    return await api.delete(`${ENDPOINT}/${id}`);
  }

};
uploadAvatar: async (userId, file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    // ATTENTION !!!! Sur MockAPI on ne peut pas vraiment uploader de fichiers,
    // mais  sur le back Symfony, ce sera comme ça :
    return await api.post(`${ENDPOINT}/${userId}/avatar`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
}