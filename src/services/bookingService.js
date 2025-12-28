// src/services/bookingService.js
import apiClient, { isMock } from './apiClient';
import { RideService } from './rideService';
import { DetourService } from './detourService';
import { DiscountService } from './discountService';

const ENDPOINT = '/bookings';

/**
 * ============================================================================
 * SERVICE : BOOKINGS
 * Objectif :
 * - Garder un Front stable (mêmes champs attendus par la UI)
 * - MockAPI : enrichir les bookings avec :
 *   - ride (carRide) + detour (passengerRoute)
 *   - totalPaid / dateDisplay etc.
 * ============================================================================
 */

const buildDateDisplay = (ride) => {
    // -------------------------------------------------------------------------
    // Construit une date ISO compatible avec new Date(...)
    // Exemple : "2026-01-04T10:42:00"
    // -------------------------------------------------------------------------
    if (!ride?.departureDate) return null;

    const time = ride.departureTime ? String(ride.departureTime).substring(0, 5) : '00:00';
    return `${ride.departureDate}T${time}:00`;
};

const buildPassengerRouteFromDetour = (detour) => {
    // -------------------------------------------------------------------------
    // Les composants (popup + timeline) s'attendent à une structure passengerRoute
    // On la reconstruit depuis detour.
    // -------------------------------------------------------------------------
    if (!detour) return null;

    return {
        pickupAddress: detour.pickupAddress,
        pickupLat: detour.pickupLat,
        pickupLon: detour.pickupLon,

        dropoffAddress: detour.dropoffAddress,
        dropoffLat: detour.dropoffLat,
        dropoffLon: detour.dropoffLon,

        distance: detour.distance,
        duration: detour.duration,

        // Durées détaillées (si enregistrées dans detours)
        delayPickup: detour.delayPickup,
        durationPassenger: detour.durationPassenger,
    };
};

