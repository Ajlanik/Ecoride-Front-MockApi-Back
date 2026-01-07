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


    //-----------Ajout suite au backend java testable -----------//
    // Véhicule à afficher
    const displayCar = car || ride?.car;

    // log de debug
    console.group("&&&&&& [DEBUG-VIEW] RideDetailPopupDriverView");
    console.log("1. Status du trajet:", currentRideStatus);
    console.log("2. Liste 'requests' reçue:", requests);

    if (requests && requests.length > 0) {
        requests.forEach((req, index) => {
            console.log(`   - Request #${index} (ID: ${req.id}):`, req);
            console.log(`     -> passengerName:`, req.passengerName);
            console.log(`     -> passengerId (objet?):`, req.passengerId);
            console.log(`     -> status:`, req.status);
        });
    } else {
        console.log("!!!!!!!! La liste des requests est VIDE ou NULL");
    }
    console.groupEnd();
    // fin du log de debug

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
                        <Avatar src={displayCar?.picture} type="car" size="md" className="rounded-lg shadow-sm" />
                        <div className="overflow-hidden">
                            <p className="font-bold text-sm truncate">
                                {displayCar ? `${displayCar.brand} ${displayCar.model}` : "Non spécifié"}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">{displayCar?.licensePlate || "Plaque inconnue"}</p>
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
                        // Statut en majuscule pour uniformité
                        const status = (req.status || '').toUpperCase();

                        // Données passager
                        const passengerData = req.passengerId || {};

                        // Nom et avatar à afficher
                        const displayName = req.passengerName
                            || `${passengerData.firstName || ''} ${passengerData.lastName || ''}`.trim()
                            || 'Passager inconnu';

                        // Avatar à afficher
                        const displayAvatar = req.passengerAvatar || passengerData.avatar || passengerData.picture;

                        // Statut complété
                        const isCompleted = status === 'COMPLETED';
                        return (
                            <div
                                key={req.id}
                                onClick={() => setSelectedRequest(req)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRequest?.id === req.id ? 'bg-white border-purple-500 shadow-md ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:border-emerald-300'}`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            src={displayAvatar}
                                            alt={displayName}
                                            size="sm"
                                        />
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-800 text-sm">
                                                {displayName}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {req.seats} place(s) - Statut {status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* LOGIQUE NOTATION */}
                                    {currentRideStatus === 'completed' && (status === 'ACCEPTED' || status === 'COMPLETED') && (
                                        <Button
                                            className="btn-sm btn-outline"
                                            size="xs"
                                            disabled={req.hasRated}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onOpenRating(displayName, req.id, 'DRIVER');
                                            }}
                                        >
                                            {req.hasRated ? 'Noté ✓' : 'Noter'}
                                        </Button>
                                    )}
                                </div>

                                {/* BOUTONS D'ACTION (VISIBLE SI PENDING) */}
                                {status === 'PENDING' && (
                                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-50">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAction(req.id, 'ACCEPTED');
                                            }}
                                            className="flex-1 btn btn-xs btn-success text-white"
                                        >
                                            <CheckCircle className="w-3 h-3 mr-1 inline" /> Accepter
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onAction(req.id, 'REJECTED');
                                            }}
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