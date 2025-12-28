// src/components/dashboard/RideDetailPopup.jsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import Popup from '../ui/Popup';
import RideMap from '../ui/RideMap';
import StatusBadge from '../ui/StatusBadge';
import RatingPopup from './RatingPopup';
import Button from '../ui/Button';

import RideDetailPopupDriverView from './RideDetailPopupDriverView';
import RideDetailPopupPassengerView from './RideDetailPopupPassengerView';

import useRideDetailData from '../../hooks/useRideDetailData';
import useRideDetailActions from '../../hooks/useRideDetailActions';
import { addMinutesToTime } from '../../utils/time';

// --- HELPER ROBUSTE ---
const parseCoord = (val) => {
    const num = parseFloat(val);
    return isFinite(num) ? num : undefined;
};

// Cherche les coordonnées (lat/lon) dans un objet, peu importe où elles sont cachées
const getCoords = (obj, type) => {
    if (!obj) return undefined;
    
    // Clés possibles : "pickupLat" ou "pickup" (objet) ou "startLat"...
    const latKey = type === 'pickup' ? 'pickupLat' : 'dropoffLat';
    const lonKey = type === 'pickup' ? 'pickupLon' : 'dropoffLon';

    // 1. À la racine (ex: ride.startLat ou booking.pickupLat)
    if (obj[latKey] !== undefined) return parseCoord(obj[latKey]);

    // 2. Dans passengerRoute (enrichissement BookingService)
    if (obj.passengerRoute && obj.passengerRoute[latKey] !== undefined) return parseCoord(obj.passengerRoute[latKey]);

    // 3. Dans detour (structure MockAPI brute)
    if (obj.detour && obj.detour[latKey] !== undefined) return parseCoord(obj.detour[latKey]);

    return undefined;
};

