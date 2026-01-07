// src/components/dashboard/RideDetailPopup.jsx
import React, { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

import Popup from '../ui/Popup';
import RideMap from '../ui/RideMap';
import Button from '../ui/Button';
import StatusBadge from '../ui/StatusBadge';
import RatingPopup from './RatingPopup';
import ConfirmPopup from '../ui/ConfirmPopup';

import RideDetailPopupDriverView from './RideDetailPopupDriverView';
import RideDetailPopupPassengerView from './RideDetailPopupPassengerView';

import useRideDetailData from '../../hooks/useRideDetailData';
import useRideDetailActions from '../../hooks/useRideDetailActions';

import { addMinutesToTime } from '../../utils/time';

// --- HELPERS ---

const parseCoord = (val) => {
    const num = parseFloat(val);
    return isFinite(num) ? num : undefined;
};

const getCoords = (obj, type) => {
    if (!obj) return undefined;

    const latKey = type === 'pickup' ? 'pickupLat' : 'dropoffLat';
// On cherche la coordonnée dans l'objet principal
    if (obj[latKey] !== undefined) return parseCoord(obj[latKey]);
// On cherche dans passengerRoute
    if (obj.passengerRoute && obj.passengerRoute[latKey] !== undefined) return parseCoord(obj.passengerRoute[latKey]);
// On cherche dans detour
    if (obj.detour && obj.detour[latKey] !== undefined) return parseCoord(obj.detour[latKey]);

    return undefined;
};

const RideDetailPopup = ({ ride, car, onClose, mode = 'view' }) => {
    const { user } = useAuth();

    if (!ride) return null;

    const isDriver = useMemo(() => {
        if (!user || !ride) return false;
        // On vérifie si l'utilisateur connecté est le conducteur du trajet
        const ownerId = ride.userId || ride.driverId || ride.driver?.id;
        // Comparaison en string pour éviter les problèmes de type
        return String(user.id) === String(ownerId);
    }, [user, ride]);

    // --- HOOKS DATA & ACTIONS ---
    const {
        realRideId, localRide, setLocalRide,
        currentRideStatus, setCurrentRideStatus,
        passengerRoute, delayPickup, durationPassenger,
        requests, setRequests, requestsLoading, selectedRequest, setSelectedRequest,
        driverInfo, fetchLatestRideStatus, handleAddressSelect, handleRouteCalculated,
    } = useRideDetailData({ ride, isDriver, mode });


    console.log("🔍 [RideDetailPopup] DEBUG DATA:", {
        rideProp: ride,                 // Ce que le parent (MyBooking) a envoyé
        localRideFromHook: localRide,   // Ce que le hook a fusionné 
        passengerRoute: passengerRoute, // Itinéraire passager
        geometryProp: ride?.geometry,   // La ligne bleue (si elle vient du parent)
        geometryHook: localRide?.geometry // La ligne bleue (si elle vient du hook/serveur)
    });



    const [seatsToBook, setSeatsToBook] = useState(1);
    const [showRatingPopup, setShowRatingPopup] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null);

    // État pour la confirmation
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        confirmText: 'Confirmer',
        isDanger: false
    });

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

    // --- LOGIQUE D'OUVERTURE DU POPUP ---
    const requestFinishRide = () => {
        setConfirmModal({
            isOpen: true,
            title: "Terminer le trajet",
            message: "Avez-vous bien déposé tous les passagers et terminé ce trajet ?",
            confirmText: "Oui, terminer",
            onConfirm: handleFinishRide,
            isDanger: false
        });
    };

    const requestPassengerFinish = () => {
        setConfirmModal({
            isOpen: true,
            title: "Validation passager",
            message: "Confirmez-vous que le trajet est terminé et que vous êtes bien arrivé ?",
            confirmText: "Oui, valider",
            onConfirm: handlePassengerFinish,
            isDanger: false
        });
    };

    const openRating = (targetName, bookingId, role) => {
        // Sécurisation du rôle
        const safeRole = role ? role.toUpperCase() : '';

        console.log(`Ouverture notation. Cible: ${targetName}, Role: ${safeRole}, Booking: ${bookingId}`);

        setRatingTarget({ name: targetName, bookingId, role: safeRole });
        setShowRatingPopup(true);
    };

    const onRatingSubmit = async (reviewData) => {
        await handleRatingSubmit({ ratingTarget, reviewData, onAfterSubmit: () => setShowRatingPopup(false) });
    };

    // --- CALCUL DES POINTS MAP ---

    const mapStart = useMemo(() => ({ lat: parseCoord(ride.startLat), lng: parseCoord(ride.startLon) }), [ride.startLat, ride.startLon]);
    const mapEnd = useMemo(() => ({ lat: parseCoord(ride.endLat), lng: parseCoord(ride.endLon) }), [ride.endLat, ride.endLon]);

    // Extraction des valeurs primitives
    const pPickupLat = passengerRoute?.pickupLat;
    const pPickupLon = passengerRoute?.pickupLon;
    const pDropoffLat = passengerRoute?.dropoffLat;
    const pDropoffLon = passengerRoute?.dropoffLon;

    const passengerStart = useMemo(() => {
        let lat, lng;

        if (mode === 'book') {
            lat = parseCoord(pPickupLat);
            lng = parseCoord(pPickupLon);
        } else if (isDriver && selectedRequest) {
            lat = getCoords(selectedRequest, 'pickup');
            const req = selectedRequest;
            lng = parseCoord(req.pickupLon ?? req.passengerRoute?.pickupLon ?? req.detour?.pickupLon);
        } else if (!isDriver) {
            lat = parseCoord(pPickupLat);
            lng = parseCoord(pPickupLon);
        }

        return (lat && lng) ? { lat, lng } : null;
    }, [mode, isDriver, selectedRequest, pPickupLat, pPickupLon]);

    const passengerEnd = useMemo(() => {
        let lat, lng;

        if (mode === 'book') {
            lat = parseCoord(pDropoffLat);
            lng = parseCoord(pDropoffLon);
        } else if (isDriver && selectedRequest) {
            lat = getCoords(selectedRequest, 'dropoff');
            const req = selectedRequest;
            lng = parseCoord(req.dropoffLon ?? req.passengerRoute?.dropoffLon ?? req.detour?.dropoffLon);
        } else if (!isDriver) {
            lat = parseCoord(pDropoffLat);
            lng = parseCoord(pDropoffLon);
        }

        return (lat && lng) ? { lat, lng } : null;
    }, [mode, isDriver, selectedRequest, pDropoffLat, pDropoffLon]);
   
 // --- LOG DE DEBUG CONDUCTEUR ---
    console.group("@@@@ [DEBUG-POPUP] Vérification Conducteur");
    console.log("User Connecté (ID):", user?.id);
    console.log("Ride ID:", ride?.id);
    console.log("Ride userId:", ride?.userId);
    console.log("Ride driverId:", ride?.driverId);
    console.log("Ride driver.id:", ride?.driver?.id);
    console.log("RÉSULTAT isDriver:", isDriver);
    console.groupEnd();
