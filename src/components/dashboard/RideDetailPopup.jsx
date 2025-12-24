import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookingService } from '../../services/bookingService';
import { RideService } from '../../services/rideService';
import { UserService } from '../../services/userService'; 
import { useToast } from '../../contexts/ToastContext';

import RideMap from '../ui/RideMap'; 
import Button from '../ui/Button';
import Popup from '../ui/Popup';
import AddressAutocomplete from '../ui/AddressAutocomplete'; 
import Avatar from '../ui/Avatar'; 
import StatusBadge from '../ui/StatusBadge';
import RatingPopup from './RatingPopup';
import { Clock, CheckCircle, Star, Info, MapPin } from 'lucide-react';

const RideDetailPopup = ({ ride, car, onClose, mode = 'view', onBook }) => {
    const { user } = useAuth();
    const { triggerToast } = useToast();
    
    // Vérification Conducteur
    const isDriver = user && ride && String(user.id) === String(ride.userId);

    // --- ÉTATS ---
    const [localRide, setLocalRide] = useState(ride);
    const [currentRideStatus, setCurrentRideStatus] = useState(ride.rideStatus || ride.status); 

    const [bookingLoading, setBookingLoading] = useState(false);
    const [passengerRoute, setPassengerRoute] = useState({}); 
    const [seatsToBook, setSeatsToBook] = useState(1); 
    const [delayPickup, setDelayPickup] = useState(0); 
    const [durationPassenger, setDurationPassenger] = useState(0); 
    
    const [requests, setRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [driverInfo, setDriverInfo] = useState(null);

    const [showRatingPopup, setShowRatingPopup] = useState(false);
    const [ratingTarget, setRatingTarget] = useState(null);

    // --- INITIALISATION ---
    useEffect(() => {
        if (ride) {
            setPassengerRoute({
                pickupAddress: ride.departurePlace,
                pickupLat: ride.startLat, pickupLon: ride.startLon,
                dropoffAddress: ride.arrivalPlace,
                dropoffLat: ride.endLat, dropoffLon: ride.endLon
            });

            if (isDriver) {
                fetchRequests();
            } else {
                fetchDriverInfo();
            }
            fetchLatestRideStatus();
        }
    }, [ride, isDriver]);

    const fetchLatestRideStatus = async () => {
        try {
            const realRideId = ride.carRideId || ride.id;
            const freshRide = await RideService.getById(realRideId);
            if (freshRide) {
                setCurrentRideStatus(freshRide.status);
            }
        } catch (e) { console.error(e); }
    };

    const fetchRequests = async () => {
        setRequestsLoading(true);
        const data = await BookingService.getByRideId(ride.id);
        setRequests(data);
        setRequestsLoading(false);
    };

    const fetchDriverInfo = async () => {
        try {
            if (ride.userId) {
                const driver = await UserService.getById(ride.userId);
                setDriverInfo(driver);
            }
        } catch (e) {}
    };

    const addMinutesToTime = (timeStr, minutesToAdd) => {
        if (!timeStr) return '--:--';
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins + Math.round(minutesToAdd));
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- ACTIONS ---

    const handleFinishRide = async () => {
        if(!window.confirm("Confirmer l'arrivée à destination et terminer le trajet ?")) return;
        try {
            await RideService.update(localRide.id, { status: 'completed' });
            setLocalRide(prev => ({ ...prev, status: 'completed' }));
            setCurrentRideStatus('completed');
            triggerToast("Trajet terminé avec succès !", "success");
        } catch (e) { triggerToast("Erreur", "error"); }
    };

    const handlePassengerFinish = async () => {
        if(!window.confirm("Confirmez-vous avoir terminé le trajet ?")) return;
        try {
            const idToComplete = ride.bookingId || ride.id; 
            await BookingService.completeBooking(idToComplete);
            setLocalRide(prev => ({ ...prev, status: 'COMPLETED' })); 
            triggerToast("Trajet validé. Vous pouvez noter le conducteur.", "success");
        } catch (e) { triggerToast("Erreur validation", "error"); }
    };

    const handleAction = async (bookingId, newStatus) => {
        try {
            await BookingService.updateStatus(bookingId, newStatus);
            triggerToast(newStatus === 'ACCEPTED' ? "Passager accepté" : "Statut mis à jour", "success");
            setRequests(prev => prev.map(r => r.id === bookingId ? { ...r, status: newStatus } : r));
            if (selectedRequest?.id === bookingId) setSelectedRequest(prev => ({ ...prev, status: newStatus }));
        } catch (e) { triggerToast("Erreur mise à jour", "error"); }
    };

    const openRating = (targetName, bookingId, role) => {
        setRatingTarget({ name: targetName, bookingId, role });
        setShowRatingPopup(true);
    };

    const handleRatingSubmit = async (reviewData) => {
        try {
            await BookingService.submitReview(ratingTarget.bookingId, ratingTarget.role, reviewData);
            triggerToast("Avis envoyé !", "success");
            setShowRatingPopup(false);
            if (isDriver) {
                setRequests(prev => prev.map(r => r.id === ratingTarget.bookingId ? { ...r, isPassengerRated: true } : r));
            } else {
                setLocalRide(prev => ({ ...prev, isDriverRated: true }));
            }
        } catch (e) { triggerToast("Erreur", "error"); }
    };

    const handleBookClick = async () => {
        setBookingLoading(true);
        if (onBook) await onBook(ride, passengerRoute, seatsToBook);
        setBookingLoading(false);
    };
    
    const handleAddressSelect = (type, place) => {
        if (type === 'pickup') {
            setPassengerRoute(prev => ({ ...prev, pickupAddress: place.address, pickupLat: place.lat, pickupLon: place.lng }));
        } else {
            setPassengerRoute(prev => ({ ...prev, dropoffAddress: place.address, dropoffLat: place.lat, dropoffLon: place.lng }));
        }
    };

    // Callback calculs
    const handleRouteCalculated = useCallback((routeData) => {
        const { totalDistance, totalDuration, legs } = routeData;
        setPassengerRoute(prev => {
            if (prev.distance === (totalDistance / 1000).toFixed(1)) return prev;
            return { ...prev, distance: (totalDistance / 1000).toFixed(1), duration: Math.round(totalDuration / 60) };
        });
        if (legs && legs.length >= 3) {
            const newDelay = Math.round(legs[0].duration / 60);
            const newDuration = Math.round(legs[1].duration / 60);
            setDelayPickup(prev => (prev !== newDelay ? newDelay : prev));
            setDurationPassenger(prev => (prev !== newDuration ? newDuration : prev));
        } else {
            setDelayPickup(prev => (prev !== 0 ? 0 : prev));
            setDurationPassenger(prev => { const newD = Math.round(totalDuration / 60); return prev !== newD ? newD : prev; });
        }
    }, []);

    // Mémos des coordonnées pour la carte 
    const mapStart = useMemo(() => ({ lat: ride.startLat, lng: ride.startLon }), [ride.startLat, ride.startLon]);
    const mapEnd = useMemo(() => ({ lat: ride.endLat, lng: ride.endLon }), [ride.endLat, ride.endLon]);
    const pStart = useMemo(() => {
        if (mode === 'book') return { lat: passengerRoute.pickupLat, lng: passengerRoute.pickupLon };
        if (isDriver && selectedRequest?.pickupLat) return { lat: selectedRequest.pickupLat, lng: selectedRequest.pickupLon };
        return null;
    }, [mode, isDriver, selectedRequest, passengerRoute]);
    const pEnd = useMemo(() => {
        if (mode === 'book') return { lat: passengerRoute.dropoffLat, lng: passengerRoute.dropoffLon };
        if (isDriver && selectedRequest?.dropoffLat) return { lat: selectedRequest.dropoffLat, lng: selectedRequest.dropoffLon };
        return null;
    }, [mode, isDriver, selectedRequest, passengerRoute]);

    if (!ride) return null;

    return (
        <>
            <Popup isOpen={true} onClose={onClose} maxWidth="max-w-5xl" padding={false}>
                <div className="flex flex-col md:flex-row w-full h-[90vh] md:h-[650px]">
                    {/* GAUCHE: CARTE */}
                    <div className="md:w-1/2 h-64 md:h-full bg-gray-200 relative border-b md:border-r border-gray-200 order-1 md:order-2">
                        <RideMap startCoords={mapStart} endCoords={mapEnd} passengerStart={pStart} passengerEnd={pEnd} readonly={true} onRouteCalculated={handleRouteCalculated} />
                        <div className="absolute top-4 left-4 z-[500] bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow-md border border-gray-100">
                             <p className="font-bold text-emerald-700">{isDriver ? "Vue Conducteur" : "Vue Passager"}</p>
                        </div>
                    </div>

                    {/* DROITE: INFO */}
                    <div className="md:w-1/2 flex flex-col bg-white order-2 md:order-1 overflow-hidden">
                        <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{ride.name || "Trajet EcoRide"}</h2>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(ride.departureDate).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <StatusBadge type={currentRideStatus === 'completed' || localRide.status === 'COMPLETED' ? 'neutral' : 'success'}>
                                    {localRide.status === 'COMPLETED' ? 'Terminé' : (currentRideStatus === 'completed' ? 'Arrivé' : (localRide.status || 'Planifié'))}
                                </StatusBadge>
                            </div>

                            {/* CONTENU DYNAMIQUE */}
                            {isDriver ? (
                                /* --- VUE CONDUCTEUR --- */
                                <div className="space-y-6">
                                    {currentRideStatus !== 'completed' && (
                                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-emerald-900">Trajet en cours</p>
                                                <p className="text-xs text-emerald-700">Cliquez une fois arrivé.</p>
                                            </div>
                                            <Button onClick={handleFinishRide} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                                                <CheckCircle className="w-4 h-4 mr-2"/> Terminer
                                            </Button>
                                        </div>
                                    )}

                                    {/* Infos Véhicule */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Véhicule</p>
                                            <div className="flex items-center gap-3">
                                                <Avatar src={car?.picture} type="car" size="md" className="rounded-lg shadow-sm" />
                                                <div className="overflow-hidden">
                                                    <p className="font-bold text-sm truncate">{car ? `${car.brand} ${car.model}` : "Non spécifié"}</p>
                                                    <p className="text-xs text-gray-500 font-mono mt-0.5">{car?.licensePlate}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col justify-center items-center text-center">
                                            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Places restantes</p>
                                            <span className="text-3xl font-extrabold text-emerald-800 leading-none">{ride.seatsAvailable}</span>
                                            <span className="text-[10px] text-emerald-600 font-medium">sur {ride.seatsTotal}</span>
                                        </div>
                                    </div>

                                    {/* TIMELINE CONDUCTEUR */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-4">Itinéraire Complet</p>
                                        <div className="relative pl-2 space-y-6">
                                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200"></div>

                                            {/* Départ */}
                                            <div className="relative flex gap-3 items-start">
                                                <div className="w-3 h-3 mt-1.5 rounded-full bg-emerald-500 ring-4 ring-white relative z-10"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-emerald-600">DÉPART ({ride.departureTime})</p>
                                                    <p className="text-sm font-medium text-gray-800">{ride.departurePlace}</p>
                                                </div>
                                            </div>

                                            {/* Détour Passager */}
                                            {selectedRequest ? (
                                                <div className="space-y-6 animate-fade-in">
                                                     <div className="relative flex gap-3 items-start">
                                                        <div className="w-3 h-3 mt-1.5 rounded-full bg-purple-500 ring-4 ring-white relative z-10"></div>
                                                        <div className="bg-purple-50 p-2 rounded-lg w-full border border-purple-100">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-xs font-bold text-purple-600 uppercase">Pickup {selectedRequest.passengerName?.split(' ')[0]}</p>
                                                                <p className="text-xs font-mono font-bold text-purple-700">
                                                                    ~{addMinutesToTime(ride.departureTime, delayPickup)}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-800">{selectedRequest.pickupAddress || "Lieu non spécifié"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="relative flex gap-3 items-start">
                                                        <div className="w-3 h-3 mt-1.5 rounded-full bg-purple-500 ring-4 ring-white relative z-10"></div>
                                                        <div className="bg-purple-50 p-2 rounded-lg w-full border border-purple-100">
                                                            <div className="flex justify-between items-center mb-1">
                                                                <p className="text-xs font-bold text-purple-600 uppercase">Dropoff {selectedRequest.passengerName?.split(' ')[0]}</p>
                                                                <p className="text-xs font-mono font-bold text-purple-700">
                                                                    ~{addMinutesToTime(ride.departureTime, delayPickup + durationPassenger)}
                                                                </p>
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-800">{selectedRequest.dropoffAddress || "Lieu non spécifié"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="relative flex gap-3 items-center pl-6 py-2">
                                                    <div className="flex items-center gap-2 text-gray-400 text-xs italic bg-gray-50 px-3 py-2 rounded-full w-full">
                                                        <Info className="w-4 h-4"/>
                                                        Sélectionnez une demande pour voir le détour
                                                    </div>
                                                </div>
                                            )}

                                            {/* Arrivée */}
                                            <div className="relative flex gap-3 items-start">
                                                <div className="w-3 h-3 mt-1.5 rounded-full bg-gray-800 ring-4 ring-white relative z-10"></div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-500">ARRIVÉE (~{addMinutesToTime(ride.departureTime, ride.duration + (selectedRequest ? 20 : 0))})</p>
                                                    <p className="text-sm font-medium text-gray-800">{ride.arrivalPlace}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Liste Passagers */}
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">Passagers ({requests.length})</h4>
                                        <div className="space-y-3">
                                            {requests.map(req => (
                                                <div key={req.id} onClick={() => setSelectedRequest(req)} className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'bg-white border-purple-500 shadow-md ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:border-emerald-300'}`}>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar src={req.passengerAvatar} size="sm" />
                                                            <div>
                                                                <p className="font-bold text-gray-800 text-sm">{req.passengerName}</p>
                                                                <span className="text-xs text-gray-500">{req.status}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* BOUTON NOTER (!!!!Si trajet fini) */}
                                                        {currentRideStatus === 'completed' && (req.status === 'ACCEPTED' || req.status === 'COMPLETED') && (
                                                            req.isPassengerRated ? (
                                                                <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Star className="w-3 h-3 fill-current"/> Noté</span>
                                                            ) : (
                                                                <Button size="xs" variant="secondary" onClick={(e) => { e.stopPropagation(); openRating(req.passengerName, req.id, 'driver'); }}>
                                                                    Noter
                                                                </Button>
                                                            )
                                                        )}
                                                    </div>

                                                    {/* Actions Accept/Refuse (!!!!!Si Pending) */}
                                                    {req.status === 'PENDING' && (
                                                        <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'ACCEPTED'); }} className="flex-1 btn btn-xs btn-success text-white">Accepter</button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(req.id, 'REJECTED'); }} className="flex-1 btn btn-xs btn-ghost text-red-500 hover:bg-red-50">Refuser</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* --- VUE PASSAGER --- */
                                <div className="space-y-6">
                                    <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={driverInfo?.picture} size="md" />
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase font-bold">Votre Conducteur</p>
                                                <p className="font-bold text-lg text-gray-800 leading-none">{driverInfo ? `${driverInfo.firstName}` : "..."}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                                            <Avatar src={car?.picture} type="car" size="md" />
                                            <div>
                                                <p className="font-bold text-sm text-gray-700">{car ? car.model : "?"}</p>
                                                <span className="text-xs text-gray-500 font-mono">{car ? car.licensePlate : "PLAQUE"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Actions Passager (!!!!!!!Si pas en mode recherche) */}
                                    {mode !== 'book' ? (
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            {currentRideStatus === 'completed' && localRide.status !== 'COMPLETED' && (
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-sm text-emerald-800 font-medium text-center">
                                                        Le conducteur a terminé le trajet. Tout s'est bien passé ?
                                                    </p>
                                                    <Button onClick={handlePassengerFinish} className="w-full bg-emerald-600 text-white">
                                                        <CheckCircle className="w-4 h-4 mr-2"/> Valider la fin du trajet
                                                    </Button>
                                                </div>
                                            )}

                                            {localRide.status === 'COMPLETED' && (
                                                <div className="text-center">
                                                    {localRide.isDriverRated ? (
                                                        <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-bold">Merci pour votre avis !</div>
                                                    ) : (
                                                        <Button onClick={() => openRating("le conducteur", ride.bookingId || ride.id, 'passenger')} variant="secondary" className="w-full">
                                                            <Star className="w-4 h-4 mr-2"/> Noter le conducteur
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {currentRideStatus !== 'completed' && localRide.status !== 'COMPLETED' && (
                                                <p className="text-xs text-center text-gray-400 italic">En attente de l'arrivée du conducteur...</p>
                                            )}
                                        </div>
                                    ) : (
                                        /* --- INPUTS PICKUP/DROPOFF  --- */
                                        <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 space-y-4">
                                            <h4 className="font-bold text-emerald-900 text-sm uppercase flex items-center gap-2">
                                                <MapPin className="w-4 h-4"/> Personnaliser mon trajet
                                            </h4>
                                            <AddressAutocomplete label="Où le conducteur doit-il vous prendre ?" initialValue={ride.departurePlace} onSelect={(p) => handleAddressSelect('pickup', p)} />
                                            <AddressAutocomplete label="Où voulez-vous descendre ?" initialValue={ride.arrivalPlace} onSelect={(p) => handleAddressSelect('dropoff', p)} />
                                            <div className="grid grid-cols-2 gap-4 pt-2">
                                                <div className="form-control">
                                                    <label className="label pt-0"><span className="label-text text-xs font-bold uppercase text-emerald-900">Passagers</span></label>
                                                    <input type="number" min="1" max={ride.seatsAvailable} value={seatsToBook} onChange={(e) => setSeatsToBook(Number(e.target.value))} className="input input-bordered w-full h-10"/>
                                                </div>
                                                <div className="flex flex-col justify-end pb-2">
                                                    <p className="text-right text-sm text-gray-500">Prix Total</p>
                                                    <p className="text-right text-xl font-bold text-emerald-700">{ride.price * seatsToBook} €</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline & Stats */}
                                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative mt-4">
                                        <div className="absolute left-[88px] top-6 bottom-6 w-0.5 bg-gray-300"></div>
                                        <div className="relative flex gap-4 mb-8 items-start">
                                            <div className="w-16 text-right shrink-0">
                                                <p className="text-lg font-black text-gray-800 leading-none">{addMinutesToTime(ride.departureTime, delayPickup)}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Pickup</p>
                                            </div>
                                            <div className="w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white shadow-sm mt-0.5 z-10 shrink-0"></div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">DÉPART</p>
                                                <p className="font-bold text-gray-800 leading-tight">{passengerRoute.pickupAddress || ride.departurePlace}</p>
                                            </div>
                                        </div>
                                        <div className="relative flex gap-4 items-start">
                                            <div className="w-16 text-right shrink-0">
                                                <p className="text-lg font-black text-gray-800 leading-none">{addMinutesToTime(ride.departureTime, delayPickup + durationPassenger)}</p>
                                                <p className="text-[10px] text-gray-400 font-medium">Arrivée</p>
                                            </div>
                                            <div className="w-4 h-4 rounded-full bg-gray-800 ring-4 ring-white shadow-sm mt-0.5 z-10 shrink-0"></div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase mb-0.5">ARRIVÉE</p>
                                                <p className="font-bold text-gray-800 leading-tight">{passengerRoute.dropoffAddress || ride.arrivalPlace}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats (Durée&Distance) */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                            <p className="text-xs text-blue-600 uppercase font-bold">Durée estimée</p>
                                            <p className="font-bold text-blue-900">{durationPassenger || ride.duration} min</p>
                                        </div>
                                        <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                            <p className="text-xs text-green-600 uppercase font-bold">Distance</p>
                                            <p className="font-bold text-green-900">{passengerRoute.distance || ride.distance} km</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <Button variant="ghost" onClick={onClose}>Fermer</Button>
                            {!isDriver && mode === 'book' && (
                                <Button variant="primary" onClick={handleBookClick} isLoading={bookingLoading} disabled={!passengerRoute.pickupLat || !passengerRoute.dropoffLat || seatsToBook > ride.seatsAvailable}>
                                    Confirmer ({ride.price * seatsToBook} €)
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </Popup>
            
            {showRatingPopup && <RatingPopup targetName={ratingTarget?.name} onClose={() => setShowRatingPopup(false)} onSubmit={handleRatingSubmit} />}
        </>
    );
};

export default RideDetailPopup;