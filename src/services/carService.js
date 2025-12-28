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

  create: async (carData) => {
    const payload = transformCarToApi({
      ...carData,
      userId: String(carData.userId),
      numberOfSeat: parseInt(carData.numberOfSeat, 10),
    });

    const response = await apiClient.post(ENDPOINT, payload);
    return transformCarFromApi(response);
  },

  update: async (id, carPatch) => {
    const payload = { ...carPatch };

    if (payload.numberOfSeat !== undefined) {
      payload.numberOfSeat = parseInt(payload.numberOfSeat, 10);
    }
    if (payload.userId !== undefined) {
      payload.userId = String(payload.userId);
    }

    const response = await apiClient.put(`${ENDPOINT}/${id}`, payload);
    return transformCarFromApi(response);
  },

  delete: async (id) => {
    return await apiClient.delete(`${ENDPOINT}/${id}`);
  },
};