// -------------------------------
   
    return (
        <>
            {/* Titre simple et propre */}
            <Popup isOpen={true} onClose={onClose} title="Détails du trajet" maxWidth="max-w-5xl" padding={false}>
                <div className="flex flex-col md:flex-row w-full h-[90vh] md:h-[650px]">
                    {/* GAUCHE: CONTENU */}
                    <div className="md:w-1/2 p-6 overflow-y-auto order-2 md:order-1">

                        {/* En-tête interne : Badge aligné à droite (uniquement si statut valide) */}
                        <div className="flex justify-end mb-4 min-h-[24px]">
                            {currentRideStatus && (
                                <StatusBadge status={currentRideStatus} />
                            )}
                        </div>

                        {/* Suppression du bouton en double ici (il est géré dans RideDetailPopupDriverView) */}

                        {isDriver ? (
                            <RideDetailPopupDriverView
                                ride={ride} car={car} localRide={localRide} currentRideStatus={currentRideStatus}
                                requests={requests} requestsLoading={requestsLoading}
                                selectedRequest={selectedRequest} setSelectedRequest={setSelectedRequest}
                                delayPickup={delayPickup} durationPassenger={durationPassenger} addMinutesToTime={addMinutesToTime}
                                onFinishRide={requestFinishRide}
                                onAction={handleAction} onOpenRating={openRating}
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
                                onPassengerFinish={requestPassengerFinish}
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
                            geometry={localRide?.geometry || ride.geometry}
                            onRouteCalculated={handleRouteCalculated}
                        />
                    </div>
                </div>
            </Popup>

            {/* Popup de notation */}
            {showRatingPopup && (
                <RatingPopup
                    isOpen={showRatingPopup} onClose={() => setShowRatingPopup(false)}
                    target={ratingTarget} onSubmit={onRatingSubmit}
                />
            )}

            {/* Popup de confirmation (Design cohérent) */}
            <ConfirmPopup
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                isDanger={confirmModal.isDanger}
            />
        </>
    );
};

export default RideDetailPopup;