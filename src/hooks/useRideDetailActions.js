// src/hooks/useRideDetailActions.js
import { useCallback, useMemo, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { RideService } from '../services/rideService';
import { calculateFinalPrice } from '../utils/pricing';

/**
 * ============================================================================
 * HOOK : RideDetail - Actions
 * Objectif :
 * - Extraire les actions "métier" du composant UI.
 * - Centraliser les règles et garder RideDetailPopup plus lisible.
 * ============================================================================
 */
export default function useRideDetailActions({
    ride,
    realRideId,
    user,
    isDriver,

    seatsToBook,
    passengerRoute,
    delayPickup,
    durationPassenger,

    requests,

    setLocalRide,
    setCurrentRideStatus,
    setRequests,

    triggerToast,
    fetchLatestRideStatus,
}) {
    const [bookingLoading, setBookingLoading] = useState(false);

    const [promoInput, setPromoInput] = useState('');
    const [appliedCode, setAppliedCode] = useState('');
    const [promoMessage, setPromoMessage] = useState(null);

    // -------------------------------------------------------------------------
    // Détails prix (calcul Front tant que le back n'est pas prêt)
    // -------------------------------------------------------------------------
    const priceDetails = useMemo(() => {
        return calculateFinalPrice(ride?.price || 0, seatsToBook, appliedCode);
    }, [ride?.price, seatsToBook, appliedCode]);

    // -------------------------------------------------------------------------
    // Conducteur : terminer le trajet
    // -------------------------------------------------------------------------
    const handleFinishRide = useCallback(async () => {
        if (!window.confirm("Confirmer l'arrivée à destination et terminer le trajet ?")) return;

        try {
            if (!realRideId) return;

            await RideService.update(realRideId, { status: 'completed' });

            setLocalRide(prev => ({ ...prev, status: 'completed' }));
            setCurrentRideStatus('completed');

            triggerToast("Trajet terminé avec succès !", "success");
        } catch (e) {
            console.error(e);
            triggerToast("Erreur", "error");
        }
    }, [realRideId, setLocalRide, setCurrentRideStatus, triggerToast]);

    // -------------------------------------------------------------------------
    // Passager : confirmer fin de trajet (booking -> COMPLETED)
    // -------------------------------------------------------------------------
    const handlePassengerFinish = useCallback(async () => {
        if (!window.confirm("Confirmez-vous avoir terminé le trajet ?")) return;

        try {
            const idToComplete = ride?.bookingId || ride?.id;
            await BookingService.completeBooking(idToComplete);

            setLocalRide(prev => ({ ...prev, status: 'COMPLETED' }));
            triggerToast("Trajet validé. Vous pouvez noter le conducteur.", "success");
        } catch (e) {
            console.error(e);
            triggerToast("Erreur validation", "error");
        }
    }, [ride?.bookingId, ride?.id, setLocalRide, triggerToast]);

    // -------------------------------------------------------------------------
    // Conducteur : accepter/refuser une demande
    // Règle actuelle : une réservation acceptée => les autres seront refusées
    // + décrément seatsAvailable pour Mock
    // -------------------------------------------------------------------------
    const handleAction = useCallback(async (bookingId, newStatus) => {
        try {
            if (!realRideId) return;

            await BookingService.updateStatus(bookingId, newStatus);

            // -----------------------------------------------------------------
            // Si on accepte : on décrémente seatsAvailable côté ride
            // -----------------------------------------------------------------
            if (newStatus === 'ACCEPTED') {
                const targetRequest = requests.find(r => String(r.id) === String(bookingId));
                const requestedSeats = Math.max(1, parseInt(targetRequest?.seats, 10) || 1);

                // Version fraîche du ride (évite conflits)
                const freshRide = await RideService.getById(realRideId);

                const currentSeats = parseInt(freshRide?.seatsAvailable, 10);
                const safeCurrentSeats = Number.isFinite(currentSeats)
                    ? currentSeats
                    : parseInt(ride?.seatsAvailable, 10) || 0;

                if (safeCurrentSeats < requestedSeats) {
                    await BookingService.updateStatus(bookingId, 'REJECTED');
                    triggerToast("Pas assez de places disponibles pour accepter cette demande.", "error");
                    return;
                }

                const newSeatsAvailable = safeCurrentSeats - requestedSeats;
                await RideService.update(realRideId, { seatsAvailable: newSeatsAvailable });

                triggerToast("Passager accepté, places mises à jour.", "success");
            } else {
                triggerToast(newStatus === 'REJECTED' ? "Demande refusée" : "Statut mis à jour", "success");
            }

            // -----------------------------------------------------------------
            // Mise à jour locale : liste demandes
            // -----------------------------------------------------------------
            setRequests(prev => prev.map(r => r.id === bookingId ? { ...r, status: newStatus } : r));

            // Rafraîchir le statut du ride (utile en navigation entre pages)
            if (fetchLatestRideStatus) fetchLatestRideStatus();
        } catch (e) {
            console.error(e);
            triggerToast("Erreur mise à jour", "error");
        }
    }, [
        realRideId,
        requests,
        ride?.seatsAvailable,
        setRequests,
        triggerToast,
        fetchLatestRideStatus
    ]);

    // -------------------------------------------------------------------------
    // Promo : appliquée côté Front (en attendant le back)
    // -------------------------------------------------------------------------
    const handleApplyPromo = useCallback(() => {
        if (!promoInput) return;

        const testCalc = calculateFinalPrice(ride?.price || 0, seatsToBook, promoInput);

        if (testCalc.isValidCode) {
            setAppliedCode(promoInput);
            setPromoMessage({ type: 'success', text: `Code ${promoInput} appliqué !` });
        } else {
            setAppliedCode('');
            setPromoMessage({ type: 'error', text: 'Code invalide ou expiré' });
        }
    }, [promoInput, ride?.price, seatsToBook]);

    // -------------------------------------------------------------------------
    // Booking : création de réservation
    // DB : booking = userId + carRideId + seats + promoCode + route
    // -------------------------------------------------------------------------
    const handleBookClick = useCallback(async ({ onClose }) => {
        if (!user) {
            triggerToast("Connectez-vous pour réserver.", "info");
            return;
        }
        if (!realRideId) {
            triggerToast("Trajet introuvable.", "error");
            return;
        }

        setBookingLoading(true);
        try {
            const bookingData = {
                carRideId: realRideId,
                userId: user.id,

                // Nombre de places demandées
                seats: seatsToBook,

                // Code promo (sera résolu en discountId dans BookingService)
                promoCode: appliedCode,

                // Infos financières (pour affichage immédiat côté Front)
                price: ride?.price,
                commission: priceDetails.fee,
                discount: priceDetails.discountAmount,
                totalPaid: priceDetails.total,

                // Détour : stocké dans /detours (MockAPI) ou géré côté backend (Symfony)
                detour: {
                    userId: user.id,
                    carRideId: realRideId,
                    seats: seatsToBook,

                    pickupAddress: passengerRoute.pickupAddress,
                    pickupLat: passengerRoute.pickupLat,
                    pickupLon: passengerRoute.pickupLon,

                    dropoffAddress: passengerRoute.dropoffAddress,
                    dropoffLat: passengerRoute.dropoffLat,
                    dropoffLon: passengerRoute.dropoffLon,

                    distance: passengerRoute.distance,
                    duration: passengerRoute.duration,

                    // -----------------------------------------------------------------
                    // Durées détaillées : indispensables pour l'affichage des horaires
                    // (pickup != départ conducteur, dropoff != pickup)
                    // -----------------------------------------------------------------
                    delayPickup,
                    durationPassenger,

                    totalPaid: priceDetails.total,
                    commission: priceDetails.fee,
                    discount: priceDetails.discountAmount,
                }
            };

            await BookingService.create(bookingData);

            triggerToast("Réservation envoyée ! En attente du conducteur.", "success");
            if (onClose) onClose();
        } catch (error) {
            console.error(error);
            triggerToast("Erreur lors de la réservation.", "error");
        } finally {
            setBookingLoading(false);
        }
    }, [
        user,
        realRideId,
        seatsToBook,
        appliedCode,
        ride?.price,
        priceDetails,
        passengerRoute,
        delayPickup,
        durationPassenger,
        triggerToast
    ]);

    // -------------------------------------------------------------------------
    // Rating : soumission avis
    // IMPORTANT :
    // - Ton projet n'a pas de RatingService dédié.
    // - On utilise BookingService.submitReview qui existe déjà.
    // -------------------------------------------------------------------------
    const handleRatingSubmit = useCallback(async ({ ratingTarget, reviewData, onAfterSubmit }) => {
        try {
            await BookingService.submitReview(ratingTarget.bookingId, ratingTarget.role, reviewData);

            triggerToast("Avis envoyé !", "success");
            if (onAfterSubmit) onAfterSubmit();
        } catch (e) {
            console.error(e);
            triggerToast("Erreur", "error");
        }
    }, [triggerToast]);

    return {
        bookingLoading,

        promoInput,
        setPromoInput,
        appliedCode,
        promoMessage,
        priceDetails,

        handleFinishRide,
        handlePassengerFinish,
        handleAction,

        handleApplyPromo,
        handleBookClick,

        handleRatingSubmit,
    };
}
