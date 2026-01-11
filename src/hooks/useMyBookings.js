// EcorideAKNProd/EcorideAKNProd/src/hooks/useMyBookings.js

import { useState, useEffect, useCallback } from 'react';
import { BookingService } from '../services/bookingService';
import { useToast } from '../contexts/ToastContext';

export const useMyBookings = (user) => {
    const { triggerToast } = useToast();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const data = await BookingService.getByPassenger(user.id);
            // On trie : les plus récents en premier
            const sorted = Array.isArray(data) 
                ? data.sort((a, b) => new Date(b.ride?.departureDate) - new Date(a.ride?.departureDate))
                : [];
            setBookings(sorted);
        } catch (error) {
            console.error("Erreur chargement réservations", error);
            triggerToast("Impossible de charger vos réservations.", "error");
        } finally {
            setLoading(false);
        }
    }, [user?.id, triggerToast]);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const cancelBooking = async (bookingId) => {
        try {
            await BookingService.cancel(bookingId);
            triggerToast("Réservation annulée.", "info");
            fetchBookings(); // Rafraîchir la liste
            return true;
        } catch (error) {
            console.error("Erreur annulation", error);
            triggerToast("Erreur lors de l'annulation.", "error");
            return false;
        }
    };

    // Séparation Passées / À venir (Logique métier)
    const now = new Date();
    const upcomingBookings = bookings.filter(b => b.ride && new Date(b.ride.departureDate) >= now);
    const pastBookings = bookings.filter(b => b.ride && new Date(b.ride.departureDate) < now);

    return { 
        bookings, 
        upcomingBookings, 
        pastBookings, 
        loading, 
        cancelBooking, 
        refreshBookings: fetchBookings 
    };
};