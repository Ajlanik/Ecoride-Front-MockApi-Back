// src/hooks/useRideDetailData.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { RideService } from '../services/rideService';
import { UserService } from '../services/userService';

/**
 * ============================================================================
 * HOOK : RideDetail - Data
 * Objectif :
 * - Centraliser les fetchs (statut trajet, demandes conducteur, infos driver).
 * - Centraliser la préparation de la route passager (valeurs initiales).
 * - Garder RideDetailPopup "léger" et orienté rendu.
 * ============================================================================
 */
export default function useRideDetailData({ ride, isDriver, mode }) {
    // -------------------------------------------------------------------------
    // Id réel du trajet :
    // - SearchResults : ride.id
    // - MyBooking : ride.carRideId
    // -------------------------------------------------------------------------
    const realRideId = useMemo(() => ride?.carRideId || ride?.id, [ride]);

    const [localRide, setLocalRide] = useState(ride);
    const [currentRideStatus, setCurrentRideStatus] = useState(ride?.rideStatus || ride?.status);

    const [passengerRoute, setPassengerRoute] = useState({});
    const [delayPickup, setDelayPickup] = useState(0);
    const [durationPassenger, setDurationPassenger] = useState(0);

    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);

    // -------------------------------------------------------------------------
    // Init locale (quand on ouvre le popup / change de ride)
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!ride) return;

        setLocalRide(ride);
        setCurrentRideStatus(ride?.rideStatus || ride?.status);

        // -----------------------------------------------------------------
        // Route :
        // - Mode "book" : on initialise sur trajet complet (modifiable)
        // - Mode "view" depuis MyBooking : si un detour existe, on l'utilise
        // -----------------------------------------------------------------
        const fromBookingDetour = ride?.passengerRoute;

        if (mode !== 'book' && fromBookingDetour?.pickupAddress) {
            setPassengerRoute(fromBookingDetour);

            // -----------------------------------------------------------------
            // Timeline (lecture) : on réhydrate les durées détaillées si elles ont
            // été enregistrées au moment de la réservation.
            // -----------------------------------------------------------------
            const safeDelay = Number(fromBookingDetour.delayPickup);
            const safeDurationPassenger = Number(fromBookingDetour.durationPassenger);

            setDelayPickup(prev => (Number.isFinite(safeDelay) && prev !== safeDelay ? safeDelay : prev));
            setDurationPassenger(prev => (
                Number.isFinite(safeDurationPassenger)
                    ? (prev !== safeDurationPassenger ? safeDurationPassenger : prev)
                    : prev
            ));
        } else {
            // Reset (évite de conserver un ancien état lors du changement de ride)
            setDelayPickup(prev => (prev !== 0 ? 0 : prev));
            setDurationPassenger(prev => (prev !== 0 ? 0 : prev));

            setPassengerRoute({
                pickupAddress: ride.departurePlace,
                pickupLat: ride.startLat,
                pickupLon: ride.startLon,
                dropoffAddress: ride.arrivalPlace,
                dropoffLat: ride.endLat,
                dropoffLon: ride.endLon
            });
        }

        // On reset la sélection côté conducteur
        setSelectedRequest(null);
    }, [ride, mode]);

    // -------------------------------------------------------------------------
    // Fetch statut frais du trajet
    // Objectif : éviter d'afficher un statut obsolète quand on vient de MyBooking
    // -------------------------------------------------------------------------
    const fetchLatestRideStatus = useCallback(async () => {
        try {
            if (!realRideId) return;
            const freshRide = await RideService.getById(realRideId);
            if (!freshRide) return;

            setCurrentRideStatus(freshRide.status);
        } catch (e) {
            console.error(e);
        }
    }, [realRideId]);

    // -------------------------------------------------------------------------
    // Fetch demandes réservation (vue conducteur)
    // -------------------------------------------------------------------------
    const fetchRequests = useCallback(async () => {
        try {
            if (!realRideId) return;
            setRequestsLoading(true);
            const data = await BookingService.getByRideId(realRideId);
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
            setRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    }, [realRideId]);

    // -------------------------------------------------------------------------
    // Fetch infos conducteur (vue passager)
    // -------------------------------------------------------------------------
    const fetchDriverInfo = useCallback(async () => {
        try {
            if (!ride?.userId) return;
            const driver = await UserService.getById(ride.userId);
            setDriverInfo(driver || null);
        } catch (e) {
            setDriverInfo(null);
        }
    }, [ride?.userId]);

    // -------------------------------------------------------------------------
    // On déclenche les fetchs selon la vue
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!ride) return;

        fetchLatestRideStatus();

        if (isDriver) {
            fetchRequests();
        } else {
            fetchDriverInfo();
        }
    }, [ride, isDriver, fetchLatestRideStatus, fetchRequests, fetchDriverInfo]);

    // -------------------------------------------------------------------------
    // Update route (AddressAutocomplete)
    // -------------------------------------------------------------------------
    const handleAddressSelect = useCallback((type, place) => {
        if (!place) return;

        if (type === 'pickup') {
            setPassengerRoute(prev => ({
                ...prev,
                pickupAddress: place.label,
                pickupLat: place.lat,
                pickupLon: place.lon
            }));
        }

        if (type === 'dropoff') {
            setPassengerRoute(prev => ({
                ...prev,
                dropoffAddress: place.label,
                dropoffLat: place.lat,
                dropoffLon: place.lon
            }));
        }
    }, []);

    // -------------------------------------------------------------------------
    // Update route (calcul de la carte)
    // -------------------------------------------------------------------------
    const handleRouteCalculated = useCallback((routeData) => {
        if (!routeData) return;

        const { totalDistance, totalDuration, legs } = routeData;

        setPassengerRoute(prev => {
            const nextDistance = (totalDistance / 1000).toFixed(1);
            const nextDuration = Math.round(totalDuration / 60);

            // Evite les re-render inutiles
            if (prev.distance === nextDistance && prev.duration === nextDuration) return prev;

            return {
                ...prev,
                distance: nextDistance,
                duration: nextDuration
            };
        });

        // Si itinéraire "détour" (4 waypoints => 3 legs) : start -> pickup -> dropoff -> end
        if (legs && legs.length >= 3) {
            const newDelay = Math.round(legs[0].duration / 60);
            const newDuration = Math.round(legs[1].duration / 60);

            setDelayPickup(prev => (prev !== newDelay ? newDelay : prev));
            setDurationPassenger(prev => (prev !== newDuration ? newDuration : prev));
        } else {
            setDelayPickup(prev => (prev !== 0 ? 0 : prev));
            setDurationPassenger(prev => {
                const newD = Math.round(totalDuration / 60);
                return prev !== newD ? newD : prev;
            });
        }
    }, []);

    return {
        realRideId,

        localRide,
        setLocalRide,
        currentRideStatus,
        setCurrentRideStatus,

        passengerRoute,
        setPassengerRoute,
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
    };
}
