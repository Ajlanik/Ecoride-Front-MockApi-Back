import apiClient from './apiClient';
import { RideService } from './rideService';
import { UserService } from './userService';

const ENDPOINT = '/bookings'; 

export const BookingService = {

    getAll: async (userId) => {
        try {
            const bookings = await apiClient.get(`${ENDPOINT}?userId=${userId}`);
            const enrichedBookings = await Promise.all(bookings.map(async (booking) => {
                try {
                    const ride = await RideService.getById(booking.carRideId);
                    return {
                        ...booking,
                        rideStatus: ride.status, 
                        bookingId: booking.id,   
                        
                        isPassengerRated: booking.isPassengerRated || false,
                        isDriverRated: booking.isDriverRated || false,

                        driverId: ride.userId, 
                        carRideId: ride.id,    
                        
                        departurePlace: booking.pickupAddress || ride.departurePlace,
                        arrivalPlace: booking.dropoffAddress || ride.arrivalPlace,
                        startLat: parseFloat(booking.pickupLat || ride.startLat),
                        startLon: parseFloat(booking.pickupLon || ride.startLon),
                        endLat: parseFloat(booking.dropoffLat || ride.endLat),
                        endLon: parseFloat(booking.dropoffLon || ride.endLon),
                        driverName: "Conducteur EcoRide", 
                        dateDisplay: ride.departureDate + 'T' + ride.departureTime,
                        departureDate: ride.departureDate,
                        departureTime: ride.departureTime,
                        duration: ride.duration,           
                        price: booking.price || ride.price,
                        nbSeats: booking.nbSeats || 1,
                        carId: ride.carId
                    };
                } catch (err) {
                    return { ...booking, departurePlace: "Inconnu" };
                }
            }));
            return enrichedBookings;
        } catch (error) {
            console.error("Erreur getAll", error);
            return [];
        }
    },

    getByRideId: async (rideId) => {
        try {
            
            const bookings = await apiClient.get(`${ENDPOINT}?carRideId=${rideId}`);
            const enriched = await Promise.all(bookings.map(async (booking) => {
                try {
                    let passenger = null;
                    if(booking.userId) {
                        try { passenger = await UserService.getById(booking.userId); } catch(e) {}
                    }
                    return {
                        ...booking,
                        nbSeats: booking.nbSeats || 1,
                        passengerName: passenger ? `${passenger.firstName} ${passenger.lastName}` : "Passager Inconnu",
                        passengerScore: passenger ? (passenger.credits > 10 ? 4.8 : 4.2) : 0, 
                        passengerAvatar: passenger?.picture,
                        isPassengerRated: booking.isPassengerRated || false
                    };
                } catch (e) { return booking; }
            }));
            return enriched;
        } catch (error) {
            return [];
        }
    },

    create: async (bookingData) => {
        try {
            const { rideId, passengerId, price, passengerRoute, seats } = bookingData;
            const payload = {
                carRideId: String(rideId), 
                userId: String(passengerId),
                status: "PENDING",
                price: price * seats,
                nbSeats: seats,
                date: new Date().toISOString(),
                pickupAddress: passengerRoute?.pickupAddress || "",
                pickupLat: passengerRoute?.pickupLat || null,
                pickupLon: passengerRoute?.pickupLon || null,
                dropoffAddress: passengerRoute?.dropoffAddress || "",
                dropoffLat: passengerRoute?.dropoffLat || null,
                dropoffLon: passengerRoute?.dropoffLon || null,
                distance: passengerRoute?.distance || null,
                duration: passengerRoute?.duration || null,
                isPassengerRated: false,
                isDriverRated: false
            };
            return await apiClient.post(ENDPOINT, payload);
        } catch (error) { throw error; }
    },

    updateStatus: async (bookingId, newStatus) => {
         try {
            if (newStatus === 'ACCEPTED') {
                const bookingResponse = await apiClient.get(`${ENDPOINT}/${bookingId}`);
                const seatsToBook = bookingResponse.nbSeats || 1;
                const rideId = bookingResponse.carRideId;
                const ride = await RideService.getById(rideId);
                if (ride.seatsAvailable < seatsToBook) throw new Error("Plus assez de places disponibles !");
                await RideService.update(rideId, { seatLeft: ride.seatsAvailable - seatsToBook });
            }
            return await apiClient.put(`${ENDPOINT}/${bookingId}`, { status: newStatus });
        } catch (error) { throw error; }
    },
    
    cancel: async (id) => {
        return await apiClient.delete(`${ENDPOINT}/${id}`);
    },

    // ---  COMPLETION DU BOOKING ---
    completeBooking: async (bookingId) => {
    
        if (!bookingId) throw new Error("ID Booking manquant !");
        
        try {
            const res = await apiClient.put(`${ENDPOINT}/${bookingId}`, { status: 'COMPLETED' });

            return res;
        } catch (e) {
            throw e;
        }
    },

    submitReview: async (bookingId, role, reviewData) => {
  
        if (!bookingId) throw new Error("ID Booking manquant pour l'avis !");

        // On sauvegarde aussi le commentaire et la note pour de vrai
        const payload = role === 'driver' 
            ? { isPassengerRated: true, passengerRating: reviewData.rating, passengerComment: reviewData.comment }
            : { isDriverRated: true, driverRating: reviewData.rating, driverComment: reviewData.comment };
        
        try {
            const res = await apiClient.put(`${ENDPOINT}/${bookingId}`, payload);

            return true;
        } catch (e) {

            throw e;
        }
    }
};