import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { RideService } from '../services/rideService';
import { BookingService } from '../services/bookingService';
import { CarService } from '../services/carService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

// UI Components
import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StatusBadge from '../components/ui/StatusBadge';
import RideDetailPopup from '../components/dashboard/RideDetailPopup';
import { MapPin, Search, Euro, Calendar } from 'lucide-react';

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { triggerToast } = useToast();

    // Récupération des critères depuis l'URL
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    const date = searchParams.get('date') || '';

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    // États pour la popup de réservation
    const [selectedRide, setSelectedRide] = useState(null);
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                // On récupère TOUS les trajets
                const allRides = await RideService.getAll();

                // FILTRAGE CLIENT (Simulation pour que la démo marche sans backend complexe)
                const filtered = allRides.filter(ride => {
                    // Critères de base (Lieu départ / Arrivée)
                    const matchFrom = from ? ride.departurePlace.toLowerCase().includes(from.toLowerCase()) : true;
                    const matchTo = to ? ride.arrivalPlace.toLowerCase().includes(to.toLowerCase()) : true;
                    
                    // On filtre aussi pour ne pas montrer ses propres trajets à l'utilisateur connecté
                    const notMyRide = user ? ride.userId !== user.id : true;
                    
                    // On vérifie qu'il reste des places disponibles
                    const hasSeats = ride.seatsAvailable > 0;

                    return matchFrom && matchTo && notMyRide && hasSeats;
                });

                setResults(filtered);
            } catch (error) {
                console.error("Erreur recherche", error);
                triggerToast("Erreur lors de la recherche", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [from, to, date, user]); // On recharge si les critères ou l'user changent

    // --- GESTION DE L'OUVERTURE DE LA POPUP ---
    const openBookingPopup = async (ride) => {
        if (!user) {
            navigate('/login'); // Redirection si pas connecté
            return;
        }

        try {
            // On tente de récupérer les infos de la voiture pour l'affichage
            let carData = null;
            if (ride.carId) {
                carData = await CarService.getById(ride.carId);
            }
            
            setSelectedCar(carData);
            setSelectedRide(ride);
        } catch (e) {
            console.error("Erreur chargement voiture", e);
            setSelectedRide(ride); // On ouvre quand même la popup même sans voiture
        }
    };

    // --- GESTION DE LA RÉSERVATION ---
    const handleBookRide = async (ride) => {
        try {
            await BookingService.create({
                rideId: ride.id,
                passengerId: user.id,
                price: ride.price
            });

            triggerToast("Réservation confirmée ! Bon voyage 🌿", "success");
            setSelectedRide(null); // Ferme la popup
            navigate('/mybooking'); // Redirige vers la page des réservations

        } catch (error) {
            console.error("Erreur booking", error);
            triggerToast("Erreur lors de la réservation", "error");
        }
    };

    if (loading) return <MainLayout><Loader text="Recherche des meilleurs covoiturages..." /></MainLayout>;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                
                {/* En-tête de recherche */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-gray-100 pb-6 gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 mb-1">
                            <Search className="w-5 h-5" />
                            <span className="uppercase font-bold text-xs tracking-wider">Résultats</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white">
                            {from && to ? `${from} ➝ ${to}` : 'Tous les trajets disponibles'}
                        </h1>
                        {date && <p className="text-emerald-100 opacity-80 mt-1">Pour le {new Date(date).toLocaleDateString()}</p>}
                    </div>
                    
                    <Button variant="secondary" onClick={() => navigate('/')}>
                        Nouvelle recherche
                    </Button>
                </div>

                {/* Liste des résultats */}
                {results.length === 0 ? (
                    <EmptyState 
                        message={`Aucun covoiturage trouvé pour ${from} vers ${to}.`} 
                        actionLabel="Voir tous les trajets"
                        onAction={() => navigate('/search')} // Recharge sans filtre
                        icon={<MapPin className="w-10 h-10 text-gray-300" />}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((ride) => (
                            <Card key={ride.id} hoverable className="flex flex-col h-full border-t-4 border-t-emerald-500">
                                <div className="p-5 flex-1">
                                    {/* Header Carte : Prix & Places */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg font-bold">
                                            <Euro className="w-4 h-4" />
                                            <span>{ride.price}</span>
                                        </div>
                                        <StatusBadge type={ride.seatsAvailable > 0 ? 'success' : 'error'}>
                                            {ride.seatsAvailable} pl. restantes
                                        </StatusBadge>
                                    </div>

                                    {/* Itinéraire */}
                                    <div className="space-y-3 mb-6">
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center pt-1">
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                                                <div className="w-0.5 h-full bg-gray-200 min-h-[20px]"></div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-lg leading-none">{ride.departureTime}</p>
                                                <p className="text-sm text-gray-500 truncate w-48" title={ride.departurePlace}>{ride.departurePlace}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2.5 h-2.5 rounded-full bg-gray-400"></div>
                                            </div>
                                            <div>
                                                {/* Estimation arrivée si durée connue */}
                                                <p className="font-bold text-gray-400 text-lg leading-none">
                                                    {ride.duration ? `+${Math.floor(ride.duration/60)}h${ride.duration%60}` : '--:--'}
                                                </p> 
                                                <p className="text-sm text-gray-500 truncate w-48" title={ride.arrivalPlace}>{ride.arrivalPlace}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Infos Conducteur */}
                                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                                        <Avatar size="sm" /> 
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-700">Conducteur</span>
                                            <span className="text-xs text-yellow-500 flex items-center gap-1">★ 4.8</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bouton Action */}
                                <div className="p-4 bg-gray-50 rounded-b-[1.5rem] border-t border-gray-100">
                                    <Button 
                                        className="w-full btn-sm" 
                                        onClick={() => openBookingPopup(ride)}
                                    >
                                        Réserver
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* --- POPUP DE CONFIRMATION / DÉTAIL --- */}
                {selectedRide && (
                    <RideDetailPopup 
                        ride={selectedRide}
                        car={selectedCar}
                        mode="book" // On active le mode réservation
                        onClose={() => setSelectedRide(null)}
                        onBook={handleBookRide} // La fonction qui valide
                    />
                )}
            </div>
        </MainLayout>
    );
}