// src/services/userService.js
// Ce service gère les appels API liés aux utilisateurs.
// Objectif : garder le même code Front, et switcher MockAPI / Symfony via VITE_BACKEND.

import apiClient, { isMock } from './apiClient';
import { transformUserFromApi } from '../utils/mappers';
// -----------------------------------------------------------------------------
// IMPORTANT :
// - MockAPI : ta ressource est "users" (minuscule)
// - Symfony : on restera aussi sur /users (bonne pratique REST)
// -----------------------------------------------------------------------------
const ENDPOINT = '/users';

export const UserService = {
    // -------------------------------------------------------------------------
    // Récupérer tous les utilisateurs
    // -------------------------------------------------------------------------
    getAll: async () => {
        return await apiClient.get(ENDPOINT);
    },

    // -------------------------------------------------------------------------
    // Récupérer un utilisateur par son ID
    // -------------------------------------------------------------------------
    getById: async (id) => {
        return await apiClient.get(`${ENDPOINT}/${id}`);
    },

    // -------------------------------------------------------------------------
    // Créer un nouvel utilisateur
    // -------------------------------------------------------------------------
    create: async (userData) => {
        return await apiClient.post(ENDPOINT, userData);
    },

    // -------------------------------------------------------------------------
    // Mettre à jour un utilisateur
    // Remarque : en MockAPI, un PUT remplace souvent l’objet complet.
    // => on conseille d’envoyer un objet "complet" ou d'utiliser PATCH côté back.
    // Ici on garde PUT pour être compatible avec ton code existant.
    // -------------------------------------------------------------------------
    update: async (id, userData) => {
        const response = await apiClient.put(`${ENDPOINT}/${id}`, userData);
        return transformUserFromApi(response);
        //return await apiClient.put(`${ENDPOINT}/${id}`, userData);
    },

    // -------------------------------------------------------------------------
    // Supprimer un utilisateur
    // -------------------------------------------------------------------------
    delete: async (id) => {
        return await apiClient.delete(`${ENDPOINT}/${id}`);
    },

    // -------------------------------------------------------------------------
    // Upload avatar
    // - MockAPI : pas de vraie route d'upload (et pas de traitement fichier)
    // - Symfony : aura une route dédiée (ex : POST /users/{id}/avatar)
    // -------------------------------------------------------------------------
    uploadAvatar: async (userId, file) => {
        if (isMock) {
            // -----------------------------------------------------------------
            // MockAPI : on ne peut pas uploader un fichier.
            // Bon comportement : on refuse proprement côté service.
            // -----------------------------------------------------------------
            throw new Error("Upload avatar indisponible en MockAPI (pas de route dédiée).");
        }

        const formData = new FormData();
        formData.append('avatar', file);

        return await apiClient.post(`${ENDPOINT}/${userId}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};
