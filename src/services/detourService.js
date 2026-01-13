// src/services/detourService.js
import apiClient, { isMock } from './apiClient';

const ENDPOINT = '/detours';

/**
 * ============================================================================
 * SERVICE : DETOURS
 * Objectif :
 * - Centraliser les appels API liés aux détours.
 * - Garder une signature stable pour MockAPI et Symfony.
 *
 * Convention : camelCase côté Front.
 * - MockAPI accepte camelCase.
 * - Symfony mappera vers snake_case côté serveur.
 * ============================================================================
 */

export const DetourService = {
    // -------------------------------------------------------------------------
    // Récupère tous les detours
    // MockAPI : on évite les query params (certaines configs renvoient 404)
    // -------------------------------------------------------------------------
    getAll: async () => {
        try {
            const response = await apiClient.get(ENDPOINT);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error("Erreur chargement detours:", error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    // Récupère les detours pour une liste de bookingIds (filtrage côté client)
    // -------------------------------------------------------------------------
    getByBookingIds: async (bookingIds = []) => {
        try {
            const ids = bookingIds.map(String);
            if (ids.length === 0) return [];

            const list = await DetourService.getAll();
            return list.filter(d => ids.includes(String(d.bookingId)));
        } catch (error) {
            console.error("Erreur chargement detours par bookingIds:", error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    // Récupère les detours d'un trajet (carRideId)
    // Symfony pourra filtrer serveur plus tard.
    // MockAPI : filtrage client.
    // -------------------------------------------------------------------------
    getByRideId: async (carRideId) => {
        try {
            const safeRideId = String(carRideId);

            // MockAPI : GET simple + filtre côté client
            if (isMock) {
                const list = await DetourService.getAll();
                return list.filter(d => String(d.carRideId) === safeRideId);
            }

            const response = await apiClient.get(ENDPOINT, { params: { carRideId: safeRideId } });
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error("Erreur chargement detours par ride:", error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    // Création d'un detour
    // Champs attendus (côté Front) :
    // - bookingId, userId, carRideId, seats
    // - pickupAddress/pickupLat/pickupLon
    // - dropoffAddress/dropoffLat/dropoffLon
    // - distance, duration, price
    // -------------------------------------------------------------------------
    create: async (detourData) => {
        try {
            const payload = {
                bookingId: String(detourData.bookingId),
                userId: String(detourData.userId),
                carRideId: String(detourData.carRideId),

                seats: Math.max(1, parseInt(detourData.seats, 10) || 1),

                pickupAddress: detourData.pickupAddress,
                pickupLat: detourData.pickupLat,
                pickupLon: detourData.pickupLon,

                dropoffAddress: detourData.dropoffAddress,
                dropoffLat: detourData.dropoffLat,
                dropoffLon: detourData.dropoffLon,

                distance: detourData.distance,
                duration: detourData.duration,

                price: detourData.price,
            };

            return await apiClient.post(ENDPOINT, payload);
        } catch (error) {
            console.error("Erreur création detour:", error);
            throw error;
        }
    },
};
