import React from 'react';
import RideMap from '../ui/RideMap'; 
import Button from '../ui/Button';
import Popup from '../ui/Popup'; // On utilise notre composant générique
import Avatar from '../ui/Avatar';

const RideDetailPopup = ({ ride, car, onClose }) => {
    if (!ride) return null;

    // Formatage des dates
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date inconnue';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    // Calcul heure arrivée
    const getArrivalTime = () => {
        if (!ride.departureTime || !ride.duration) return "--:--";
        const [hours, minutes] = ride.departureTime.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes + parseInt(ride.duration));
        return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };

    return (
        // Utilisation du composant Popup avec padding={false} pour la carte full-width
        <Popup isOpen={true} onClose={onClose} maxWidth="max-w-3xl" padding={false}>
            
            {/* --- 1. HEADER & CARTE --- */}
            <div className="relative h-72 w-full shrink-0 bg-gray-100">
                <RideMap 
                    startCoords={{ lat: ride.startLat, lng: ride.startLon }}
                    endCoords={{ lat: ride.endLat, lng: ride.endLon }}
                    readonly={true} 
                />
                
                {/* Bouton Fermer */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 btn btn-circle btn-sm bg-white text-black hover:bg-gray-100 border-none shadow-lg z-[1000]"
                >✕</button>
                
                {/* Badge Statut */}
                <div className="absolute top-4 left-4 z-[1000]">
                        <span className={`badge badge-lg font-bold shadow-md border-none ${ride.status === 'completed' ? 'bg-neutral text-white' : 'bg-[#6CF527] text-black'}`}>
                        {ride.status || 'PROGRAMMÉ'}
                    </span>
                </div>

                {/* Coordonnées discrètes */}
                <div className="absolute bottom-2 left-2 right-2 flex justify-between px-2 pointer-events-none z-[1000]">
                    <span className="text-[10px] font-mono text-gray-600 bg-white/80 px-2 rounded backdrop-blur">
                        Start: {ride.startLat?.toFixed(4)}, {ride.startLon?.toFixed(4)}
                    </span>
                    <span className="text-[10px] font-mono text-gray-600 bg-white/80 px-2 rounded backdrop-blur">
                        End: {ride.endLat?.toFixed(4)}, {ride.endLon?.toFixed(4)}
                    </span>
                </div>
            </div>

            {/* --- 2. CORPS DE LA FICHE --- */}
            <div className="p-8 space-y-8">
                
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-emerald-950 mb-1">{ride.name}</h2>
                        <p className="text-gray-500 text-sm flex items-center gap-2">
                            📅 {formatDate(ride.departureDate)}
                        </p>
                    </div>
                    <div className="text-right bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <div className="text-3xl font-extrabold text-[#6CF527] drop-shadow-sm leading-none">
                            {ride.price} €
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">par place</div>
                    </div>
                </div>

                <div className="divider my-0 opacity-50"></div>

                <div className="flex flex-col lg:flex-row gap-8">
                    
                    {/* A. TIMELINE */}
                    <div className="flex-1">
                        <ul className="steps steps-vertical w-full">
                            <li className="step step-primary w-full text-left">
                                <div className="text-left pl-3 pb-4">
                                    <p className="font-bold text-xl text-emerald-900">{ride.departureTime}</p>
                                    <p className="text-base font-semibold text-gray-700">{ride.departurePlace}</p>
                                </div>
                            </li>
                            <li className="step w-full" data-content="⏱️">
                                <div className="text-left pl-3 py-2 text-sm text-gray-500 italic font-medium">
                                    Durée : {ride.duration} min
                                </div>
                            </li>
                            <li className="step step-secondary w-full text-left">
                                <div className="text-left pl-3 pt-4">
                                    <p className="font-bold text-xl text-[#B027F5]">{getArrivalTime()}</p>
                                    <p className="text-base font-semibold text-gray-700">{ride.arrivalPlace}</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    {/* B. INFO & OPTIONS */}
                    <div className="flex-1 bg-gray-50 rounded-2xl p-6 h-fit border border-gray-100 space-y-6">
                        
                        {/* Véhicule avec Avatar */}
                        <div>
                            <h4 className="font-bold text-xs text-gray-400 uppercase mb-3 tracking-wide">Véhicule utilisé</h4>
                            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                <Avatar src={car?.picture} type="car" size="lg" />
                                <div className="flex-1 min-w-0">
                                    {car ? (
                                        <>
                                            <div className="font-bold text-emerald-950 truncate">{car.brand} {car.model}</div>
                                            <div className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded inline-block mt-1">
                                                {car.licensePlate}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="text-sm text-red-400 italic">Véhicule inconnu</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Places */}
                        <div>
                            <div className="flex justify-between items-end mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Places</span>
                                <span className="text-sm font-bold text-emerald-600">{ride.seatsAvailable} / {ride.seatsTotal} libres</span>
                            </div>
                            <progress 
                                className="progress progress-success w-full h-2" 
                                value={ride.seatsTotal - ride.seatsAvailable} 
                                max={ride.seatsTotal}
                            ></progress>
                        </div>

                        {/* Options */}
                        <div className="flex flex-wrap gap-2 pt-2">
                            <div className={`badge ${ride.allowDetour ? 'badge-success gap-1 text-white' : 'badge-ghost gap-1 text-gray-400'} p-3`}>
                                {ride.allowDetour ? '✅ Détour OK' : '🚫 Pas de détour'}
                            </div>
                            {ride.isRecurring && (
                                <div className="badge badge-info gap-1 text-white p-3">
                                    🔄 Récurrent
                                </div>
                            )}
                        </div>

                        {/* Code Promo */}
                        {ride.promoCode && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between">
                                <span className="text-xs text-yellow-700 font-bold uppercase">Promo</span>
                                <span className="font-mono font-bold text-yellow-800 tracking-widest">{ride.promoCode}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100 relative">
                    <span className="absolute -top-3 left-4 bg-white px-2 text-xs font-bold text-emerald-800 uppercase tracking-wide border border-emerald-100 rounded">
                        Note du conducteur
                    </span>
                    <p className="text-gray-700 text-sm leading-relaxed italic mt-1">
                        "{ride.description || "Aucune description fournie."}"
                    </p>
                </div>

                {/* Footer */}
                <div className="flex justify-end pt-2">
                    <Button variant="secondary" onClick={onClose} className="px-8">
                        Fermer
                    </Button>
                </div>

            </div>
        </Popup>
    );
};

export default RideDetailPopup;