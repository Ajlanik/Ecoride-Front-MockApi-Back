// EcorideAKNProd/EcorideAKNProd/src/pages/SearchResults.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { RideService } from '../services/rideService';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

import Card from '../components/ui/Card';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import RideDetailPopup from '../components/dashboard/RideDetailPopup';
import { CalendarSync, MapPin, Search, Filter, Star } from 'lucide-react';

export default function SearchResults() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { triggerToast } = useToast();

    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedRide, setSelectedRide] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(false);
            try {
                const filters = {
                    departurePlace: searchParams.get('from'),
                    arrivalPlace: searchParams.get('to'),
                    departureDate: searchParams.get('date'),
                };
                const rides = await RideService.search(filters);
                setResults(rides);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, [searchParams]);

    const openBookingPopup = (ride) => {
        if (!user) {
            triggerToast("Connectez-vous pour réserver.", "info");
            navigate('/login');
            return;
        }
        setSelectedRide(ride);
    };

    const fromLabel = searchParams.get('from') || "Partout";
    const toLabel = searchParams.get('to') || "Partout";
    const dateLabel = searchParams.get('date') || null;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in min-h-[80vh]">
                <div className="bg-emerald-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <Search className="w-6 h-6" /> Résultats de recherche
                        </h1>
                        <div className="flex flex-wrap gap-3 items-center text-sm font-medium text-emerald-100 bg-white/10 p-3 rounded-xl backdrop-blur-sm inline-flex">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-emerald-400" />
                                <span className="truncate max-w-[16rem]">{fromLabel}</span>
                                <span className="text-emerald-200">vers</span>
                                <span className="truncate max-w-[16rem]">{toLabel}</span>
                            </div>
                            {dateLabel && (<div className="text-emerald-100">• {dateLabel}</div>)}
                        </div>
                    </div>
                </div>

                {loading ? <Loader text="Recherche des trajets..." /> : 
                 error ? <EmptyState message="Erreur serveur." onAction={() => window.location.reload()} actionLabel="Réessayer" /> : 
                 results.length === 0 ? <EmptyState message="Aucun trajet trouvé." icon={<Filter className="w-10 h-10 text-gray-300" />} /> : 
                 (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map(ride => (
                            <Card key={ride.id} className="flex flex-col justify-between hover:shadow-lg transition-shadow border-emerald-100/50">
                                <div className="p-5">
                                    <p className="text-xs font-bold text-emerald-600 uppercase mb-2 tracking-wider flex items-center gap-2">
                                        {new Date(ride.departureDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </p>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar src={ride.driver?.picture} size="sm" />
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{ride.driver?.firstName}</p>
                                                <div className="flex items-center text-xs text-yellow-500 font-bold gap-1">
                                                    <Star className="w-3 h-3 fill-current" />
                                                    <span>4.8</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xl font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">{ride.price} €</div>
                                    </div>
                                    <div className="flex flex-col gap-1 pl-2 border-l-2 border-gray-100 relative my-4 ml-2">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 -ml-[5px] ring-4 ring-white"></div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-400">{ride.departureTime}
                                                    {ride.isRecurring && <span className="badge badge-sm badge-outline text-emerald-600 gap-1 ml-2"><CalendarSync className="w-3 h-3" /> Récurrent</span>}
                                                </p>
                                                <p className="font-bold text-gray-700 truncate">{ride.departurePlace}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="w-2 h-2 rounded-full bg-gray-800 -ml-[5px] ring-4 ring-white"></div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-gray-400">~ Arrivée estimée</p>
                                                <p className="font-bold text-gray-700 truncate">{ride.arrivalPlace}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto">
                                    <Button className="w-full btn-sm" onClick={() => openBookingPopup(ride)}>Réserver</Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
                {selectedRide && <RideDetailPopup ride={selectedRide} mode="book" onClose={() => setSelectedRide(null)} />}
            </div>
        </MainLayout>
    );
}