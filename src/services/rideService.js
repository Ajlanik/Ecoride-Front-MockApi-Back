import api from './api';
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
            // ex: appelera /carRides?userId=1
            const apiFilters = { ...filters };
            
            // Si on filtre par driverId côté app, on renomme pour l'API si besoin
            // (Notre mapper attend 'userId' dans MockAPI, donc on aligne)
            if (filters.driverId) {
                apiFilters.userId = filters.driverId;
                delete apiFilters.driverId;
            }

            const response = await api.get(ENDPOINT, { params: apiFilters });
            
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
            const response = await api.get(`${ENDPOINT}/${id}`);
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
            
            // 2. On ajoute les infos manquantes (liées au contexte ou auto-générées)
            // rideData.driverId doit être fourni par le composant (l'ID du user connecté)
            payload.userId = rideData.driverId; 
            
            // Pour MockAPI, on simule les dates de création (le vrai back le fera seul)
            payload.createdAt = new Date().toISOString();

            const response = await api.post(ENDPOINT, payload);
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
            await api.delete(`${ENDPOINT}/${id}`);
            return true;
        } catch (error) {
            console.error(`Erreur suppression trajet ${id}:`, error);
            throw error;
        }
    }
};