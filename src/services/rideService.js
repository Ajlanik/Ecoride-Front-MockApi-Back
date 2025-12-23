import apiClient from './apiClient';
import { transformRideFromApi, transformRideToApi } from '../utils/mappers';

const ENDPOINT = '/carRides'; 

export const RideService = {
    
    /**
     * Récupérer tous les trajets (avec filtres optionnels)
     * @param {Object} filters - ex: { driverId: 1 } ou { departurePlace: "Paris" }
     */
    getAll: async (filters = {}) => {
        try {
            // MockAPI (CamelCase) : On passe les filtres tels quels
            const apiFilters = { ...filters };
            
            // Si on filtre par driverId côté app, on renomme pour l'API si besoin
            if (filters.driverId) {
                apiFilters.userId = filters.driverId;
                delete apiFilters.driverId;
            }

            const response = await apiClient.get(ENDPOINT, { params: apiFilters });
            
            // On transforme chaque résultat via le mapper 
            return response.map(transformRideFromApi);
        } catch (error) {
            console.error("Erreur chargement trajets:", error);
            throw error;
        }
    },

    /**
     * Récupérer un trajet par son ID
     */
    getById: async (id) => {
        try {
            const response = await apiClient.get(`${ENDPOINT}/${id}`);
            return transformRideFromApi(response);
        } catch (error) {
            console.error(`Erreur chargement trajet ${id}:`, error);
            throw error;
        }
    },

    /**
     * Créer un nouveau trajet
     * @param {Object} rideData - Données du formulaire (Format App)
     */
    create: async (rideData) => {
        try {
            // 1. On transforme nos données React (App) vers le format API
            const payload = transformRideToApi(rideData);
            
            // 2. On ajoute les infos manquantes
            payload.userId = rideData.driverId; 
            
            // Pour MockAPI, on simule la date de création
            payload.createdAt = new Date().toISOString();

            const response = await apiClient.post(ENDPOINT, payload);
            return transformRideFromApi(response);
        } catch (error) {
            console.error("Erreur création trajet:", error);
            throw error;
        }
    },

    /**
     * Supprimer (Annuler) un trajet
     */
    delete: async (id) => {
        try {
            await apiClient.delete(`${ENDPOINT}/${id}`);
            return true;
        } catch (error) {
            console.error("Erreur suppression:", error);
            throw error;
        }
    }
};