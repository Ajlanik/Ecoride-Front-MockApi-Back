// src/services/bookingService.js
import apiClient, { isMock } from './apiClient';

const ENDPOINT = '/bookings';

export const BookingService = {
    // --- PARTIE PASSAGER (Ta logique restaurée) ---
    getAll: async (userId) => {
        try {
            const response = await apiClient.get(ENDPOINT);
            const list = Array.isArray(response) ? response : [];

            if (isMock) return list;

            console.log("[BookingService] Données brutes reçues du Back:", list);

            const mappedList = list.map(b => {
                const ride = b.carRide || {};
                const driver = ride.driver || {};
                const detour = b.detour || {};
                const car = ride.car || {};

                const passengerRoute = {
                    pickupAddress: detour.pickupAddress || ride.departurePlace || 'Départ inconnu',
                    pickupLat: detour.pickupLat || ride.startLat,
                    pickupLon: detour.pickupLon || ride.startLon,
                    dropoffAddress: detour.dropoffAddress || ride.arrivalPlace || 'Arrivée inconnue',
                    dropoffLat: detour.dropoffLat || ride.endLat,
                    dropoffLon: detour.dropoffLon || ride.endLon,
                    distance: detour.distance || ride.distance,
                    duration: detour.duration,
                    delayPickup: detour.delayPickup
                };

                return {
                    id: b.id,
                    status: (b.status || 'PENDING').toUpperCase(),

                    hasAuthUserRated: b.hasAuthUserRated,

                    dateDisplay: ride.departureDate ? `${ride.departureDate}T${ride.departureTime || '00:00'}` : null,
                    totalPriceDisplay: b.totalPaid || b.price,
                    departurePlace: ride.departurePlace,
                    arrivalPlace: ride.arrivalPlace,
                    pickupAddress: passengerRoute.pickupAddress,
                    dropoffAddress: passengerRoute.dropoffAddress,
                    driverName: driver.firstName ? `${driver.firstName} ${driver.lastName}` : 'Chauffeur',
                    driverAvatar: driver.avatar,
                    driverUserId: driver.id,
                    carModel: car.model ? `${car.brand} ${car.model}` : null,
                    carPicture: car.picture,
                    carRide: ride,
                    detour: detour,
                    passengerRoute: passengerRoute,
                    carRideId: ride.id || b.carRideId,
                    passengerId: b.passengerId
                };
            });

            console.log("[BookingService] Données nettoyées pour le front:", mappedList);
            return mappedList;
        } catch (error) {
            console.error("Erreur getAll bookings:", error);
            return [];
        }
    },

    // --- PARTIE CONDUCTEUR (Nécessaire pour le Popup "Détail") ---

    // Récupérer les réservations d'un trajet spécifique (pour voir qui a postulé)
    getByRideId: async (rideId) => {
        try {
           
            const response = await apiClient.get(`${ENDPOINT}?carRideId=${rideId}`);
            return Array.isArray(response) ? response : [];
        } catch (error) {
            console.error("Erreur getByRideId:", error);
            return [];
        }
    },


    initPayment: async (carRideId, seats) => {
        try {
            // On appelle l'endpoint testé côté back
            const response = await apiClient.post(`${ENDPOINT}/init-payment`, {
                carRideId: parseInt(carRideId, 10),
                seats: parseInt(seats, 10)
            });
            return response; // Retourne { clientSecret, id }
        } catch (error) {
            console.error('Erreur initPayment:', error);
            throw error;
        }
    },




    // --- ACTIONS COMMUNES ---

    create: async (bookingData) => {
        try {
            let rawRideId = bookingData.carRideId;
            if (rawRideId && typeof rawRideId === 'object') rawRideId = rawRideId.id;

            const bookingPayload = {
                carRideId: parseInt(rawRideId, 10),
                seats: parseInt(bookingData.seats, 10),
                price: parseFloat(bookingData.price),
                commission: parseFloat(bookingData.commission),
                totalPaid: parseFloat(bookingData.totalPaid),
                status: 'PENDING',
                stripePaymentIntentId: bookingData.stripePaymentIntentId,
                detour: bookingData.detour ? {
                    pickupAddress: bookingData.detour.pickupAddress,
                    pickupLat: bookingData.detour.pickupLat,
                    pickupLon: bookingData.detour.pickupLon || bookingData.detour.pickupLng,
                    dropoffAddress: bookingData.detour.dropoffAddress,
                    dropoffLat: bookingData.detour.dropoffLat,
                    dropoffLon: bookingData.detour.dropoffLon || bookingData.detour.dropoffLng,
                    distance: String(bookingData.detour.distance),
                    duration: parseInt(bookingData.detour.duration || 0, 10),
                    delayPickup: parseInt(bookingData.detour.delayPickup || 0, 10),
                } : null
            };
            return await apiClient.post(ENDPOINT, bookingPayload);
        } catch (error) {
            console.error('Erreur create booking:', error);
            throw error;
        }
    },

    updateStatus: async (bookingId, action) => {
        try {
            let status = action === 'ACCEPTED' ? 'ACCEPTED' :
                action === 'REFUSED' ? 'REFUSED' :
                    action === 'CANCELLED' ? 'CANCELLED' : action.toUpperCase();
            return await apiClient.put(`${ENDPOINT}/${bookingId}`, { status });
        } catch (error) {
            console.error('Erreur updateStatus:', error);
            throw error;
        }
    },

    // Utilisé par le hook useRideDetailActions pour valider la fin du trajet côté passager
    completeBooking: async (bookingId) => {
        try {
            return await apiClient.put(`${ENDPOINT}/${bookingId}`, { status: 'COMPLETED' });
        } catch (error) {
            console.error('Erreur completeBooking:', error);
            throw error;
        }
    },

    submitReview: async (reviewData) => {
        try {
            const cleanPayload = {
                rating: parseInt(reviewData.rating, 10),
                comment: reviewData.comment || '',
                bookingId: parseInt(reviewData.bookingId, 10),
                authorUserId: parseInt(reviewData.authorUserId, 10),
                role: reviewData.role || 'unknown'
            };

            const targetId = reviewData.targetUserId || reviewData.target?.id;
            if (targetId) cleanPayload.targetUserId = parseInt(targetId, 10);

            return await apiClient.post('/reviews', cleanPayload);
        } catch (error) {
            console.error('Erreur submitReview:', error);
            throw error;
        }
    }
};