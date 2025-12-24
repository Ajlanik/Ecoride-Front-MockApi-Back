// src/services/carService.js
import apiClient from './apiClient';
import { transformCarFromApi, transformCarToApi } from '../utils/mappers'; // Import du mapper

const ENDPOINT = '/cars';

export const CarService = {
  
  getAll: async (params) => {
    const response = await apiClient.get(ENDPOINT, { params });
    // On transforme chaque voiture reçue
    return response.map(transformCarFromApi);
  },

  getById: async (id) => {
    const response = await apiClient.get(`${ENDPOINT}/${id}`);
    return transformCarFromApi(response);
  },

  create: async (carData) => {
    // On transforme AVANT d'envoyer
    const payload = transformCarToApi(carData);
    // On ajoute l'ID user manuellement car le mapper ne le devine pas
    payload.userId = carData.userId; 
    
    const response = await apiClient.post(ENDPOINT, payload);
    return transformCarFromApi(response);
  },

  update: async (id, carData) => {
    // Pour un update partiel, on n'utilise pas forcément transformCarToApi
    // car on ne veut envoyer que les champs modifiés.
    const response = await apiClient.put(`${ENDPOINT}/${id}`, carData);
    return transformCarFromApi(response);
  },

  delete: async (id) => {
    return await apiClient.delete(`${ENDPOINT}/${id}`);
  }
};