import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import Popup from '../ui/Popup';
import RideMap from '../ui/RideMap';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import RatingPopup from './RatingPopup';

import RideDetailPopupDriverView from './RideDetailPopupDriverView';
import RideDetailPopupPassengerView from './RideDetailPopupPassengerView';

import useRideDetailData from '../../hooks/useRideDetailData';
import useRideDetailActions from '../../hooks/useRideDetailActions';

import { addMinutesToTime } from '../../utils/time';

const RideDetailPopup = ({ ride, car, onClose, mode = 'view' }) => {
    const { user } = useAuth();
    const { triggerToast } = useToast();

    const isDriver = useMemo(() => {
        return user && ride && String(user.id) === String(ride.userId);
    }, [user, ride]);

    // -------------------------------------------------------------------------
    // Données / fetch (statut, requests, driverInfo, route)
    // -------------------------------------------------------------------------
    const {
        realRideId,

        localRide,
        setLocalRide,
        currentRideStatus,
        setCurrentRideStatus,

        passengerRoute,
        delayPickup,
        durationPassenger,

        requests,
        setRequests,
        requestsLoading,
        selectedRequest,
        setSelectedRequest,

        driverInfo,

        fetchLatestRideStatus,
        handleAddressSelect,
        handleRouteCalculated,
    } = useRideDetailData({ ride, isDriver, mode });

    // -------------------------------------------------------------------------
    // UI state
    // -------------------------------------------------------------------------
    const [seatsToBook, setSeatsToBook] = useState(1);

    const [showRatingPopup, setShowRatingPopup] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null);

    // -------------------------------------------------------------------------
    // Actions
    // -------------------------------------------------------------------------
    const {
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
    } = useRideDetailActions({
        ride,
        realRideId,
        user,
        isDriver,

        seatsToBook,
        passengerRoute,
        delayPickup,
        durationPassenger,

        requests,
        selectedRequest,

        setLocalRide,
        setCurrentRideStatus,
        setRequests,

        triggerToast,
        fetchLatestRideStatus,
    });

    const openRating = (targetName, bookingId, role) => {
        setRatingTarget({ name: targetName, bookingId, role });
        setShowRatingPopup(true);
    };

    const onRatingSubmit = async (reviewData) => {
        await handleRatingSubmit({
            ratingTarget,
            reviewData,
            onAfterSubmit: () => setShowRatingPopup(false)
        });
    };

    // Map coords
    const mapStart = useMemo(() => ({ lat: ride?.startLat, lng: ride?.startLon }), [ride?.startLat, ride?.startLon]);
    const mapEnd = useMemo(() => ({ lat: ride?.endLat, lng: ride?.endLon }), [ride?.endLat, ride?.endLon]);

    // Passenger detour points
    const passengerStart = useMemo(() => {
        if (mode === 'book') return { lat: passengerRoute.pickupLat, lng: passengerRoute.pickupLon };
        if (isDriver && selectedRequest?.pickupLat) return { lat: selectedRequest.pickupLat, lng: selectedRequest.pickupLon };
        if (!isDriver && passengerRoute?.pickupLat) return { lat: passengerRoute.pickupLat, lng: passengerRoute.pickupLon };
        return null;
    }, [mode, passengerRoute, isDriver, selectedRequest]);

    const passengerEnd = useMemo(() => {
        if (mode === 'book') return { lat: passengerRoute.dropoffLat, lng: passengerRoute.dropoffLon };
        if (isDriver && selectedRequest?.dropoffLat) return { lat: selectedRequest.dropoffLat, lng: selectedRequest.dropoffLon };
        if (!isDriver && passengerRoute?.dropoffLat) return { lat: passengerRoute.dropoffLat, lng: passengerRoute.dropoffLon };
        return null;
    }, [mode, passengerRoute, isDriver, selectedRequest]);

    if (!ride) return null;

    return (
        <>
            <Popup isOpen={true} onClose={onClose} maxWidth="max-w-5xl" padding={false}>
                <div className="flex flex-col md:flex-row w-full h-[90vh] md:h-[650px]">
                    {/* GAUCHE: CONTENU */}
                    <div className="md:w-1/2 p-6 overflow-y-auto order-2 md:order-1">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Détails</h2>
                            <StatusBadge status={currentRideStatus} />
                        </div>

                        {/* Actions Driver */}
                        {isDriver ? (
                            <div className="mb-4">
                                {currentRideStatus === 'in_progress' && (
                                    <Button onClick={handleFinishRide} className="w-full bg-emerald-600 text-white">
                                        Terminer le trajet
                                    </Button>
                                )}
                            </div>
                        ) : null}

                        {/* Vue Driver / Passenger */}
                        {isDriver ? (
                            <RideDetailPopupDriverView
                                ride={ride}
                                car={car}
                                localRide={localRide}
                                currentRideStatus={currentRideStatus}

                                requests={requests}
                                requestsLoading={requestsLoading}
                                selectedRequest={selectedRequest}
                                setSelectedRequest={setSelectedRequest}

                                delayPickup={delayPickup}
                                durationPassenger={durationPassenger}
                                addMinutesToTime={addMinutesToTime}

                                onFinishRide={handleFinishRide}
                                onAction={handleAction}
                                onOpenRating={openRating}
                            />
                        ) : (
                            <RideDetailPopupPassengerView
                                ride={ride}
                                car={car}
                                mode={mode}
                                localRide={localRide}
                                currentRideStatus={currentRideStatus}
                                driverInfo={driverInfo}

                                passengerRoute={passengerRoute}
                                delayPickup={delayPickup}
                                durationPassenger={durationPassenger}
                                addMinutesToTime={addMinutesToTime}

                                seatsToBook={seatsToBook}
                                setSeatsToBook={setSeatsToBook}
                                bookingLoading={bookingLoading}

                                promoInput={promoInput}
                                setPromoInput={setPromoInput}
                                promoMessage={promoMessage}
                                appliedCode={appliedCode}
                                priceDetails={priceDetails}

                                onApplyPromo={handleApplyPromo}
                                onAddressSelect={handleAddressSelect}

                                // -----------------------------------------------------------------
                                // Réservation : on passe une fonction simple au composant UI.
                                // La logique reste dans le hook (pas de logique dans la vue).
                                // -----------------------------------------------------------------
                                onBook={() => handleBookClick({ onClose })}

                                onPassengerFinish={handlePassengerFinish}
                                onOpenRating={openRating}
                            />
                        )}
                    </div>

                    {/* DROITE: CARTE */}
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
                    isOpen={showRatingPopup}
                    onClose={() => setShowRatingPopup(false)}
                    target={ratingTarget}
                    onSubmit={onRatingSubmit}
                />
            )}
        </>
    );
};

export default RideDetailPopup;
