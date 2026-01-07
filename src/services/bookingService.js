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
// On enrichit les réservations avec les infos liées aux trajets, utilisateurs, détours, etc.
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
            const carRideId = b?.carRideId || b?.car_ride_id || b?.rideIdSimple;
            const ride = ridesById.get(String(carRideId)) || {};


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

            const mappedList = list.map(b => {
                if (isMock) return b;

                // 1. Récupération des objets imbriqués envoyés par Java
                const ride = b.carRideId || {};      // Le Trajet
                const driver = ride.driver || {};    // Le Conducteur
                const passenger = b.passengerId || {}; // Le Passager (moi)
                const detour = b.detour || {};       // Le Détour (s'il y en a un)
                const car = ride.car || {};          // La Voiture

                // 2. Construction de l'objet passengerRoute (CRUCIAL pour la carte)
                // On prend les infos du détour s'il existe, sinon celles du trajet global
                const passengerRoute = {
                    pickupAddress: detour.pickupAddress || ride.departurePlace,
                    pickupLat: detour.pickupLat || ride.startLat, // Sécurité
                    pickupLon: detour.pickupLon || ride.startLon, // Sécurité

                    dropoffAddress: detour.dropoffAddress || ride.arrivalPlace,
                    dropoffLat: detour.dropoffLat || ride.endLat,  // Sécurité
                    dropoffLon: detour.dropoffLon || ride.endLon,  // Sécurité

                    distance: detour.distance || ride.distance,
                    duration: detour.duration || null,
                    delayPickup: detour.delayPickup || 0,
                    durationPassenger: detour.durationPassenger || 0
                };

                // 3. Construction de l'objet final aplati
                return {
                    ...b,
                    id: b.id,

                    // Filtrage et relations
                    userId: String(passenger.id || b.userId || ''),
                    driverUserId: driver.id,
                    carId: car.id,
                    carRideId: ride.id,

                    // Affichage liste
                    dateDisplay: ride.departureDate ? `${ride.departureDate}T${ride.departureTime}` : null,
                    pickupAddress: passengerRoute.pickupAddress, // Pour la carte de la liste
                    dropoffAddress: passengerRoute.dropoffAddress,
                    totalPriceDisplay: b.totalPaid || b.price, // Prix payé par le passager

                    // Affichage détail (Popup)
                    passengerRoute: passengerRoute, // 👈 On passe l'objet complet au popup
                    status: (b.status || 'PENDING').toUpperCase(),

                    // On garde une trace des objets originaux au cas où
                    originalDetour: detour
                };
            });

            // Filtrage côté client
            const mine = mappedList.filter(b => String(b.userId) === safeUserId);
            return mine;

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

            // --- DEBUG ---
            console.log("======/////======= DEBUG - Ride ID cherché :", safeRideId);
            // -------------

            const byRide = list.filter(b => {
                // 1. Essai : ID direct ou snake_case
                let extractedId = b.carRideId || b.car_ride_id;

                // 2. Essai : Si c'est un objet, on cherche l'ID dedans
                if (extractedId && typeof extractedId === 'object') {
                    extractedId = extractedId.id;
                }

                // 3. Essai : Champ plat spécifique (parfois utilisé dans les DTOs)
                if (!extractedId && b.rideIdSimple) {
                    extractedId = b.rideIdSimple;
                }

                // Comparaison sécurisée
                return String(extractedId) === safeRideId;
            });

            console.log("VVVVVVVVVVV DEBUG - Réservations filtrées (Nombre):", byRide.length);

            // Si on est sur le vrai Backend Java (!isMock), on adapte les données
            if (!isMock) {
                return byRide.map(b => ({
                    ...b,
                    // On remonte l'ID pour que React s'y retrouve
                    userId: b.passengerId?.id,

                    // On construit le nom complet (sinon ça affiche "Passager inconnu")
                    passengerName: b.passengerId?.firstName
                        ? `${b.passengerId.firstName} ${b.passengerId.lastName}`
                        : 'Passager',

                    // On récupère l'avatar
                    passengerAvatar: b.passengerId?.avatar || b.passengerId?.picture || null,

                    // On force le statut en MAJUSCULES pour que les boutons s'affichent
                    status: (b.status || 'PENDING').toUpperCase()
                }));
            }

            return await enrichBookings(byRide);
        } catch (error) {
            console.error('Erreur getByRideId bookings:', error);
            return [];
        }
    },
    // -----------------------------------------------------------
    // PARTIE PASSAGER : Version "IDs Simples"
    // -----------------------------------------------------------
    create: async (bookingData) => {
        try {
            // 1. Extraction propre des IDs
            let rawRideId = bookingData.carRideId;
            if (rawRideId && typeof rawRideId === 'object') rawRideId = rawRideId.id;

            let rawPassengerId = bookingData.passengerId || bookingData.userId;
            if (rawPassengerId && typeof rawPassengerId === 'object') rawPassengerId = rawPassengerId.id;

            // 2. Construction du Payload
            // ON ENVOIE DES ENTIERS -> Le Setter Java setCarRideId(Integer id) va gérer la conversion !
            const bookingPayload = {
                carRideId: parseInt(rawRideId, 10), 
                passengerId: parseInt(rawPassengerId, 10),
                
                seats: parseInt(bookingData.seats, 10),
                price: parseFloat(bookingData.price),
                commission: parseFloat(bookingData.commission),
                totalPaid: parseFloat(bookingData.totalPaid),
                status: 'PENDING',
                
                promoCode: bookingData.promoCode || '',
                discount: bookingData.discount ? parseFloat(bookingData.discount) : 0,
            };

            // Gestion du détour
            const detourSource = bookingData.detour || bookingData.passengerRoute;
            if (detourSource) {
                bookingPayload.detour = {
                    pickupAddress: detourSource.pickupAddress,
                    pickupLat: detourSource.pickupLat,
                    pickupLon: detourSource.pickupLon || detourSource.pickupLng,
                    dropoffAddress: detourSource.dropoffAddress,
                    dropoffLat: detourSource.dropoffLat,
                    dropoffLon: detourSource.dropoffLon || detourSource.dropoffLng,
                    distance: detourSource.distance,
                    duration: parseInt(detourSource.duration || 0, 10),
                    delayPickup: parseInt(detourSource.delayPickup || 0, 10),
                };
            }

            console.group("OoOoOoOoOoOoO [DEBUG-FRONT] Envoi (ID Simple)");
            console.log("Structure:", JSON.stringify(bookingPayload, null, 2));
            console.groupEnd();

            const createdBooking = await apiClient.post(ENDPOINT, bookingPayload);
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

   /* submitReview: async (reviewData) => {
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
    } */
   submitReview: async (reviewData) => {
        try {
            // On prépare l'objet de base
            const cleanPayload = {
                rating: parseInt(reviewData.rating, 10),
                comment: reviewData.comment || '',
                bookingId: parseInt(reviewData.bookingId, 10),
                authorUserId: parseInt(reviewData.authorUserId, 10),
                role: reviewData.role || 'unknown'
            };

            // On n'ajoute targetUserId QUE s'il est valide (pas undefined, pas null)
            const targetId = reviewData.targetUserId || reviewData.target?.id;
            if (targetId && targetId !== "undefined") {
                cleanPayload.targetUserId = parseInt(targetId, 10);
            }

            console.log("########################## [BookingService] Envoi review propre:", cleanPayload);
            return await apiClient.post('/reviews', cleanPayload);
        } catch (error) {
            console.error('Erreur submitReview:', error);
            throw error;
        }
    }
};