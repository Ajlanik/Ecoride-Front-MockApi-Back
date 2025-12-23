// components/dashboard/RideDetailPopup.jsx
// Popup de détail d'un trajet.
// Layout corrigé pour éviter le chevauchement Carte / Texte.
// Gère maintenant aussi le mode "Réservation" pour les passagers.

import React, { useState } from 'react';
import RideMap from '../ui/RideMap'; 
import Button from '../ui/Button';
import Popup from '../ui/Popup';

/**
 * Composant Popup pour afficher les détails d'un trajet
 * @param {Object} ride - Les données du trajet
 * @param {Object} car - Les données de la voiture associée
 * @param {Function} onClose - Fonction pour fermer la popup
 * @param {string} mode - 'view' (défaut) ou 'book' (réservation)
 * @param {Function} onBook - Fonction appelée lors du clic sur "Réserver"
 */
const RideDetailPopup = ({ ride, car, onClose, mode = 'view', onBook }) => {
    const [bookingLoading, setBookingLoading] = useState(false);

    if (!ride) return null;

    // Fonction utilitaire pour formater la date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Date inconnue';
        return new Date(dateStr).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    };

    // Gestionnaire du clic sur le bouton réserver
    const handleBookClick = async () => {
        setBookingLoading(true);
        if (onBook) {
            await onBook(ride);
        }
        setBookingLoading(false);
    };

    return (
        // On désactive le padding par défaut pour gérer le layout nous-mêmes
        <Popup isOpen={true} onClose={onClose} maxWidth="max-w-2xl" padding={false}>
            
            {/* Conteneur Principal : Flex Vertical, Hauteur Max 85% de l'écran */}
            <div className="flex flex-col w-full h-[85vh]">
                
                {/* --- ZONE 1 : CARTE (FIXE EN HAUT) --- */}
                {/* shrink-0 est crucial : il interdit à la carte de s'écraser */}
                <div className="h-72 w-full shrink-0 bg-gray-200 relative border-b border-gray-200">
                    <RideMap 
                        startCoords={{ lat: ride.startLat, lng: ride.startLon }}
                        endCoords={{ lat: ride.endLat, lng: ride.endLon }}
                        readonly={true}
                    />
                    
                    {/* Badge Prix */}
                    <div className="absolute top-4 right-4 z-[500] bg-white px-3 py-1 rounded-lg shadow-md border border-gray-100">
                        <span className="font-bold text-emerald-700 text-lg">{ride.price} €</span>
                    </div>
                </div>

                {/* --- ZONE 2 : CONTENU (SCROLLABLE EN BAS) --- */}
                {/* flex-1 permet de prendre tout l'espace restant */}
                <div className="flex-1 overflow-y-auto bg-white p-6">
                    
                    {/* Titre */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="pr-4">
                            {/* Départ */}
                            <div className="mb-2">
                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Départ</span>
                                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                                    {ride.departurePlace}
                                </h2>
                            </div>
                            
                            {/* Flèche */}
                            <div className="text-gray-300 text-xl leading-none ml-1 my-1">↓</div>

                            {/* Arrivée */}
                            <div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Arrivée</span>
                                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                                    {ride.arrivalPlace}
                                </h2>
                            </div>
                        </div>

                        {/* Badge Statut */}
                        <div className="badge badge-success text-white font-bold shrink-0">
                            {ride.status || 'Planifié'}
                        </div>
                    </div>

                    <div className="divider my-4"></div>

                    {/* Infos Grille */}
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-8">
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase">Départ</p>
                            <p className="font-medium text-gray-800 capitalize">{formatDate(ride.departureDate)}</p>
                            <p className="text-sm text-gray-500">{ride.departureTime}</p>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase">Trajet</p>
                            <p className="font-medium text-gray-800">{ride.duration} min environ</p>
                            <p className="text-sm text-gray-500">{ride.seatsAvailable} places restantes</p>
                        </div>
                    </div>

                    {/* Bloc Véhicule */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 mb-6">
                        <div className="w-16 h-16 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                            {car && car.picture ? (
                                <img src={car.picture} alt="Voiture" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl">🚗</span>
                            )}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Véhicule</p>
                            <p className="font-bold text-gray-800">
                                {car ? `${car.brand} ${car.model}` : "Non spécifié"}
                            </p>
                            {ride.promoCode && (
                                <span className="text-xs text-yellow-600 font-bold mt-1 block">
                                    Promo: {ride.promoCode}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Note */}
                    {ride.description && (
                        <div className="mb-6">
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Note du conducteur</p>
                            <div className="bg-emerald-50 p-4 rounded-lg text-sm text-emerald-900 italic border border-emerald-100">
                                "{ride.description}"
                            </div>
                        </div>
                    )}

                    {/* Zone des Boutons */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
                        
                        <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:bg-gray-100">
                            Fermer
                        </Button>

                        {/* Si on est en mode réservation, on affiche le bouton Réserver */}
                        {mode === 'book' && (
                            <Button 
                                variant="primary" 
                                onClick={handleBookClick} 
                                isLoading={bookingLoading}
                                className="shadow-lg shadow-emerald-500/30"
                            >
                                Réserver ce trajet ({ride.price} €)
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </Popup>
    );
};

export default RideDetailPopup;