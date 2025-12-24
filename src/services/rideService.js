// src/services/rideService.js

import apiClient from './apiClient';
import { transformRideFromApi, transformRideToApi } from '../utils/mappers';

const ENDPOINT = '/carRides'; 

export const RideService = {
    
    // --- RÉCUPÉRATION AVEC FILTRAGE INTELLIGENT (Côté Client) ---
    // Indispensable car MockAPI ne gère pas la recherche floue (ex: "Liège" dans "Gare de Liège")
    // Ce sera géré côté serveur avec un vrai backend Symfony @@@@@@@@@@@@@@@VOIR NICO!!!!@@@@@@@@@@@@@@@
    getAll: async (filters = {}) => {
        try {
            // On récupère TOUS les trajets depuis l'API
            const response = await apiClient.get(ENDPOINT);
            
            // On les transforme tout de suite au format App
            const allRides = response.map(transformRideFromApi);

            // Si aucun filtre n'est demandé, on renvoie les trajets futurs par défaut
            if (Object.keys(filters).length === 0) {
                return allRides.filter(r => r.status === 'scheduled');
            }

            // Filtrage manuel en JavaScript
            return allRides.filter(ride => {
                let match = true;

                // Filtre par statut (défaut : scheduled, sauf si on demande tout)
                if (ride.status !== 'scheduled' && !filters.includeAllStatus) return false;

                // Filtre par Conducteur (pour l'onglet "Mes Trajets")
                if (filters.driverId && String(ride.userId) !== String(filters.driverId)) {
                    return false;
                }

                // Filtre Ville Départ (Insensible à la casse + Recherche partielle)
                if (filters.from) {
                    const searchFrom = filters.from.toLowerCase().trim();
                    const rideFrom = ride.departurePlace.toLowerCase();
                    // On vérifie si le lieu de départ contient le mot cherché
                    if (!rideFrom.includes(searchFrom)) match = false;
                }

                // Filtre Ville Arrivée
                if (filters.to) {
                    const searchTo = filters.to.toLowerCase().trim();
                    const rideTo = ride.arrivalPlace.toLowerCase();
                    if (!rideTo.includes(searchTo)) match = false;
                }

                // E. Filtre Date (Correspondance exacte jour YYYY-MM-DD)
                if (filters.date) {
                    if (ride.departureDate !== filters.date) match = false;
                }

                return match;
            });

        } catch (error) {
            console.error("Erreur chargement trajets:", error);
            throw error;
        }
    },

    getById: async (id) => {
        try {
            const response = await apiClient.get(`${ENDPOINT}/${id}`);
            return transformRideFromApi(response);
        } catch (error) {
            console.error(`Erreur chargement trajet ${id}:`, error);
            throw error;
        }
    },

    create: async (rideData) => {
        try {
            // Le mapper transforme les dates séparées en format ISO pour l'API
            const payload = transformRideToApi(rideData);
            
            // On s'assure que l'ID user est bien attaché
            payload.userId = rideData.driverId; 
            
            const response = await apiClient.post(ENDPOINT, payload);
            return transformRideFromApi(response);
        } catch (error) {
            console.error("Erreur création trajet:", error);
            throw error;
        }
    },

    update: async (id, partialData) => {
        try {
            // MockAPI accepte les PATCH ou PUT partiels
            const response = await apiClient.put(`${ENDPOINT}/${id}`, partialData);
            return transformRideFromApi(response);
        } catch (error) {
            console.error("Erreur mise à jour trajet:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            await apiClient.delete(`${ENDPOINT}/${id}`);
            return true;
        } catch (error) {
            return false;
        }
    }
};