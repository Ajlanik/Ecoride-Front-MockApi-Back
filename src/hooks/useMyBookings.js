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
            // Récupérer les réservations
            const data = await BookingService.getAll(user.id);
            // On trie : les plus récents en premier
            const sorted = Array.isArray(data)
                ? data.sort((a, b) => new Date(b.dateDisplay) - new Date(a.dateDisplay))
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

    const handleCancelBooking = async (bookingId) => {
        try {
            await BookingService.updateStatus(bookingId, 'CANCELLED');
            triggerToast("Réservation annulée.", "info");
            // fetchBookings(); // Rafraîchir la liste
            setBookings(prev => prev.map(b => 
                b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
            ));
            return true;
        } catch (error) {
            console.error("Erreur annulation", error);
            triggerToast("Erreur lors de l'annulation.", "error");
            return false;
        }
    };

    // Séparer les réservations à venir et passées
    const now = new Date();
    // On considère qu'une réservation est passée si sa dateDisplay est antérieure à aujourd'hui
    const upcomingBookings = bookings.filter(b => b.dateDisplay && new Date(b.dateDisplay) >= now);
    const pastBookings = bookings.filter(b => b.dateDisplay && new Date(b.dateDisplay) < now);

    return { 
        bookings, 
        upcomingBookings, 
        pastBookings, 
        loading, 
        cancelBooking: handleCancelBooking, 
        refreshBookings: fetchBookings
    };
};