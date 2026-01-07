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

    const handleBookClick = useCallback(async ({ onClose }) => {
        if (!user) { triggerToast("Connectez-vous.", "info"); return; }
        if (!realRideId) { triggerToast("Trajet introuvable.", "error"); return; }

        setBookingLoading(true);
        try {
            // --- ATTENTIOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOONNNNNNNNNNNNNNNNN BLINDAGE DES DONNEES !!!!!!! ---
            // On s'assure de récupérer la longitude (peu importe son nom)
            const pickupLon = passengerRoute.pickupLon || passengerRoute.pickupLng || passengerRoute.lon || passengerRoute.lng;
            const dropoffLon = passengerRoute.dropoffLon || passengerRoute.dropoffLng || passengerRoute.lon || passengerRoute.lng;
            const pickupAddr = passengerRoute.pickupAddress || "Adresse sélectionnée";
            const dropoffAddr = passengerRoute.dropoffAddress || "Adresse sélectionnée";

            const bookingData = {
                carRideId: { id: parseInt(realRideId, 10) },
                passengerId: { id: parseInt(user.id, 10) },
                seats: seatsToBook,
                promoCode: appliedCode,
                price: ride?.price,
                commission: priceDetails.fee,
                discount: priceDetails.discountAmount,
                totalPaid: priceDetails.total,
                
                passengerRoute: {
                    userId: String(user.id), 
                    carRideId: realRideId,
                    seats: seatsToBook,
                    
                    pickupAddress: pickupAddr,
                    pickupLat: passengerRoute.pickupLat,
                    pickupLon: pickupLon, 
                    
                    dropoffAddress: dropoffAddr,
                    dropoffLat: passengerRoute.dropoffLat,
                    dropoffLon: dropoffLon, 

                    distance: passengerRoute.distance,
                    duration: passengerRoute.duration,
                    delayPickup,
                    durationPassenger,
                    
                    totalPaid: priceDetails.total,
                    commission: priceDetails.fee,
                    discount: priceDetails.discountAmount,
                }
            };

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
    }, [user, realRideId, seatsToBook, appliedCode, ride?.price, priceDetails, passengerRoute, delayPickup, durationPassenger, triggerToast]);

    const handleRatingSubmit = useCallback(async ({ ratingTarget, reviewData, onAfterSubmit }) => {
        try {
            let targetUserId = null;
            if (isDriver) {
                const req = requests.find(r => String(r.id) === String(ratingTarget.bookingId));
                targetUserId = req ? req.userId : null;
            } else { targetUserId = ride.driverUserId || ride.userId; }

            const payload = {
                rating: reviewData.rating,
                comment: reviewData.comment,
                bookingId: ratingTarget.bookingId,
                targetUserId: targetUserId,
                authorUserId: user.id,
                role: ratingTarget.role 
            };
            await BookingService.submitReview(payload);
            triggerToast("Avis envoyé !", "success");

            if (ratingTarget.role === 'PASSENGER') {
                // Conducteur note Passager
                setRequests(prevRequests => prevRequests.map(req => {
                    if (String(req.id) === String(ratingTarget.bookingId)) {
                        return { ...req, hasRated: true }; // Standard
                    }
                    return req;
                }));
            } else {
                // Passager note Conducteur
                setLocalRide(prev => ({ ...prev, hasDriverRated: true })); // Explicite
            }
            
            if (onAfterSubmit) onAfterSubmit();
        } catch (e) { console.error(e); triggerToast("Erreur envoi avis", "error"); }
    }, [triggerToast, isDriver, requests, ride, user]);

    return {
        bookingLoading, promoInput, setPromoInput, appliedCode, promoMessage, priceDetails,
        handleFinishRide, handlePassengerFinish, handleAction,
        handleApplyPromo, handleBookClick, handleRatingSubmit,
    };
}