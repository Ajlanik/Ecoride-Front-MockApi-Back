import api from './api';

const ENDPOINT = '/cars';

export const CarService = {
  // Modification ici : on accepte un objet "params"
  // Cela permettra de faire : getAll({ userId: 12 })
  getAll: async (params) => {
    return await api.get(ENDPOINT, { params });
  },

  getById: async (id) => {
    return await api.get(`${ENDPOINT}/${id}`);
  },

  create: async (carData) => {
    return await api.post(ENDPOINT, carData);
  },

  update: async (id, carData) => {
    return await api.put(`${ENDPOINT}/${id}`, carData);
  },

  delete: async (id) => {
    return await api.delete(`${ENDPOINT}/${id}`);
  }
};