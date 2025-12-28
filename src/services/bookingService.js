// src/services/bookingService.js
import apiClient, { isMock } from './apiClient';
import { RideService } from './rideService';
import { DetourService } from './detourService';
import { DiscountService } from './discountService';
import { UserService } from './userService';

const ENDPOINT = '/bookings';

// --- HELPERS ---

const buildDateDisplay = (ride) => {
    if (!ride?.departureDate) return null;
    const time = ride.departureTime ? String(ride.departureTime).substring(0, 5) : '00:00';
    return `${ride.departureDate}T${time}:00`;
};

const buildPassengerRouteFromDetour = (detour) => {
    if (!detour) return null;
    return {
        pickupAddress: detour.pickupAddress || detour.pickup_address,
        pickupLat: detour.pickupLat,
        pickupLon: detour.pickupLon,
        dropoffAddress: detour.dropoffAddress || detour.dropoff_address,
        dropoffLat: detour.dropoffLat,
        dropoffLon: detour.dropoffLon,
        distance: detour.distance,
        duration: detour.duration,
        delayPickup: detour.delayPickup,
        durationPassenger: detour.durationPassenger,
    };
};

const computeTotalPriceDisplay = ({ booking, ride, detour }) => {
    const seats = Math.max(1, parseInt(booking?.seats, 10) || 1);
    const detourTotalPaid = detour?.totalPaid ?? detour?.total_paid;
    if (detourTotalPaid !== undefined && detourTotalPaid !== null && detourTotalPaid !== '') return detourTotalPaid;
    const totalPaid = booking?.totalPaid ?? booking?.total_paid;
    if (totalPaid !== undefined && totalPaid !== null && totalPaid !== '') return totalPaid;
    const safePrice = Number(ride?.price || 0);
    return (safePrice * seats).toFixed(2);
};

const indexBy = (list, key) => {
    const map = new Map();
    (list || []).forEach((item) => {
        const k = item?.[key];
        if (k !== undefined && k !== null) map.set(String(k), item);
    });
    return map;
};

// --- ENRICHISSEMENT ---

const enrichBookings = async (bookings) => {
    try {
        const carRideIds = Array.from(new Set((bookings || []).map(b => String(b?.carRideId || b?.car_ride_id)).filter(Boolean)));
        const rides = await Promise.all(carRideIds.map(id => RideService.getById(id)));
        const ridesById = indexBy(rides.filter(Boolean), 'id');

        // On essaie de récupérer les détours via le service, mais MockAPI les a peut-être déjà inclus
        let detoursByBookingId = new Map();
        try {
            const detours = await DetourService.getByBookingIds((bookings || []).map(b => b.id));
            detoursByBookingId = indexBy(detours, 'bookingId');
        } catch (e) {
            console.warn("Impossible de récupérer les détours via le service, utilisation des données embarquées.");
        }

        const userIdsToFetch = new Set();
        (bookings || []).forEach(b => {
            if (b.userId) userIdsToFetch.add(String(b.userId));
        });
        rides.forEach(r => {
            if (r && r.userId) userIdsToFetch.add(String(r.userId));
        });

        const users = await Promise.all(Array.from(userIdsToFetch).map(id => UserService.getById(id)));
        const usersById = indexBy(users.filter(Boolean), 'id');

        return (bookings || []).map((b) => {
            const carRideId = b?.carRideId || b?.car_ride_id;
            const ride = ridesById.get(String(carRideId)) || {};
            
            // --- CORRECTION CLÉ ICI ---
            // Priorité au détour récupéré via service, SINON utiliser celui embarqué dans l'objet (b.detour)
            const detour = detoursByBookingId.get(String(b.id)) || b.detour;
            
            const passengerRoute = buildPassengerRouteFromDetour(detour) || b.passengerRoute;

            const passengerUser = usersById.get(String(b.userId)) || {};
            const driverUser = usersById.get(String(ride.userId)) || {};

            const calculatedPrice = computeTotalPriceDisplay({ booking: b, ride, detour });

            // Extraction explicite pour la vue conducteur
            const pPickupAddr = passengerRoute?.pickupAddress || detour?.pickupAddress;
            const pDropoffAddr = passengerRoute?.dropoffAddress || detour?.dropoffAddress;
            const pPickupLat = passengerRoute?.pickupLat || detour?.pickupLat;
            const pPickupLon = passengerRoute?.pickupLon || detour?.pickupLon;
            const pDropoffLat = passengerRoute?.dropoffLat || detour?.dropoffLat;
            const pDropoffLon = passengerRoute?.dropoffLon || detour?.dropoffLon;

            return {
                ...b,
                carRideId: String(carRideId),
                status: (b.status || 'PENDING').toUpperCase(),

                // On transmet la géométrie du trajet parent à la réservation pour l'affichage passager
                geometry: ride.geometry, 

                departurePlace: b.departurePlace || ride.departurePlace,
                arrivalPlace: b.arrivalPlace || ride.arrivalPlace,
                departureDate: b.departureDate || ride.departureDate,
                departureTime: b.departureTime || ride.departureTime,
                dateDisplay: b.dateDisplay || buildDateDisplay(ride),
                carId: b.carId || ride.carId,
                rideStatus: ride.status,

                passengerName: `${passengerUser.firstName || 'Passager'} ${passengerUser.lastName || ''}`.trim(),
                passengerAvatar: passengerUser.avatar || null,
                driverName: `${driverUser.firstName || 'Chauffeur'} ${driverUser.lastName || ''}`.trim(),
                driverUserId: ride.userId,

                passengerRoute,
                
                // Infos remontées à la racine pour l'affichage facile
                pickupAddress: pPickupAddr,
                dropoffAddress: pDropoffAddr,
                pickupLat: pPickupLat,
                pickupLon: pPickupLon,
                dropoffLat: pDropoffLat,
                dropoffLon: pDropoffLon,

                totalPaid: calculatedPrice,
                totalPriceDisplay: calculatedPrice, 
            };
        });
    } catch (e) {
        console.error('Erreur enrichBookings:', e);
        return bookings || [];
    }
};

