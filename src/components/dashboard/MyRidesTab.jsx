// components/dashboard/MyRidesTab.jsx
// Version CORRIGÉE pour stopper la boucle de re-render

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RideService } from '../../services/rideService';
import { CarService } from '../../services/carService';

// Composants UI
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import AddressAutocomplete from '../ui/AddressAutocomplete'; 
import RideMap from '../ui/RideMap'; 
import RideDetailPopup from './RideDetailPopup';

const MyRidesTab = () => {
    const { user } = useAuth();

    const [rides, setRides] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [selectedRideDetail, setSelectedRideDetail] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '', description: '', promoCode: '',
        departurePlace: '', arrivalPlace: '',
        dateStart: '', timeStart: '',
        seatsTotal: '3', price: '0',
        duration: '', 
        distance: '', 
        carId: '',
        startLat: null, startLon: null,
        endLat: null, endLon: null
    });

    // --- 1. STABILISATION DES COORDONNÉES (Fix Clignotement) ---
    // Ces objets ne seront recréés QUE si les chiffres changent vraiment.
    // Cela empêche la carte de se recharger quand on met à jour la durée.
    const startCoords = useMemo(() => {
        return formData.startLat ? { lat: formData.startLat, lng: formData.startLon } : null;
    }, [formData.startLat, formData.startLon]);

    const endCoords = useMemo(() => {
        return formData.endLat ? { lat: formData.endLat, lng: formData.endLon } : null;
    }, [formData.endLat, formData.endLon]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const userCars = await CarService.getAll({ userId: user.id });
                setCars(userCars);
                const defaultCar = userCars.find(c => c.isActive) || userCars[0];
                if (defaultCar) {
                    setFormData(prev => ({ ...prev, carId: defaultCar.id }));
                }
                const userRides = await RideService.getAll({ driverId: user.id });
                setRides(userRides);
            } catch (error) {
                console.error("Erreur chargement:", error);
            } finally {
                setLoading(false);
            }
        };
        if (user) loadData();
    }, [user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressSelect = (type, place) => {
        if (type === 'start') {
            setFormData(prev => ({
                ...prev,
                departurePlace: place.address,
                startLat: place.lat,
                startLon: place.lng 
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                arrivalPlace: place.address,
                endLat: place.lat,
                endLon: place.lng
            }));
        }
    };

    // --- 2. PROTECTION CONTRE LES MISES À JOUR INUTILES ---
    const handleRouteCalculated = useCallback(({ duration, distance }) => {
        const durationMin = Math.round(duration / 60);
        const distanceKm = (distance / 1000).toFixed(1);
        
        setFormData(prev => {
            // Si les valeurs sont déjà identiques, on ne touche à rien (Pas de re-render)
            if (prev.duration === durationMin && prev.distance === distanceKm) {
                return prev;
            }
            return { ...prev, duration: durationMin, distance: distanceKm };
        });
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validation souple : on accepte 0, mais pas vide
        if (formData.duration === '' || formData.duration === undefined) {
            alert("Veuillez attendre que l'itinéraire soit calculé sur la carte.");
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = { ...formData, driverId: user.id };
            const newRide = await RideService.create(payload);
            setRides([...rides, newRide]); 
            setShowForm(false);
            // Reset intelligent
            setFormData(prev => ({ 
                ...prev, 
                name: '', description: '', departurePlace: '', arrivalPlace: '', 
                duration: '', distance: '', 
                startLat: null, startLon: null, endLat: null, endLon: null // Reset coords aussi
            }));
        } catch (error) {
            alert("Erreur lors de la création du trajet");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Supprimer ce trajet ?")) {
            try {
                await RideService.delete(id);
                setRides(rides.filter(r => r.id !== id));
            } catch (error) {
                console.error("Erreur suppression", error);
            }
        }
    };

    if (loading) return <Loader text="Chargement de vos trajets..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Mes Trajets Publiés</h2>
                <Button onClick={() => setShowForm(true)} className="shadow-emerald-500/20">
                    + Nouveau Trajet
                </Button>
            </div>

            {rides.length === 0 && !showForm ? (
                <EmptyState 
                    message="Vous n'avez publié aucun trajet pour le moment." 
                    actionLabel="Publier un trajet" 
                    onAction={() => setShowForm(true)}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rides.map(ride => (
                        <Card key={ride.id} className="p-5 hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 flex flex-col justify-between">
                            <div className="flex justify-between items-start gap-3 w-full mb-3">
                                <div className="flex-1 min-w-0 space-y-2">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Départ</span>
                                        <span className="text-sm font-bold text-gray-800 truncate" title={ride.departurePlace}>
                                            {ride.departurePlace}
                                        </span>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Arrivée</span>
                                        <span className="text-sm font-bold text-gray-800 truncate" title={ride.arrivalPlace}>
                                            {ride.arrivalPlace}
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <StatusBadge type={ride.status === 'PLANNED' ? 'success' : 'neutral'}>
                                        {ride.status || 'PLANNED'}
                                    </StatusBadge>
                                </div>
                            </div>

                            <div className="space-y-3 pt-2 border-t border-gray-50 mt-auto">
                                <div className="text-sm text-gray-500 font-medium">
                                    📅 {new Date(ride.departureDate).toLocaleDateString()} • 🕒 {ride.departureTime}
                                </div>
                                <div className="flex gap-2 text-sm font-medium">
                                    <span className="text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                        {ride.price} € /pers
                                    </span>
                                    <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                        {ride.seatsAvailable}/{ride.seatsTotal} places
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-3 justify-end pt-4 mt-2">
                                <Button variant="secondary" className="btn-sm border border-gray-200" onClick={() => setSelectedRideDetail(ride)}>
                                    Détails
                                </Button>
                                <Button variant="danger" className="btn-sm" onClick={() => handleDelete(ride.id)}>
                                    Annuler
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col md:flex-row overflow-hidden">
                        
                        {/* Colonne Gauche */}
                        <div className="w-full md:w-1/2 p-6 md:p-8 space-y-4 overflow-y-auto custom-scrollbar">
                            <h3 className="text-2xl font-bold text-emerald-900 mb-6 sticky top-0 bg-white z-10 py-2">Proposer un trajet</h3>
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input label="Nom du trajet (ex: Retour Weekend)" name="name" value={formData.name} onChange={handleInputChange} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="form-control w-full">
                                        <label className="label pt-0 pb-1"><span className="label-text font-bold text-xs uppercase text-emerald-900">Véhicule</span></label>
                                        <select name="carId" value={formData.carId} onChange={handleInputChange} className="select select-bordered w-full bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
                                            <option value="" disabled>Choisir...</option>
                                            {cars.map(c => (<option key={c.id} value={c.id}>{c.brand} {c.model}</option>))}
                                        </select>
                                    </div>
                                    <Input label="Prix (€)" name="price" type="number" value={formData.price} onChange={handleInputChange} required />
                                </div>
                                <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <AddressAutocomplete label="Départ" placeholder="Ville, Rue..." onSelect={(p) => handleAddressSelect('start', p)} required />
                                    <AddressAutocomplete label="Arrivée" placeholder="Ville, Rue..." onSelect={(p) => handleAddressSelect('end', p)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Date" name="departureDate" type="date" value={formData.departureDate} onChange={handleInputChange} required />
                                    <Input label="Heure" name="departureTime" type="time" value={formData.departureTime} onChange={handleInputChange} required />
                                </div>
                                <div className="form-control">
                                     <Input label="Places disponibles" name="seatsTotal" type="number" value={formData.seatsTotal} onChange={handleInputChange} required />
                                </div>
                                {formData.duration && (
                                    <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl text-center border border-emerald-100 flex flex-col items-center animate-fade-in">
                                        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">Temps estimé</span>
                                        <span className="text-lg font-bold">{Math.floor(formData.duration / 60)}h {formData.duration % 60}min</span>
                                    </div>
                                )}
                                <div className="form-control">
                                    <label className="label pt-0 pb-1 justify-start">
                                        <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Note pour les passagers</span>
                                    </label>
                                    <textarea name="description" value={formData.description} onChange={handleInputChange} className="textarea textarea-bordered h-24 bg-white text-gray-900 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" placeholder="Ex: Je ne fume pas, petits bagages uniquement..."></textarea>
                                </div>
                                <div className="flex gap-3 pt-4 pb-8">
                                    <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>Annuler</Button>
                                    <Button type="submit" variant="primary" className="flex-1" isLoading={isSubmitting}>Publier</Button>
                                </div>
                            </form>
                        </div>

                        {/* Colonne Droite : Carte */}
                        <div className="hidden md:block w-1/2 bg-gray-100 relative h-full">
                             <div className="absolute inset-0 p-4">
                                <div className="w-full h-full rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                                     {/* On passe les objets startCoords/endCoords mémorisés ! */}
                                     <RideMap 
                                        startCoords={startCoords}
                                        endCoords={endCoords}
                                        readonly={true}
                                        onRouteCalculated={handleRouteCalculated}
                                     />
                                </div>
                             </div>
                             <div className="absolute top-8 left-8 bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg border border-gray-100 z-[1000]">
                                <h4 className="font-bold text-gray-800 text-sm">Aperçu de l'itinéraire</h4>
                                <p className="text-xs text-gray-500">Le tracé se met à jour automatiquement</p>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedRideDetail && (
                <RideDetailPopup 
                    ride={selectedRideDetail}
                    car={cars.find(c => c.id === selectedRideDetail.carId)}
                    onClose={() => setSelectedRideDetail(null)}
                />
            )}
        </div>
    );
};

export default MyRidesTab;