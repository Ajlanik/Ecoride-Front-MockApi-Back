// src/hooks/useRideDetailActions.js
import { useCallback, useMemo, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { RideService } from '../services/rideService';
import { calculateFinalPrice } from '../utils/pricing';

export default function useRideDetailActions({
    ride, realRideId, user, isDriver,
    seatsToBook, passengerRoute, delayPickup, durationPassenger,
    requests, setLocalRide, setCurrentRideStatus, setRequests,
    triggerToast, fetchLatestRideStatus,
}) {
    // ÉTAT LOCAL ET MÉMOIRES 
    const [bookingLoading, setBookingLoading] = useState(false);
    const [promoInput, setPromoInput] = useState('');
    const [appliedCode, setAppliedCode] = useState('');
    const [promoMessage, setPromoMessage] = useState(null);

    const priceDetails = useMemo(() => {
        return calculateFinalPrice(ride?.price || 0, seatsToBook, appliedCode);
    }, [ride?.price, seatsToBook, appliedCode]);

    const handleFinishRide = useCallback(async () => {
        try {
            if (!realRideId) return;
            await RideService.update(realRideId, { status: 'completed' });
            setLocalRide(prev => ({ ...prev, status: 'completed' }));
            setCurrentRideStatus('completed');
            triggerToast("Trajet terminé avec succès !", "success");
        } catch (e) { console.error(e); triggerToast("Erreur", "error"); }
    }, [realRideId, setLocalRide, setCurrentRideStatus, triggerToast]);

    const handlePassengerFinish = useCallback(async () => {
        try {
            const idToComplete = ride?.bookingId || ride?.id;
            await BookingService.completeBooking(idToComplete);
            setLocalRide(prev => ({ ...prev, status: 'COMPLETED' }));
            triggerToast("Trajet validé. Vous pouvez noter le conducteur.", "success");
        } catch (e) { console.error(e); triggerToast("Erreur validation", "error"); }
    }, [ride?.bookingId, ride?.id, setLocalRide, triggerToast]);

    const handleAction = useCallback(async (bookingId, newStatus) => {
        try {
            if (!realRideId) return;
            await BookingService.updateStatus(bookingId, newStatus);
            if (newStatus === 'ACCEPTED') {
                const targetRequest = requests.find(r => String(r.id) === String(bookingId));
                const requestedSeats = Math.max(1, parseInt(targetRequest?.seats, 10) || 1);
                const freshRide = await RideService.getById(realRideId);
                const currentSeats = parseInt(freshRide?.seatsAvailable, 10);
                const safeCurrentSeats = Number.isFinite(currentSeats) ? currentSeats : parseInt(ride?.seatsAvailable, 10) || 0;

                if (safeCurrentSeats < requestedSeats) {
                    await BookingService.updateStatus(bookingId, 'REJECTED');
                    triggerToast("Pas assez de places disponibles.", "error");
                    return;
                }
                const newSeatsAvailable = safeCurrentSeats - requestedSeats;
                await RideService.update(realRideId, { seatsAvailable: newSeatsAvailable });
                triggerToast("Passager accepté.", "success");
            } else { triggerToast("Statut mis à jour.", "success"); }

            setRequests(prev => prev.map(r => r.id === bookingId ? { ...r, status: newStatus } : r));
            if (fetchLatestRideStatus) fetchLatestRideStatus();
        } catch (e) { console.error(e); triggerToast("Erreur mise à jour", "error"); }
    }, [realRideId, requests, ride?.seatsAvailable, setRequests, triggerToast, fetchLatestRideStatus]);

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

    const handleBookClick = useCallback(async ({ onClose, stripePaymentIntentId } = {}) => {
        if (!user) { triggerToast("Connectez-vous.", "info"); return; }
        if (!realRideId) { triggerToast("Trajet introuvable.", "error"); return; }

        if (!stripePaymentIntentId) {
            triggerToast("Erreur: Paiement manquant.", "error");
            return;
        }

        setBookingLoading(true);
        try {
            const pickupLon = passengerRoute.pickupLon || passengerRoute.pickupLng || passengerRoute.lon || passengerRoute.lng;
            const dropoffLon = passengerRoute.dropoffLon || passengerRoute.dropoffLng || passengerRoute.lon || passengerRoute.lng;
            const pickupAddr = passengerRoute.pickupAddress || "Adresse sélectionnée";
            const dropoffAddr = passengerRoute.dropoffAddress || "Adresse sélectionnée";
            // SÉCURITÉ DISTANCE : Évite le "NaN" dans les logs
            const safeDistance = (passengerRoute.distance && !isNaN(parseFloat(passengerRoute.distance))) 
                                ? String(passengerRoute.distance) 
                                : "0";

            const bookingData = {
                carRideId: { id: parseInt(realRideId, 10) },
                passengerId: { id: parseInt(user.id, 10) },
                seats: seatsToBook,
                promoCode: appliedCode,
                price: ride?.price,
                commission: priceDetails.fee,
                discount: priceDetails.discountAmount,
                totalPaid: priceDetails.total,

                // ajout stripe
                stripePaymentIntentId: stripePaymentIntentId,

                detour: { 
                    userId: String(user.id), 
                    carRideId: realRideId,
                    seats: seatsToBook,
                    
                    pickupAddress: pickupAddr,
                    pickupLat: passengerRoute.pickupLat,
                    pickupLon: pickupLon, 
                    
                    dropoffAddress: dropoffAddr,
                    dropoffLat: passengerRoute.dropoffLat,
                    dropoffLon: dropoffLon, 

                    distance: safeDistance, // Utilisation de la distance sécurisée
                    duration: passengerRoute.duration,
                    delayPickup,
                    // TEST de retrait de ces points car ca bug peut-être
                    //durationPassenger,
                    
                    //totalPaid: priceDetails.total,
                    //commission: priceDetails.fee,
                    //discount: priceDetails.discountAmount,
                }
            };
            console.log("Envoi réservation avec Détour :", bookingData); // Log pour vérifier
            await BookingService.create(bookingData);
            triggerToast("Réservation envoyée !", "success");

            if (onClose) onClose();
        } catch (error) {
            console.error(error);
            triggerToast("Erreur réservation.", "error");
        }
        finally {
            setBookingLoading(false);
        }
    }, [user, realRideId, seatsToBook, appliedCode, ride?.price, priceDetails, passengerRoute, delayPickup, triggerToast]);

    // --- FONCTION DE NOTATION ---
    const handleRatingSubmit = useCallback(async ({ ratingTarget, reviewData, onAfterSubmit }) => {
        try {
            let targetUserId = null;
            if (isDriver) {
                // Mode Conducteur : La cible est le passager lié à la réservation
                const req = requests.find(r => String(r.id) === String(ratingTarget.bookingId));
                // Correction : on utilise passengerId (qui peut être un objet ou un ID)
                targetUserId = req ? (req.passengerId?.id || req.passengerId) : null;
            } else {
                // Mode Passager : La cible est le conducteur du trajet
                targetUserId = ride.driverUserId || ride.driverId || ride.driver?.id || ride.userId;
            }

            if (!targetUserId) {
                console.error("Impossible de trouver l'ID utilisateur cible", { isDriver, ratingTarget, ride });
                triggerToast("Erreur : Impossible d'identifier l'utilisateur à noter", "error");
                return;
            }

            const payload = {
                rating: reviewData.rating,
                comment: reviewData.comment,
                bookingId: ratingTarget.bookingId,
                targetUserId: targetUserId,
                authorUserId: user.id,
                role: isDriver ? 'DRIVER' : 'PASSENGER'
            };

            console.log("Envoi avis :", payload);
            await BookingService.submitReview(payload);
            triggerToast("Avis envoyé !", "success");

            // Mise à jour de l'UI
            // Si la cible était un PASSAGER, c'est que je suis Conducteur
            if (ratingTarget.role === 'PASSENGER') {
                setRequests(prevRequests => prevRequests.map(req => {
                    if (String(req.id) === String(ratingTarget.bookingId)) {
                        return { ...req, hasRated: true };
                    }
                    return req;
                }));
            } else {
                // Sinon je suis Passager
                setLocalRide(prev => ({ ...prev, hasDriverRated: true }));
            }

            if (onAfterSubmit) onAfterSubmit();
        } catch (e) { console.error(e); triggerToast("Erreur envoi avis", "error"); }
    }, [triggerToast, isDriver, requests, ride, user, setRequests, setLocalRide]);

    return {
        bookingLoading, promoInput, setPromoInput, appliedCode, promoMessage, priceDetails,
        handleFinishRide, handlePassengerFinish, handleAction,
        handleApplyPromo, handleBookClick, handleRatingSubmit,
    };
}