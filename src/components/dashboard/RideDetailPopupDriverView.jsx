// src/components/dashboard/RideDetailPopupDriverView.jsx
import React from 'react';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';

import { CheckCircle, Star, Info } from 'lucide-react';

const RideDetailPopupDriverView = ({
    ride,
    car,
    localRide,
    currentRideStatus,

    requests,
    requestsLoading,
    selectedRequest,
    setSelectedRequest,

    delayPickup,
    durationPassenger,
    addMinutesToTime,

    onFinishRide,
    onAction,
    onOpenRating,
}) => {
    // Places affichées
    const seatsAvailable = localRide?.seatsAvailable ?? ride.seatsAvailable;
    const seatsTotal = localRide?.seatsTotal ?? ride.seatsTotal;

    return (
        <div className="space-y-6">
            {currentRideStatus !== 'completed' && currentRideStatus !== 'COMPLETED' && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-emerald-900">Trajet en cours</p>
                        <p className="text-xs text-emerald-700">Cliquez une fois arrivé.</p>
                    </div>
                    <Button onClick={onFinishRide} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                        <CheckCircle className="w-4 h-4 mr-2" /> Terminer
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
                    <span className="text-3xl font-extrabold text-emerald-800 leading-none">{seatsAvailable}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">sur {seatsTotal}</span>
                </div>
            </div>

            {/* Itinéraire */}
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
                                        <p className="text-xs font-bold text-purple-600 uppercase">
                                            Pickup {selectedRequest.passengerName?.split(' ')[0]}
                                        </p>
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
                                        <p className="text-xs font-bold text-purple-600 uppercase">
                                            Dropoff {selectedRequest.passengerName?.split(' ')[0]}
                                        </p>
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
                                <Info className="w-4 h-4" />
                                Sélectionnez une demande pour voir le détour
                            </div>
                        </div>
                    )}

                    {/* Arrivée */}
                    <div className="relative flex gap-3 items-start">
                        <div className="w-3 h-3 mt-1.5 rounded-full bg-gray-800 ring-4 ring-white relative z-10"></div>
                        <div>
                            <p className="text-xs font-bold text-gray-500">
                                ARRIVÉE (~{addMinutesToTime(ride.departureTime, ride.duration + (selectedRequest ? 20 : 0))})
                            </p>
                            <p className="text-sm font-medium text-gray-800">{ride.arrivalPlace}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Liste Passagers */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase">
                    Passagers ({requestsLoading ? '...' : requests.length})
                </h4>

                <div className="space-y-3">
                    {requests.map(req => {
                        // Tolérance pour le statut
                        const status = (req.status || '').toUpperCase();
                        const isCompleted = status === 'COMPLETED';
                        
                        return (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'bg-white border-purple-500 shadow-md ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:border-emerald-300'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <Avatar src={req.passengerAvatar} size="sm" />
                                        <div>
                                            <p className="font-bold text-gray-800 text-sm">{req.passengerName}</p>
                                            <span className="text-xs text-gray-500">{req.status}</span>
                                        </div>
                                    </div>

                                    {/* LOGIQUE NOTATION CORRIGÉE */}
                                    {(currentRideStatus === 'completed' || currentRideStatus === 'COMPLETED') && (status === 'ACCEPTED' || status === 'COMPLETED') && (
                                        req.isPassengerRated ? (
                                            <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                <Star className="w-3 h-3 fill-current" /> Noté
                                            </span>
                                        ) : (
                                            <Button
                                                size="xs"
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    console.log("🔵 Click Noter passager :", req.passengerName);
                                                    onOpenRating(req.passengerName, req.id, 'PASSENGER');
                                                }}
                                            >
                                                Noter
                                            </Button>
                                        )
                                    )}
                                </div>

                                {status === 'PENDING' && (
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAction(req.id, 'ACCEPTED'); }}
                                            className="flex-1 btn btn-xs btn-success text-white"
                                        >
                                            Accepter
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onAction(req.id, 'REJECTED'); }}
                                            className="flex-1 btn btn-xs btn-ghost text-red-500 hover:bg-red-50"
                                        >
                                            Refuser
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RideDetailPopupDriverView;