// src/services/rideService.js
import apiClient, { isMock } from './apiClient';
import { transformRideFromApi } from '../utils/mappers';

const ENDPOINT = '/carRides';

export const RideService = {
    search: async (filters = {}) => {
        try {
            if (!isMock) {
                const params = {};
                if (filters.departurePlace) params.departurePlace = filters.departurePlace;
                if (filters.arrivalPlace) params.arrivalPlace = filters.arrivalPlace;
                if (filters.departureDate) params.departureDate = filters.departureDate;

                const response = await apiClient.get(ENDPOINT, { params });
                const list = Array.isArray(response) ? response : [];
                return list.map(transformRideFromApi);
            }

            const response = await apiClient.get(ENDPOINT);
            const list = Array.isArray(response) ? response : [];
            const rides = list.map(transformRideFromApi);

            const departurePlace = (filters.departurePlace || '').trim().toLowerCase();
            const arrivalPlace = (filters.arrivalPlace || '').trim().toLowerCase();
            const departureDate = (filters.departureDate || '').trim();

            return rides.filter((ride) => {
                const matchDeparture =
                    !departurePlace ||
                    String(ride.departurePlace || '').toLowerCase().includes(departurePlace);

                const matchArrival =
                    !arrivalPlace ||
                    String(ride.arrivalPlace || '').toLowerCase().includes(arrivalPlace);

                const matchDate =
                    !departureDate ||
                    String(ride.departureDate || '') === departureDate;

                return matchDeparture && matchArrival && matchDate;
            });
        } catch (error) {
            console.error('Erreur recherche trajets:', error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    // GET ALL :
    // - Symfony : on envoie params (filtrage serveur)
    // - MockAPI : PAS de params => filtrage côté client (évite 404)
    // -------------------------------------------------------------------------
    getAll: async (filters = {}) => {
        try {
            // -------------------------
            // MOCK : pas de query params
            // -------------------------
            if (isMock) {
                const response = await apiClient.get(ENDPOINT);
                const list = Array.isArray(response) ? response : [];
                const rides = list.map(transformRideFromApi);

                // Filtrage client si besoin
                if (filters.userId !== undefined) {
                    return rides.filter(r => String(r.userId) === String(filters.userId));
                }

                return rides;
            }

            // -------------------------
            // SYMFONY : query params camelCase
            // -------------------------
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

    getById: async (id) => {
        const response = await apiClient.get(`${ENDPOINT}/${id}`);
        return transformRideFromApi(response);
    },

    create: async (rideData) => {
        try {
            const isDebug = import.meta.env.VITE_DEBUG === 'true';

            const payload = {
                userId: String(rideData.userId),
                carId: String(rideData.carId),

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

                status: rideData.status || 'scheduled',
                allowDetour: !!rideData.allowDetour,
                isRecurring: !!rideData.isRecurring,

                description: rideData.description || '',
                promoCode: rideData.promoCode || '',

                distance: rideData.distance,
                duration: rideData.duration,

                geometry: isMock
                    ? {
                        start: { lat: rideData.startLat, lon: rideData.startLon },
                        end: { lat: rideData.endLat, lon: rideData.endLon },
                    }
                    : (rideData.geometry ?? null),
            };

            if (isDebug) {
                console.group('📦 RideService.create – Payload envoyé');
                console.log(payload);
                console.log('Payload JSON size (KB):', Math.round(JSON.stringify(payload).length / 1024));
                console.groupEnd();
            }

            const response = await apiClient.post(ENDPOINT, payload);
            return transformRideFromApi(response);
        } catch (error) {
            console.error('Erreur création trajet:', error);
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
