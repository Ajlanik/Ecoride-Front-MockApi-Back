import apiClient from './apiClient';

const ENDPOINT = '/cars';

export const CarService = {
  
  // Récupérer toutes les voitures (avec filtres possibles)
  getAll: async (params) => {
    return await apiClient.get(ENDPOINT, { params });
  },

  getById: async (id) => {
    return await apiClient.get(`${ENDPOINT}/${id}`);
  },

  create: async (carData) => {
    return await apiClient.post(ENDPOINT, carData);
  },

  update: async (id, carData) => {
    return await apiClient.put(`${ENDPOINT}/${id}`, carData);
  },

  delete: async (id) => {
    return await apiClient.delete(`${ENDPOINT}/${id}`);
  }
};