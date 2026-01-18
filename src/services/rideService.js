// src/services/rideService.js
import apiClient, { isMock } from './apiClient';
import { transformRideFromApi } from '../utils/mappers';

const ENDPOINT = '/carRides';

export const RideService = {
    search: async (filters = {}) => {
        try {
            const params = {};
            if (filters.departurePlace) params.departure = filters.departurePlace;
            if (filters.arrivalPlace) params.arrival = filters.arrivalPlace;
            if (filters.departureDate) params.departureDate = filters.departureDate;

            // Lors le role admin sera implémenté, on pourra ajouter un filtre pour voir tous les trajets
            //const response = await apiClient.get(ENDPOINT, { params });
            const response = await apiClient.get(`${ENDPOINT}/search`, { params });
            const list = Array.isArray(response) ? response : [];
            return list.map(transformRideFromApi);
        } catch (error) {
            console.error("Erreur recherche trajets:", error);
            return [];
        }
    },
    /*
        getAll: async (filters = {}) => {
            try {
                if (isMock) {
                    const response = await apiClient.get(ENDPOINT);
                    const list = Array.isArray(response) ? response : [];
                    const rides = list.map(transformRideFromApi);
    
                    if (filters.userId !== undefined) {
                        return rides.filter(r => String(r.userId) === String(filters.userId));
                    }
                    return rides;
                }
    
                const params = {};
                if (filters.userId !== undefined) params.userId = String(filters.userId);
    
                const response = await apiClient.get(ENDPOINT, { params });
                const list = Array.isArray(response) ? response : [];
                return list.map(transformRideFromApi);
            } catch (error) {
                console.error('Erreur API Trajets:', error);
                return [];
            }
        },
    */

    // -------------- debut du test --------------
    getAll: async (filters = null) => {
        try {
            const params = {};

            // Gestion intelligente des arguments
            if (filters) {
                if (typeof filters === "object") {
                    // Cas objet : getAll({ userId: 14 })
                    // IMPORTANT : Mapping userId (front) -> driverId (back)
                    if (filters.userId) params.driverId = String(filters.userId);
                    if (filters.driverId) params.driverId = String(filters.driverId);
                } else {
                    params.driverId = String(filters);
                }
            }
            const response = await apiClient.get(ENDPOINT, { params });
            const list = Array.isArray(response) ? response : [];

            return list.map(transformRideFromApi).sort((a, b) =>
                new Date(b.departureDate) - new Date(a.departureDate)
            );

        } catch (error) {
            console.error("Erreur API Trajets (getAll):", error);
            return [];
        }
    },
    // -------------- fin du test --------------
    getById: async (id) => {
        const response = await apiClient.get(`${ENDPOINT}/${id}`);
        return transformRideFromApi(response);
    },

    create: async (rideData) => {
        try {

            const payload = {
                driver: { id: parseInt(rideData.userId, 10) },
                car: { id: parseInt(rideData.carId, 10) },

                departurePlace: rideData.departurePlace,
                arrivalPlace: rideData.arrivalPlace,

                departureDate: rideData.departureDate,
                departureTime: rideData.departureTime,

                startLat: rideData.startLat,
                startLon: rideData.startLon,
                endLat: rideData.endLat,
                endLon: rideData.endLon,

                seatsTotal: parseInt(rideData.seatsTotal, 10),
                seatsAvailable: parseInt(rideData.seatsTotal, 10),
                price: parseFloat(rideData.price),

                status: rideData.status || "scheduled",
                allowDetour: !!rideData.allowDetour,
                isRecurring: !!rideData.isRecurring,

                description: rideData.description || "",
                promoCode: rideData.promoCode || "",

                distance: rideData.distance ? String(rideData.distance) : null,
                duration: rideData.duration,

                geometryCoords: rideData.geometry || null,

                recurrenceDays: rideData.recurrenceDays || [],
                recurrenceEndDate: rideData.recurrenceEndDate || null,
            };

            // --- LOG DIAGNOSTIC ---
            console.group("§§§§§§§§§§§§§§§§§§§§§§ [RideService] Payload CREATE§§§§§§§§§§§§§§§§§");
            console.log("Endpoint:", ENDPOINT);
            console.log("Contenu:", payload);
            console.groupEnd();
            // -------------------------

            const response = await apiClient.post(ENDPOINT, payload);
            return transformRideFromApi(response);
        } catch (error) {
            console.error("Erreur création trajet:", error);
            throw error;
        }
    },

    update: async (id, partialData) => {
        const response = await apiClient.put(`${ENDPOINT}/${id}`, partialData);
        return transformRideFromApi(response);
    },

    delete: async (id) => {
        return await apiClient.delete(`${ENDPOINT}/${id}`);
    },
};