const computeTotalPriceDisplay = ({ booking, ride, detour }) => {
    // -------------------------------------------------------------------------
    // Objectif : afficher un montant même si certains champs n'existent pas.
    // Priorité :
    // 1) detour.totalPaid (si présent)
    // 2) booking.totalPaid / booking.totalPrice (si présent)
    // 3) ride.price * booking.seats
    // -------------------------------------------------------------------------
    const seats = Math.max(1, parseInt(booking?.seats, 10) || 1);

    const detourTotalPaid = detour?.totalPaid ?? detour?.total_paid;
    if (detourTotalPaid !== undefined && detourTotalPaid !== null && detourTotalPaid !== '') {
        return detourTotalPaid;
    }

    const totalPaid = booking?.totalPaid ?? booking?.total_paid;
    if (totalPaid !== undefined && totalPaid !== null && totalPaid !== '') {
        return totalPaid;
    }

    const totalPrice = booking?.totalPrice ?? booking?.total_price;
    if (totalPrice !== undefined && totalPrice !== null && totalPrice !== '') {
        return totalPrice;
    }

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

const enrichBookings = async (bookings) => {
    // -------------------------------------------------------------------------
    // MockAPI : bookings (passager) ne contiennent pas forcément :
    // - departurePlace / arrivalPlace / dateDisplay
    // - passengerRoute (détour)
    // On enrichit côté Front pour stabiliser la UI.
    // -------------------------------------------------------------------------
    try {
        const carRideIds = Array.from(new Set((bookings || []).map(b => String(b?.carRideId || b?.car_ride_id)).filter(Boolean)));

        const rides = await Promise.all(carRideIds.map(id => RideService.getById(id)));
        const ridesById = indexBy(rides.filter(Boolean), 'id');

        // Detours
        const detours = await DetourService.getByBookingIds((bookings || []).map(b => b.id));
        const detoursByBookingId = indexBy(detours, 'bookingId');

        return (bookings || []).map((b) => {
            const carRideId = b?.carRideId || b?.car_ride_id;
            const ride = ridesById.get(String(carRideId)) || {};

            const detour = detoursByBookingId.get(String(b.id));
            const passengerRoute = buildPassengerRouteFromDetour(detour) || b.passengerRoute;

            return {
                ...b,

                // Identifiants normalisés
                carRideId: String(carRideId),

                // Infos ride (affichage cards + popup)
                departurePlace: b.departurePlace || ride.departurePlace,
                arrivalPlace: b.arrivalPlace || ride.arrivalPlace,
                departureDate: b.departureDate || ride.departureDate,
                departureTime: b.departureTime || ride.departureTime,
                dateDisplay: b.dateDisplay || buildDateDisplay(ride),

                // Pour pouvoir charger la voiture dans MyBooking
                carId: b.carId || ride.carId,

                // Détour attendu par la UI
                passengerRoute,

                // Montant affiché (fallbacks)
                totalPaid: computeTotalPriceDisplay({ booking: b, ride, detour }),
            };
        });
    } catch (e) {
        console.error('Erreur enrichBookings:', e);
        return bookings || [];
    }
};

export const BookingService = {
    // -------------------------------------------------------------------------
    // Récupérer toutes les réservations d'un utilisateur (passager)
    // DB : booking.user_id
    // Front : booking.userId
    // -------------------------------------------------------------------------
    getAll: async (userId) => {
        try {
            const safeUserId = String(userId);

            const res = await apiClient.get(ENDPOINT);
            const list = Array.isArray(res.data) ? res.data : [];

            const mine = list.filter(b => String(b.userId || b.user_id) === safeUserId);

            if (!isMock) return mine;
            return await enrichBookings(mine);
        } catch (error) {
            console.error('Erreur getAll bookings:', error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    // Récupérer toutes les réservations d'un trajet (conducteur)
    // -------------------------------------------------------------------------
    getByRideId: async (carRideId) => {
        try {
            const safeRideId = String(carRideId);

            const res = await apiClient.get(ENDPOINT);
            const list = Array.isArray(res.data) ? res.data : [];

            const byRide = list.filter(b => String(b.carRideId || b.car_ride_id) === safeRideId);

            if (!isMock) return byRide;

            // En mock, on enrichit aussi (détours + ride infos)
            const enriched = await enrichBookings(byRide);
            return enriched;
        } catch (error) {
            console.error('Erreur getByRideId bookings:', error);
            return [];
        }
    },

    // -------------------------------------------------------------------------
    // Créer une réservation
    //
    // MockAPI :
    // - 1 POST /bookings
    // - 1 POST /detours (bookingId)
    //
    // Symfony :
    // - On poste le booking, et on inclut aussi "detour" + "promoCode" en payload
    //   (le back décidera comment persister).
    // -------------------------------------------------------------------------
    create: async (bookingData) => {
        try {
            // -------------------------------------------------------------
            // Discount : on tente de résoudre discountId en MockAPI
            // (Symfony pourra le faire côté serveur)
            // -------------------------------------------------------------
            let discountId = bookingData.discountId;

            if (isMock && bookingData.promoCode) {
                const discount = await DiscountService.getByCode(bookingData.promoCode);
                if (discount?.id) discountId = discount.id;
            }

            // Payload booking
            const bookingPayload = {
                carRideId: String(bookingData.carRideId),
                userId: String(bookingData.userId),
                seats: bookingData.seats,

                // Financials (display)
                price: bookingData.price,
                commission: bookingData.commission,
                discount: bookingData.discount,
                totalPaid: bookingData.totalPaid,

                promoCode: bookingData.promoCode || '',
                discountId: discountId || null,

                status: 'pending',
            };

            // MockAPI : detour séparé
            if (isMock) {
                bookingPayload.detour = bookingData.detour || bookingData.passengerRoute || null;
            }

            const res = await apiClient.post(ENDPOINT, bookingPayload);
            const createdBooking = res.data;

            // MockAPI : persiste le detour dans /detours
            if (isMock && bookingPayload.detour && createdBooking?.id) {
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

                    // Durées détaillées (pour affichage en lecture)
                    delayPickup: detour.delayPickup,
                    durationPassenger: detour.durationPassenger,

                    // Totaux calculés côté Front (tant que le back n'est pas prêt)
                    totalPaid: bookingData.totalPaid,
                    commission: bookingData.commission,
                    discount: bookingData.discount,
                    promoCode: bookingData.promoCode || '',
                };

                await DetourService.create(detourPayload);
            }

            return createdBooking;
        } catch (error) {
            console.error('Erreur create booking:', error);
            throw error;
        }
    },

    // -------------------------------------------------------------------------
    // Mettre à jour le statut (accept/refuse)
    // -------------------------------------------------------------------------
    updateStatus: async (bookingId, action) => {
        try {
            const safeId = String(bookingId);

            // On mappe action -> status
            const status = action === 'accepted' ? 'accepted' : 'refused';

            const res = await apiClient.put(`${ENDPOINT}/${safeId}`, { status });
            return res.data;
        } catch (error) {
            console.error('Erreur updateStatus booking:', error);
            throw error;
        }
    },
};
