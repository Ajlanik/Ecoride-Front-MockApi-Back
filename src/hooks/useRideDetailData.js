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

    // Stock la durée totale recalculée par la carte
    const [estimatedTotalDuration, setEstimatedTotalDuration] = useState(0);

    const [requests, setRequests] = useState(ride?.bookingList || []);
    const [requestsLoading, setRequestsLoading] = useState(false);

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);
    useEffect(() => {
        if (ride?.bookingList && ride.bookingList.length > 0) {
            setRequests(ride.bookingList);
        }
    }, [ride]);
    // --- INITIALISATION ---
    useEffect(() => {
        if (!ride) return;
        setLocalRide(ride);
        setCurrentRideStatus(ride?.rideStatus || ride?.status);

        // Récupération de l'itinéraire passager (props ou detour)
        const fromBookingDetour = ride?.passengerRoute || ride?.detour;

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
            // Réservation (Book) ou pas de détour
            setDelayPickup(0);
            setDurationPassenger(0);

            // On vérifie que les coordonnées du ride sont valides avant de les donner comme point de départ par défaut
            const validStartLat = (ride.startLat && Math.abs(ride.startLat) > 0.1) ? ride.startLat : null;
            const validStartLon = (ride.startLon && Math.abs(ride.startLon) > 0.1) ? ride.startLon : null;
            const validEndLat = (ride.endLat && Math.abs(ride.endLat) > 0.1) ? ride.endLat : null;
            const validEndLon = (ride.endLon && Math.abs(ride.endLon) > 0.1) ? ride.endLon : null;

            setPassengerRoute({
                pickupAddress: ride.departurePlace,
                pickupLat: validStartLat, // Utilise null si invalide
                pickupLon: validStartLon,

                dropoffAddress: ride.arrivalPlace,
                dropoffLat: validEndLat,
                dropoffLon: validEndLon,

                distance: 0,
                duration: 0
            });
        }
        setSelectedRequest(null);
        setEstimatedTotalDuration(0); // Reset estimated duration
    }, [ride, mode]);

    // --- FETCH DATA  ---
    // Fonction pour récupérer le statut le plus récent du trajet
    const fetchLatestRideStatus = useCallback(async () => {
        try {
            if (!realRideId) return;

            const freshRide = await RideService.getById(realRideId);

            if (freshRide) {
                setCurrentRideStatus(freshRide.status);

                setLocalRide(prev => {
                    return {
                        ...freshRide,
                        ...(ride || {}),

                        driver: freshRide.driver,
                        car: freshRide.car,
                        geometry: freshRide.geometry,

                        id: realRideId,

                        passengerRoute: ride?.passengerRoute || freshRide.passengerRoute
                    };
                });
            }
        } catch (e) { console.error(e); }
    }, [realRideId, ride]);

    // --- FETCH REQUESTS ---
    // Pour le conducteur : récupérer la liste des demandes de réservation
    // avec enrichissement des infos passager
    // (avatar, nom) à partir de l'ID utilisateur
    // Utilisé dans le useEffect principal plus bas 
    // après définition de isDriver 
    // pour éviter les fetch inutiles 
    // quand on est passager. 
    // Dépend de realRideId
    // et met à jour le state requests
    const fetchRequests = useCallback(async () => {
        try {
            if (!realRideId) return;
            setRequestsLoading(true);
            const data = await BookingService.getByRideId(realRideId);

            const enrichedRequests = await Promise.all(data.map(async (req) => {
                if (req.userId) {
                    try {
                        const passenger = await UserService.getById(req.userId);
                        return {
                            ...req,
                            passengerAvatar: passenger.picture,
                            passengerName: `${passenger.firstName} ${passenger.lastName}`
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

    useEffect(() => {
        if (!realRideId) return;

        fetchLatestRideStatus();
        if (isDriver) fetchRequests();
        else fetchDriverInfo();

    }, [realRideId, isDriver, fetchLatestRideStatus, fetchRequests, fetchDriverInfo]);

    // --- HANDLE ADDRESS  ---
    // Quand l'utilisateur sélectionne une adresse dans le composant de recherche d'adresse 
    // on met à jour le state passengerRoute en conséquence
    // Utilisé dans RideDetailPopupPassengerView.jsx 
    // et dans le processus de réservation (Mode 'book') 
    // pour définir les adresses de prise en charge et de dépôt 
    // choisies par le passager 
    // ainsi que leurs coordonnées GPS associées 
    // (lon, lat) 
    // via le callback handleAddressSelect 
    // passé aux composants enfants 
    // qui gèrent la sélection d'adresse.
    // On utilise useCallback pour éviter les recréations inutiles
    // du callback à chaque rendu.

    const handleAddressSelect = useCallback((type, place) => {
        if (!place) return;

        const lon = place.lon || place.lng || place.longitude;
        const lat = place.lat || place.latitude;
        const address = place.label || place.address || place.display_name;

        if (type === 'pickup') {
            setPassengerRoute(prev => ({
                ...prev,
                pickupAddress: address,
                pickupLat: lat,
                pickupLon: lon
            }));
        }

        if (type === 'dropoff') {
            setPassengerRoute(prev => ({
                ...prev,
                dropoffAddress: address,
                dropoffLat: lat,
                dropoffLon: lon
            }));
        }
    }, []);

    // --- CALCUL ROUTE  ---
    // Quand l'itinéraire est calculé (via une API de routage)
    // on met à jour les états liés à la distance et durée
    // Utilisé dans RideDetailPopupPassengerView.jsx
    // via le callback handleRouteCalculated
    // passé au composant MapWithRoute
    // On utilise useCallback pour éviter les recréations inutiles
    // du callback à chaque rendu.
    const handleRouteCalculated = useCallback((routeData) => {
        if (!routeData) return;
        const { totalDistance, totalDuration, legs } = routeData;

        // LOG DEBUG
        console.group("àààààààààààà [Hook] Calcul Itinéraire");
        console.log("Legs détectés :", legs?.length);
        console.log("Distance Carte Totale :", (totalDistance / 1000).toFixed(1));

        // On stocke la durée totale réelle calculée (en minutes)
        setEstimatedTotalDuration(Math.round(totalDuration / 60));

        // Cas A : Détour complet (3 tronçons) -> C'est un calcul Passager précis
        if (legs && legs.length >= 3) {
            const legDelay = legs[0];
            const legPassenger = legs[1]; // Le tronçon passager

            const newDelay = Math.round(legDelay.duration / 60);
            const newDuration = Math.round(legPassenger.duration / 60);
            const newDistance = (legPassenger.distance / 1000).toFixed(1);

            console.log("VVVVVVVVVVVVV Mode PASSAGER activé : Dist=", newDistance, "Durée=", newDuration, "Délai=", newDelay);

            setDelayPickup(prev => (prev !== newDelay ? newDelay : prev));
            setDurationPassenger(prev => (prev !== newDuration ? newDuration : prev));

            // On force la mise à jour car c'est un calcul précis pour le passager
            setPassengerRoute(prev => ({
                ...prev,
                distance: newDistance,
                duration: newDuration
            }));
        }
        // Cas B : Trajet simple ou vue globale
        else {
            console.log("!!!!!!!!!!!!!!!! Mode GLOBAL/SIMPLE");

            // Gestion des délais
            setDelayPickup(prev => (prev !== 0 ? 0 : prev));
            setDurationPassenger(prev => {
                const newD = Math.round(totalDuration / 60);
                return prev !== newD ? newD : prev;
            });

            // GESTION INTELLIGENTE DE LA DISTANCE
            setPassengerRoute(prev => {
                // Si on a déjà une distance venant de la DB et qu'on n'est pas en train de réserver, on garde la DB.
                if (mode !== 'book' && prev.distance && parseFloat(prev.distance) > 0) {
                    console.log("   -> On conserve la distance DB :", prev.distance);
                    return prev;
                }

                // Sinon (mode book ou conducteur), on prend la distance totale
                const nextDistance = (totalDistance / 1000).toFixed(1);
                const nextDuration = Math.round(totalDuration / 60);

                if (prev.distance === nextDistance && prev.duration === nextDuration) return prev;
                return { ...prev, distance: nextDistance, duration: nextDuration };
            });
        }
        console.groupEnd();
    }, [mode]); // Ajout de 'mode' dans les dépendances pour la protection

    return {
        realRideId, localRide, setLocalRide,
        currentRideStatus, setCurrentRideStatus,
        passengerRoute, setPassengerRoute,
        delayPickup, durationPassenger,

        estimatedTotalDuration, //  On expose cette variable

        requests, setRequests, requestsLoading,
        selectedRequest, setSelectedRequest,
        driverInfo,
        fetchLatestRideStatus, handleAddressSelect, handleRouteCalculated,
    };
}