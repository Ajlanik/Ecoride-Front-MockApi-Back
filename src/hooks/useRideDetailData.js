// src/hooks/useRideDetailData.js
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BookingService } from '../services/bookingService';
import { RideService } from '../services/rideService';
import { UserService } from '../services/userService';


export default function useRideDetailData({ ride, isDriver, mode }) {
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

    useEffect(() => {
        if (!ride) return;
        setLocalRide(ride);
        setCurrentRideStatus(ride?.rideStatus || ride?.status);

        const fromBookingDetour = ride?.passengerRoute;

        if (mode !== 'book' && fromBookingDetour?.pickupAddress) {
            setPassengerRoute(fromBookingDetour);
            const safeDelay = Number(fromBookingDetour.delayPickup);
            const safeDurationPassenger = Number(fromBookingDetour.durationPassenger);

            setDelayPickup(prev => (Number.isFinite(safeDelay) && prev !== safeDelay ? safeDelay : prev));
            setDurationPassenger(prev => (
                Number.isFinite(safeDurationPassenger)
                    ? (prev !== safeDurationPassenger ? safeDurationPassenger : prev)
                    : prev
            ));
        } else {
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
        setSelectedRequest(null);
    }, [ride, mode]);

    const fetchLatestRideStatus = useCallback(async () => {
        try {
            if (!realRideId) return;
            const freshRide = await RideService.getById(realRideId);
            if (freshRide) setCurrentRideStatus(freshRide.status);
        } catch (e) { console.error(e); }
    }, [realRideId]);

    const fetchRequests = useCallback(async () => {
        try {
            if (!realRideId) return;
            setRequestsLoading(true);
            const data = await BookingService.getByRideId(realRideId);
// --- ENRICHISSEMENT : On récupère les infos (photo/nom) de chaque passager ---
            const enrichedRequests = await Promise.all(data.map(async (req) => {
                if (req.userId) {
                    try {
                        const passenger = await UserService.getById(req.userId);
                        return { 
                            ...req, 
                            passengerAvatar: passenger.picture, // La photo du passager
                            passengerName: `${passenger.firstName} ${passenger.lastName}` // Nom complet
                        };
                    } catch (err) {
                        console.warn("Impossible de charger le passager", err);
                        return req;
                    }
                }
                return req;
            }));

            setRequests(enrichedRequests);
        } catch (e) {
            console.error("Erreur fetch requests", e);
            setRequests([]);
        } finally {
            setRequestsLoading(false);
        }
    }, [realRideId]);
    const fetchDriverInfo = useCallback(async () => {
        try {
            if (!ride?.userId) return;
            const driver = await UserService.getById(ride.userId);
            setDriverInfo(driver || null);
        } catch (e) { setDriverInfo(null); }
    }, [ride?.userId]);


    // Test pour limiter la lenteurs :
    // CORRECTION : On vérifie l'ID (realRideId) au lieu de l'objet entier (ride)
    useEffect(() => {
        if (!realRideId) return;

        fetchLatestRideStatus();
        if (isDriver) fetchRequests();
        else fetchDriverInfo();

        // DÉPENDANCES : On remplace 'ride' par 'realRideId' pour stopper la boucle
    }, [realRideId, isDriver, fetchLatestRideStatus, fetchRequests, fetchDriverInfo]);

    /*
    useEffect(() => {
        if (!ride) return;
        fetchLatestRideStatus();
        if (isDriver) fetchRequests();
        else fetchDriverInfo();
    }, [ride, isDriver, fetchLatestRideStatus, fetchRequests, fetchDriverInfo]);
*/
    // --- CORRECTION CRITIQUE ICI ---
    const handleAddressSelect = useCallback((type, place) => {
        if (!place) return;

        // On cherche la longitude partout (lon, lng, longitude)
        const lon = place.lon || place.lng || place.longitude;
        const lat = place.lat || place.latitude;
        const address = place.label || place.address || place.display_name;

        if (type === 'pickup') {
            setPassengerRoute(prev => ({
                ...prev,
                pickupAddress: address,
                pickupLat: lat,
                pickupLon: lon // On stocke la valeur trouvée
            }));
        }

        if (type === 'dropoff') {
            setPassengerRoute(prev => ({
                ...prev,
                dropoffAddress: address,
                dropoffLat: lat,
                dropoffLon: lon // On stocke la valeur trouvée
            }));
        }
    }, []);

    const handleRouteCalculated = useCallback((routeData) => {
        if (!routeData) return;
        const { totalDistance, totalDuration, legs } = routeData;

        setPassengerRoute(prev => {
            const nextDistance = (totalDistance / 1000).toFixed(1);
            const nextDuration = Math.round(totalDuration / 60);
            if (prev.distance === nextDistance && prev.duration === nextDuration) return prev;
            return { ...prev, distance: nextDistance, duration: nextDuration };
        });

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
        realRideId, localRide, setLocalRide,
        currentRideStatus, setCurrentRideStatus,
        passengerRoute, setPassengerRoute,
        delayPickup, durationPassenger,
        requests, setRequests, requestsLoading,
        selectedRequest, setSelectedRequest,
        driverInfo,
        fetchLatestRideStatus, handleAddressSelect, handleRouteCalculated,
    };
}