import apiClient from './apiClient';
import { RideService } from './rideService';

// Endpoint MockAPI
const ENDPOINT = '/bookings'; 

export const BookingService = {

    /**
     * Récupérer les réservations d'un utilisateur
     */
    getAll: async (userId) => {
        try {
            const bookings = await apiClient.get(`${ENDPOINT}?userId=${userId}`);

            // On enrichit chaque réservation avec les détails du trajet
            const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
                try {
                    const ride = await RideService.getById(booking.carRideId);
                    
                    return {
                        ...booking,
                        // --- INFOS VISUELLES AJOUTÉES ---
                        departurePlace: ride.departurePlace,
                        arrivalPlace: ride.arrivalPlace,
                        driverName: "Conducteur EcoRide", 
                        dateDisplay: ride.departureDate + 'T' + ride.departureTime,
                        
                        // --- COORDONNÉES GPS (C'est ça qui manquait !) ---
                        // On s'assure de les convertir en nombre
                        startLat: parseFloat(ride.startLat),
                        startLon: parseFloat(ride.startLon),
                        endLat: parseFloat(ride.endLat),
                        endLon: parseFloat(ride.endLon),
                        
                        // Autres infos utiles pour le détail
                        duration: ride.duration,
                        description: ride.description,
                        promoCode: ride.promoCode
                    };
                } catch (err) {
                    console.warn(`Trajet introuvable pour la résa ${booking.id}`, err);
                    return { 
                        ...booking, 
                        departurePlace: "Trajet inconnu", 
                        arrivalPlace: "?",
                        driverName: "?" 
                    };
                }
            }));

            return enrichedBookings;

        } catch (error) {
            console.error("Erreur chargement bookings", error);
            return [];
        }
    },

    cancel: async (id) => {
        return await apiClient.delete(`${ENDPOINT}/${id}`);
    },

    create: async (bookingData) => {
        try {
            const payload = {
                carRideId: String(bookingData.rideId), 
                userId: String(bookingData.passengerId),
                status: "ACCEPTED",
                price: bookingData.price,
                date: new Date().toISOString()
            };
            const response = await apiClient.post(ENDPOINT, payload);
            return response;
        } catch (error) {
            console.error("Erreur création réservation:", error);
            throw error;
        }
    }
};