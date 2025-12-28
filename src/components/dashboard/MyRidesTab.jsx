import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RideService } from '../../services/rideService';
import { CarService } from '../../services/carService';
import { useToast } from '../../contexts/ToastContext';

// Composants UI
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import AddressAutocomplete from '../ui/AddressAutocomplete';
import RideMap from '../ui/RideMap';
import Popup from '../ui/Popup';
import RideDetailPopup from './RideDetailPopup';

import { PlusCircle, Calendar, Clock, CarFront, Navigation } from 'lucide-react';

const MyRidesTab = () => {
    const { user } = useAuth();
    const { triggerToast } = useToast();

    // --- ÉTATS ---
    const [rides, setRides] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [selectedRideDetail, setSelectedRideDetail] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // -------------------------------------------------------------------------
    // Formulaire : modèle Front officiel (camelCase)
    // -------------------------------------------------------------------------
    const initialFormState = {
        departurePlace: '',
        arrivalPlace: '',
        startLat: null,
        startLon: null,
        endLat: null,
        endLon: null,

        // Champ officiel du projet
        departureDate: '',
        departureTime: '',

        price: '',
        seatsTotal: 1,

        carId: '',
        description: '',
        promoCode: '',

        allowDetour: true,
        isRecurring: false,

        distance: 0,
        duration: 0,
        geometry: null
    };

    const [formData, setFormData] = useState(initialFormState);

    // --- CHARGEMENT ---
    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [myRides, myCars] = await Promise.all([
                RideService.getAll({ userId: user.id }),
                CarService.getAll({ userId: user.id })
            ]);

            // On inverse pour avoir les plus récents en haut
            setRides(myRides.reverse());
            setCars(myCars);
        } catch (error) {
            console.error(error);
            triggerToast("Erreur chargement données.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- GESTION FORMULAIRE ---
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddressSelect = (type, place) => {
        if (!place) return;

        setFormData(prev => ({
            ...prev,
            [type === 'start' ? 'departurePlace' : 'arrivalPlace']: place.address,
            [type === 'start' ? 'startLat' : 'endLat']: place.lat,
            [type === 'start' ? 'startLon' : 'endLon']: place.lng,
        }));
    };

    // Callback venant de RideMap (quand le trajet est calculé)
    const handleRouteCalculated = (routeData) => {
        if (!routeData) return;

        const totalTimeSeconds = Array.isArray(routeData.legs)
            ? routeData.legs.reduce((sum, leg) => sum + (leg.time || 0), 0)
            : 0;

        setFormData(prev => ({
            ...prev,
            distance: (routeData.totalDistance / 1000).toFixed(1), // m -> km
            duration: Math.round(totalTimeSeconds / 60), // s -> min
            geometry: routeData.geometry // JSON Array pour le backend
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation basique
        if (!formData.geometry) {
            triggerToast("Veuillez attendre le calcul de l'itinéraire sur la carte.", "warning");
            return;
        }
        if (!formData.carId) {
            triggerToast("Veuillez choisir un véhicule.", "warning");
            return;
        }

        setIsSubmitting(true);
        try {
            // -----------------------------------------------------------------
            // Création via le Service
            // IMPORTANT : on envoie le modèle Front (camelCase)
            // -----------------------------------------------------------------
            await RideService.create({
                ...formData,
                userId: user.id,

                // Types sûrs
                carId: String(formData.carId),
                seatsTotal: parseInt(formData.seatsTotal, 10),
                price: parseFloat(formData.price)
            });

            triggerToast("Trajet publié !", "success");
            setShowForm(false);
            setFormData(initialFormState); // Reset form
            loadData(); // Rafraîchir la liste
        } catch (error) {
            console.error(error);
            triggerToast("Erreur lors de la publication.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (rideId) => {
        if (window.confirm("Annuler ce trajet ?")) {
            try {
                await RideService.delete(rideId);
                setRides(prev => prev.filter(r => r.id !== rideId));
                triggerToast("Trajet annulé.", "info");
            } catch (error) {
                console.error(error);
                triggerToast("Erreur annulation.", "error");
            }
        }
    };

    if (loading) return <Loader text="Chargement de vos trajets..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* EN-TÊTE */}
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Navigation className="w-6 h-6 text-emerald-600" /> Mes Trajets
                    </h2>
                    <p className="text-sm text-gray-500">Gérez vos propositions de covoiturage.</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="btn-sm">
                    <PlusCircle className="w-4 h-4 mr-2" /> Publier
                </Button>
            </div>

            {/* LISTE */}
            {rides.length === 0 ? (
                <EmptyState
                    message="Vous n'avez aucun trajet actif."
                    actionLabel="Publier un trajet"
                    onAction={() => setShowForm(true)}
                />
            ) : (
                <div className="grid gap-4">
                    {rides.map(ride => {
                        const car = cars.find(c => c.id === ride.carId);
                        return (
                            <Card key={ride.id} className="flex flex-col md:flex-row justify-between items-center p-4 hover:shadow-md transition-shadow">
                                <div className="flex flex-col gap-2 w-full md:w-auto">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-lg text-gray-800">
                                            {ride.departurePlace} vers {ride.arrivalPlace}
                                        </span>
                                        <StatusBadge type={ride.status === 'completed' ? 'neutral' : 'success'}>
                                            {ride.status}
                                        </StatusBadge>
                                    </div>
                                    <div className="flex gap-4 text-sm text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" /> {new Date(ride.departureDate).toLocaleDateString()}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-4 h-4" /> {ride.departureTime}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <CarFront className="w-4 h-4" /> {car ? car.model : 'Voiture inconnue'}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                    <div className="text-right mr-4">
                                        <div className="font-bold text-xl text-emerald-600">{ride.price} €</div>
                                        <div className="text-xs text-gray-400">{ride.seatsAvailable} places dispo</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="secondary" className="btn-sm" onClick={() => setSelectedRideDetail(ride)}>
                                            Détails
                                        </Button>
                                        {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                                            <Button variant="danger" className="btn-sm btn-outline" onClick={() => handleDelete(ride.id)}>
                                                Annuler
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* POPUP DE CRÉATION */}
            <Popup isOpen={showForm} onClose={() => setShowForm(false)} title="Nouveau Trajet" maxWidth="max-w-5xl">
                <div className="flex flex-col lg:flex-row gap-6 p-1">
                    {/* Colonne Formulaire */}
                    <form onSubmit={handleSubmit} className="flex-1 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AddressAutocomplete label="Départ" onSelect={(p) => handleAddressSelect('start', p)} />
                            <AddressAutocomplete label="Arrivée" onSelect={(p) => handleAddressSelect('end', p)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input type="date" label="Date" name="departureDate" value={formData.departureDate} onChange={handleChange} required />
                            <Input type="time" label="Heure" name="departureTime" value={formData.departureTime} onChange={handleChange} required />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Input type="number" label="Prix (€)" name="price" value={formData.price} onChange={handleChange} required min="0" />
                            <div className="form-control">
                                <label className="label font-bold text-xs uppercase text-emerald-900">Places</label>
                                <select
                                    name="seatsTotal"
                                    className="select select-bordered w-full"
                                    value={formData.seatsTotal}
                                    onChange={handleChange}
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-control">
                            <label className="label font-bold text-xs uppercase text-emerald-900">Véhicule</label>
                            <select name="carId" className="select select-bordered w-full" value={formData.carId} onChange={handleChange} required>
                                <option value="">-- Sélectionner --</option>
                                {cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model} - {c.licensePlate}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-4">
                            <label className="label cursor-pointer justify-start gap-2">
                                <input type="checkbox" name="allowDetour" className="checkbox checkbox-success checkbox-sm" checked={formData.allowDetour} onChange={handleChange} />
                                <span className="label-text text-xs">Accepte détours</span>
                            </label>
                            <label className="label cursor-pointer justify-start gap-2">
                                <input type="checkbox" name="isRecurring" className="checkbox checkbox-success checkbox-sm" checked={formData.isRecurring} onChange={handleChange} />
                                <span className="label-text text-xs">Récurrent</span>
                            </label>
                        </div>

                        <Button type="submit" isLoading={isSubmitting} className="w-full mt-2" disabled={!formData.geometry}>
                            {formData.geometry ? `Publier (${formData.distance} km)` : "Calcul de l'itinéraire..."}
                        </Button>
                    </form>

                    {/* Colonne Carte */}
                    <div className="flex-1 h-64 lg:h-auto min-h-[300px] bg-gray-100 rounded-xl overflow-hidden border border-gray-200 relative">
                        <RideMap
                            startCoords={formData.startLat ? { lat: formData.startLat, lng: formData.startLon } : null}
                            endCoords={formData.endLat ? { lat: formData.endLat, lng: formData.endLon } : null}
                            onRouteCalculated={handleRouteCalculated}
                        />
                    </div>
                </div>
            </Popup>

            {/* Popup Détails Lecture Seule */}
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
