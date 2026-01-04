// src/services/carService.js
import apiClient, { isMock } from './apiClient';
import { transformCarFromApi, transformCarToApi } from '../utils/mappers';

const ENDPOINT = '/cars';

export const CarService = {
  // -------------------------------------------------------------------------
  // GET ALL :
  // - Symfony : params (filtrage serveur)
  // - MockAPI : PAS de params => filtrage côté client (évite 404)
  // -------------------------------------------------------------------------
  getAll: async (params = {}) => {
    try {
      if (isMock) {
        const response = await apiClient.get(ENDPOINT);
        const list = Array.isArray(response) ? response : [];
        const cars = list.map(transformCarFromApi);

        if (params.userId !== undefined) {
          return cars.filter(c => String(c.userId) === String(params.userId));
        }

        return cars;
      }

      const query = {};
      if (params.userId !== undefined) query.userId = String(params.userId);

      const response = await apiClient.get(ENDPOINT, { params: query });
      const list = Array.isArray(response) ? response : [];
      return list.map(transformCarFromApi);
    } catch (error) {
      console.error('Erreur chargement véhicules:', error);
      return [];
    }
  },

  getById: async (id) => {
    const response = await apiClient.get(`${ENDPOINT}/${id}`);
    return transformCarFromApi(response);
  },

  // Dans carService.js

  create: async (carData) => {
    // Je construis le payload final pour l'API
    const payload = {
      brand: carData.brand,
      model: carData.model,
      licensePlate: carData.licensePlate,

      // Conversion sécurisée en Entier (Java est strict là-dessus)
      numberOfSeat: parseInt(carData.seats || carData.numberOfSeat, 10),
      engine: carData.engine,

      // LOGIQUE ROBUSTE POUR L'UTILISATEUR :
      // 1. Si on reçoit déjà un objet 'user' complet, on le garde.
      // 2. Sinon, si on a un 'userId' (notre cas dans CarsTab), on crée l'objet { id: X }
      // La clé finale DOIT être 'user' pour que Java fasse le lien avec l'entité User.
      user: carData.user || (carData.userId ? { id: carData.userId } : null)
    };

    // Vérification de sécurité avant envoi (Optionnel mais recommandé pour le debug)
    if (!payload.user) {
      console.error("Attention: Aucun utilisateur attaché au véhicule !", payload);
    }

    const response = await apiClient.post(ENDPOINT, payload);
    return transformCarFromApi(response);
  },

  update: async (id, carPatch) => {
    const payload = { ...carPatch };

    // Correction aussi pour l'update : nom du champ seats
    if (payload.numberOfSeat !== undefined || payload.seats !== undefined) {
      payload.seats = parseInt(payload.numberOfSeat || payload.seats, 10);
      delete payload.numberOfSeat; // On nettoie pour ne pas envoyer de champ inutile
    }

    // Si on update le user (rare), on s'assure du format objet
    if (payload.userId !== undefined) {
      payload.userId = payload.userId.id ? { id: payload.userId.id } : { id: payload.userId };
    }

    const response = await apiClient.put(`${ENDPOINT}/${id}`, payload);
    return transformCarFromApi(response);
  },
  setFavorite: async (carId) => {
    // POST sur l'endpoint qu'on vient de créer
    const response = await apiClient.post(`/cars/${carId}/favorite`);
    return response; // Retourne la voiture mise à jour
  },

  delete: async (id) => {
    return await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};