const RideDetailPopup = ({ ride, car, onClose, mode = 'view' }) => {
    const { user } = useAuth();
    
    if (!ride) return null;

    const isDriver = useMemo(() => {
        return user && String(user.id) === String(ride.userId);
    }, [user, ride]);

    const {
        realRideId, localRide, setLocalRide,
        currentRideStatus, setCurrentRideStatus,
        passengerRoute, delayPickup, durationPassenger,
        requests, setRequests, requestsLoading, selectedRequest, setSelectedRequest,
        driverInfo, fetchLatestRideStatus, handleAddressSelect, handleRouteCalculated,
    } = useRideDetailData({ ride, isDriver, mode });

    const [seatsToBook, setSeatsToBook] = useState(1);
    const [showRatingPopup, setShowRatingPopup] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null);

    const {
        bookingLoading, promoInput, setPromoInput, appliedCode, promoMessage, priceDetails,
        handleFinishRide, handlePassengerFinish, handleAction,
        handleApplyPromo, handleBookClick, handleRatingSubmit,
    } = useRideDetailActions({
        ride, realRideId, user, isDriver,
        seatsToBook, passengerRoute, delayPickup, durationPassenger,
        requests, selectedRequest,
        setLocalRide, setCurrentRideStatus, setRequests,
        triggerToast: useToast().triggerToast, fetchLatestRideStatus,
    });

    const openRating = (targetName, bookingId, role) => {
        setRatingTarget({ name: targetName, bookingId, role });
        setShowRatingPopup(true);
    };

    const onRatingSubmit = async (reviewData) => {
        await handleRatingSubmit({ ratingTarget, reviewData, onAfterSubmit: () => setShowRatingPopup(false) });
    };

    // --- CALCUL DES POINTS MAP ---

    // 1. Départ / Arrivée (Trajet Principal)
    const mapStart = useMemo(() => ({ lat: parseCoord(ride.startLat), lng: parseCoord(ride.startLon) }), [ride]);
    const mapEnd = useMemo(() => ({ lat: parseCoord(ride.endLat), lng: parseCoord(ride.endLon) }), [ride]);

    // 2. Points Passager (Pickup / Dropoff)
    const passengerStart = useMemo(() => {
        let lat, lng;
        
        if (mode === 'book') {
            // En mode réservation, on prend ce que l'utilisateur saisit
            lat = parseCoord(passengerRoute.pickupLat);
            lng = parseCoord(passengerRoute.pickupLon);
        } else if (isDriver && selectedRequest) {
            // Conducteur : on regarde la demande sélectionnée
            lat = getCoords(selectedRequest, 'pickup');
            lng = getCoords(selectedRequest, 'pickup') !== undefined ? parseCoord(selectedRequest.passengerRoute?.pickupLon || selectedRequest.detour?.pickupLon || selectedRequest.pickupLon) : undefined;
            // Simplification via helper impossible car on veut lat ET lon ensemble, on refait :
            const req = selectedRequest;
            lat = parseCoord(req.pickupLat ?? req.passengerRoute?.pickupLat ?? req.detour?.pickupLat);
            lng = parseCoord(req.pickupLon ?? req.passengerRoute?.pickupLon ?? req.detour?.pickupLon);
        } else if (!isDriver) {
            // Passager : on regarde son propre itinéraire
            lat = parseCoord(passengerRoute.pickupLat);
            lng = parseCoord(passengerRoute.pickupLon);
        }
        
        return (lat && lng) ? { lat, lng } : null;
    }, [mode, passengerRoute, isDriver, selectedRequest]);

    const passengerEnd = useMemo(() => {
        let lat, lng;

        if (mode === 'book') {
            lat = parseCoord(passengerRoute.dropoffLat);
            lng = parseCoord(passengerRoute.dropoffLon);
        } else if (isDriver && selectedRequest) {
            const req = selectedRequest;
            lat = parseCoord(req.dropoffLat ?? req.passengerRoute?.dropoffLat ?? req.detour?.dropoffLat);
            lng = parseCoord(req.dropoffLon ?? req.passengerRoute?.dropoffLon ?? req.detour?.dropoffLon);
        } else if (!isDriver) {
            lat = parseCoord(passengerRoute.dropoffLat);
            lng = parseCoord(passengerRoute.dropoffLon);
        }

        return (lat && lng) ? { lat, lng } : null;
    }, [mode, passengerRoute, isDriver, selectedRequest]);

    return (
        <>
            <Popup isOpen={true} onClose={onClose} maxWidth="max-w-5xl" padding={false}>
                <div className="flex flex-col md:flex-row w-full h-[90vh] md:h-[650px]">
                    <div className="md:w-1/2 p-6 overflow-y-auto order-2 md:order-1">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Détails</h2>
                            <StatusBadge status={currentRideStatus} />
                        </div>

                        {isDriver ? (
                            <div className="mb-4">
                                {currentRideStatus === 'scheduled' || currentRideStatus === 'accepted' || currentRideStatus === 'in_progress' || currentRideStatus === 'PENDING' ? (
                                     <Button onClick={handleFinishRide} className="w-full bg-emerald-600 text-white">Terminer le trajet</Button>
                                ) : null}
                            </div>
                        ) : null}

                        {isDriver ? (
                            <RideDetailPopupDriverView
                                ride={ride} car={car} localRide={localRide} currentRideStatus={currentRideStatus}
                                requests={requests} requestsLoading={requestsLoading}
                                selectedRequest={selectedRequest} setSelectedRequest={setSelectedRequest}
                                delayPickup={delayPickup} durationPassenger={durationPassenger} addMinutesToTime={addMinutesToTime}
                                onFinishRide={handleFinishRide} onAction={handleAction} onOpenRating={openRating}
                            />
                        ) : (
                            <RideDetailPopupPassengerView
                                ride={ride} car={car} mode={mode} localRide={localRide} currentRideStatus={currentRideStatus}
                                driverInfo={driverInfo} passengerRoute={passengerRoute}
                                delayPickup={delayPickup} durationPassenger={durationPassenger} addMinutesToTime={addMinutesToTime}
                                seatsToBook={seatsToBook} setSeatsToBook={setSeatsToBook} bookingLoading={bookingLoading}
                                promoInput={promoInput} setPromoInput={setPromoInput} promoMessage={promoMessage} appliedCode={appliedCode} priceDetails={priceDetails}
                                onApplyPromo={handleApplyPromo} onAddressSelect={handleAddressSelect}
                                onBook={() => handleBookClick({ onClose })}
                                onPassengerFinish={handlePassengerFinish} onOpenRating={openRating}
                            />
                        )}
                    </div>

                    <div className="md:w-1/2 h-64 md:h-full bg-gray-50 relative border-b md:border-l border-gray-200 order-1 md:order-2">
                        <RideMap
                            startCoords={mapStart}
                            endCoords={mapEnd}
                            passengerStart={passengerStart}
                            passengerEnd={passengerEnd}
                            readonly={true}
                            geometry={ride.geometry}
                            onRouteCalculated={handleRouteCalculated}
                        />
                    </div>
                </div>
            </Popup>

            {showRatingPopup && (
                <RatingPopup
                    isOpen={showRatingPopup} onClose={() => setShowRatingPopup(false)}
                    target={ratingTarget} onSubmit={onRatingSubmit}
                />
            )}
        </>
    );
};

export default RideDetailPopup;