export const BookingService = {
    getAll: async (userId) => {
        try {
            const safeUserId = String(userId);
            const response = await apiClient.get(ENDPOINT);
            const list = Array.isArray(response) ? response : [];
            const mine = list.filter(b => String(b.userId || b.user_id) === safeUserId);
            if (!isMock) return mine;
            return await enrichBookings(mine);
        } catch (error) {
            console.error('Erreur getAll bookings:', error);
            return [];
        }
    },

    getByRideId: async (carRideId) => {
        try {
            const safeRideId = String(carRideId);
            const response = await apiClient.get(ENDPOINT);
            const list = Array.isArray(response) ? response : [];
            const byRide = list.filter(b => String(b.carRideId || b.car_ride_id) === safeRideId);
            if (!isMock) return byRide;
            return await enrichBookings(byRide);
        } catch (error) {
            console.error('Erreur getByRideId bookings:', error);
            return [];
        }
    },

    create: async (bookingData) => {
        try {
            let discountId = bookingData.discountId;
            if (isMock && bookingData.promoCode) {
                const discount = await DiscountService.getByCode(bookingData.promoCode);
                if (discount?.id) discountId = discount.id;
            }

            const bookingPayload = {
                carRideId: String(bookingData.carRideId),
                userId: String(bookingData.userId),
                seats: bookingData.seats,
                price: bookingData.price,
                commission: bookingData.commission,
                discount: bookingData.discount,
                totalPaid: bookingData.totalPaid,
                promoCode: bookingData.promoCode || '',
                discountId: discountId || null,
                status: 'pending', 
            };

            if (isMock) {
                bookingPayload.detour = bookingData.detour || bookingData.passengerRoute || null;
            }

            const createdBooking = await apiClient.post(ENDPOINT, bookingPayload);

            if (isMock && bookingPayload.detour && createdBooking?.id) {
                // On essaie de créer le détour, mais on ne bloque pas si ça échoue
                // car on a déjà les infos dans l'objet bookingPayload.detour
                try {
                    const detour = bookingData.detour || bookingData.passengerRoute;
                    const detourPayload = {
                        bookingId: String(createdBooking.id),
                        carRideId: String(bookingData.carRideId),
                        pickupAddress: detour.pickupAddress,
                        pickupLat: detour.pickupLat,
                        pickupLon: detour.pickupLon,
                        dropoffAddress: detour.dropoffAddress,
                        dropoffLat: detour.dropoffLat,
                        dropoffLon: detour.dropoffLon,
                        distance: detour.distance,
                        duration: detour.duration,
                        delayPickup: detour.delayPickup,
                        durationPassenger: detour.durationPassenger,
                        totalPaid: bookingData.totalPaid,
                        commission: bookingData.commission,
                        discount: bookingData.discount,
                        promoCode: bookingData.promoCode || '',
                    };
                    await DetourService.create(detourPayload);
                } catch(e) {
                    console.warn("Erreur création DetourService (non critique si embarqué):", e);
                }
            }
            return createdBooking;
        } catch (error) {
            console.error('Erreur create booking:', error);
            throw error;
        }
    },

    updateStatus: async (bookingId, action) => {
        try {
            const safeId = String(bookingId);
            let status = action;
            if (action === 'ACCEPTED') status = 'ACCEPTED';
            else if (action === 'REFUSED' || action === 'REJECTED') status = 'REFUSED';
            else if (action === 'CANCELLED') status = 'CANCELLED';
            else status = action.toUpperCase();

            return await apiClient.put(`${ENDPOINT}/${safeId}`, { status });
        } catch (error) {
            console.error('Erreur updateStatus booking:', error);
            throw error;
        }
    },

    completeBooking: async (bookingId) => {
        try {
            const safeId = String(bookingId);
            return await apiClient.put(`${ENDPOINT}/${safeId}`, { status: 'COMPLETED' });
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
                bookingId: String(reviewData.bookingId),
                targetUserId: String(reviewData.targetUserId || reviewData.target?.id),
                authorUserId: String(reviewData.authorUserId || reviewData.author?.id),
                role: reviewData.role || 'unknown'
            };
            return await apiClient.post('/reviews', cleanPayload);
        } catch (error) {
            console.error('Erreur submitReview:', error);
            throw error;
        }
    }
};