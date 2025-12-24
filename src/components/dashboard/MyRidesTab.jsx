// src/components/dashboard/MyRidesTab.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { RideService } from '../../services/rideService';
import { CarService } from '../../services/carService';
import { useToast } from '../../contexts/ToastContext';

// Composants UI (Design System)
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import StatusBadge from '../ui/StatusBadge';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import AddressAutocomplete from '../ui/AddressAutocomplete';
import RideMap from '../ui/RideMap';
import RideDetailPopup from './RideDetailPopup';
import { MapPin, Calendar, Clock, CarFront, Navigation } from 'lucide-react';

const MyRidesTab = () => {
    const { user } = useAuth();
    const { triggerToast } = useToast();

    // --- ÉTATS  ---
    const [rides, setRides] = useState([]);
    const [cars, setCars] = useState([]); // Liste des voitures pour le sélecteur
    const [loading, setLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [selectedRideDetail, setSelectedRideDetail] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // État du formulaire de création
    const [formData, setFormData] = useState({
        name: '', description: '', promoCode: '',
        departurePlace: '', arrivalPlace: '',
        dateStart: '', timeStart: '', // Champs séparés pour l'interface (Date / Heure)
        seats: 1, price: 0,
        startLat: null, startLon: null, endLat: null, endLon: null,
        distance: null, duration: null, geometry: null,
        allowDetour: true, isRecurring: false,
        carId: ''
    });

    // --- CHARGEMENT INITIAL ---
    useEffect(() => {
        const loadData = async () => {
            if (user) {
                try {
                    // On charge les voitures du conducteur pour le menu déroulant
                    const myCars = await CarService.getAll({ userId: user.id });
                    setCars(myCars);

                    // On charge ses trajets existants
                    const myRides = await RideService.getAll({ driverId: user.id });
                    setRides(myRides.reverse()); // Plus récents en haut
                } catch (error) {
                    console.error("Erreur chargement", error);
                    triggerToast("Impossible de charger vos données.", "error");
                } finally {
                    setLoading(false);
                }
            }
        };
        loadData();
    }, [user]);

    // --- GESTION DU FORMULAIRE ---

    // Met à jour les champs simples (texte, nombre)
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // Callback quand une adresse est sélectionnée via l'autocomplétion
    // On met à jour l'adresse textuelle ET les coordonnées GPS
    const handleAddressSelect = (type, place) => {
        if (type === 'start') {
            setFormData(prev => ({
                ...prev,
                departurePlace: place.address,
                startLat: parseFloat(place.lat),
                startLon: parseFloat(place.lng)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                arrivalPlace: place.address,
                endLat: parseFloat(place.lat),
                endLon: parseFloat(place.lng)
            }));
        }
    };

    // Callback quand la carte a calculé l'itinéraire (Leaflet Routing Machine)
    // Elle nous renvoie la distance précise et la géométrie 
    const handleRouteCalculated = (routeData) => {
        if (!routeData) return;
        setFormData(prev => ({
            ...prev,
            distance: (routeData.totalDistance / 1000).toFixed(1), // Mètres -> Km
            duration: Math.round(routeData.totalDuration / 60),    // Secondes -> Minutes
            geometry: routeData.geometry // Le "shape" du trajet pour l'affichage futur pour symfony
        }));
    };

    // --- SOUMISSION DU FORMULAIRE  ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Sécurité : On vérifie que l'utilisateur a bien sélectionné des points GPS
        if (!formData.startLat || !formData.endLat) {
            triggerToast("Veuillez sélectionner des adresses valides via la recherche.", "warning");
            return;
        }

        // Sécurité : On vérifie qu'une voiture est choisie
        if (!formData.carId) {
            triggerToast("Veuillez sélectionner un véhicule pour ce trajet.", "warning");
            return;
        }

        setIsSubmitting(true);

        try {
            // Préparation de l'objet pour le Service
            // C'est ici qu'on fait correspondre nos champs de formulaire avec ce que le Mapper attend
            const rideData = {
                driverId: user.id,
                carId: formData.carId,

                // Textes
                name: formData.name || `Trajet vers ${formData.arrivalPlace.split(',')[0]}`,
                description: formData.description,
                promoCode: formData.promoCode,

                // Lieux & GPS
                departurePlace: formData.departurePlace,
                arrivalPlace: formData.arrivalPlace,
                startLat: formData.startLat,
                startLon: formData.startLon,
                endLat: formData.endLat,
                endLon: formData.endLon,

                // DATES : On envoie séparément Date et Heure
                // Le Mapper se chargera de créer le timestamp ISO complet pour la DB
                departureDate: formData.dateStart,
                departureTime: formData.timeStart,

                // Logistique
                seatsTotal: parseInt(formData.seats),
                price: parseFloat(formData.price),

                // Données techniques (si le calcul de route a échoué, on met 0)
                distance: formData.distance || 0,
                duration: formData.duration || 0,
                geometry: formData.geometry || null,

                // Options
                allowDetour: formData.allowDetour,
                isRecurring: formData.isRecurring
            };

            // Appel au service pour créer le trajet

            await RideService.create(rideData);

            triggerToast("Trajet publié avec succès !", "success");
            setShowForm(false);

            // Rafraîchir la liste
            const updatedRides = await RideService.getAll({ driverId: user.id });
            setRides(updatedRides.reverse());

            // Reset du formulaire
            setFormData({
                name: '', description: '', promoCode: '',
                departurePlace: '', arrivalPlace: '',
                dateStart: '', timeStart: '',
                seats: 1, price: 0,
                startLat: null, startLon: null, endLat: null, endLon: null,
                distance: null, duration: null, geometry: null,
                allowDetour: true, isRecurring: false,
                carId: ''
            });

        } catch (error) {
            console.error(error);
            triggerToast("Erreur lors de la publication.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- SUPPRESSION ---
    const handleDelete = async (rideId) => {
        if (window.confirm("Voulez-vous vraiment annuler ce trajet ?")) {
            try {
                await RideService.delete(rideId);
                setRides(prev => prev.filter(r => r.id !== rideId));
                triggerToast("Trajet supprimé.", "success");
            } catch (error) {
                triggerToast("Erreur lors de la suppression.", "error");
            }
        }
    };

    if (loading) return <Loader text="Chargement de vos trajets..." />;

    return (
        <div className="space-y-6 animate-fade-in">

            {/* --- EN-TÊTE --- */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Mes Trajets Publiés</h2>
                    <p className="text-sm text-gray-500">Gérez vos propositions de covoiturage.</p>
                </div>
                {!showForm && (
                    <Button onClick={() => setShowForm(true)}>
                        Publier un nouveau trajet
                    </Button>
                )}
            </div>

            {/* --- FORMULAIRE D'AJOUT --- */}
            {showForm && (
                <Card className="p-6 border-emerald-100 ring-4 ring-emerald-50/50">
                    <h3 className="text-lg font-bold text-emerald-900 mb-6 flex items-center gap-2">
                        <MapPin className="w-5 h-5" /> Nouveau Trajet
                    </h3>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Sélection Véhicule */}
                        <div className="form-control">
                            <label className="label pt-0 justify-start">
                                <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Véhicule utilisé</span>
                            </label>
                            {cars.length > 0 ? (
                                <select
                                    name="carId"
                                    value={formData.carId}
                                    onChange={handleChange}
                                    className="select select-bordered w-full"
                                    required
                                >
                                    <option value="" disabled>-- Choisir une voiture --</option>
                                    {cars.map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.brand} {car.model} ({car.licensePlate}) - {car.numberOfSeat} places
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="alert alert-warning text-sm">
                                    Vous n'avez pas encore ajouté de véhicule. Allez dans l'onglet "Mes Véhicules".
                                </div>
                            )}
                        </div>

                        {/* Carte & Itinéraire */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <AddressAutocomplete
                                    label="Lieu de départ"
                                    onSelect={(p) => handleAddressSelect('start', p)}
                                />
                                <AddressAutocomplete
                                    label="Lieu d'arrivée"
                                    onSelect={(p) => handleAddressSelect('end', p)}
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                        type="date"
                                        label="Date de départ"
                                        name="dateStart"
                                        value={formData.dateStart}
                                        onChange={handleChange}
                                        required
                                    />
                                    <Input
                                        type="time"
                                        label="Heure"
                                        name="timeStart"
                                        value={formData.timeStart}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Carte Interactive */}
                            <div className="h-64 lg:h-auto rounded-xl overflow-hidden border border-gray-200 shadow-inner relative">
                                <RideMap
                                    startCoords={formData.startLat ? { lat: formData.startLat, lng: formData.startLon } : null}
                                    endCoords={formData.endLat ? { lat: formData.endLat, lng: formData.endLon } : null}
                                    onRouteCalculated={handleRouteCalculated}
                                />
                                {/* Overlay Infos Distance/Durée */}
                                {formData.distance && (
                                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold shadow-sm z-[1000] border border-gray-200">
                                        {formData.distance} km • {Math.round(formData.duration)} min
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="divider">Détails</div>

                        {/* Prix & Places */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input
                                type="number"
                                label="Prix par place (€)"
                                name="price"
                                min="0"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                            <div className="form-control">
                                <label className="label pt-0 justify-start">
                                    <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Places dispo</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="8"
                                    value={formData.seats}
                                    name="seats"
                                    onChange={handleChange}
                                    className="range range-success range-sm"
                                />
                                <div className="w-full flex justify-between text-xs px-2 mt-1 font-bold text-gray-500">
                                    <span>1</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>|</span><span>8</span>
                                </div>
                                <div className="text-center font-bold text-emerald-700 mt-1">{formData.seats} places</div>
                            </div>

                            <Input
                                label="Code Promo (Optionnel)"
                                name="promoCode"
                                placeholder="ex: ETE2025"
                                value={formData.promoCode}
                                onChange={handleChange}
                            />
                        </div>

                        {/* Options */}
                        <div className="flex flex-col sm:flex-row gap-6 p-4 bg-gray-50 rounded-xl">
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    name="allowDetour"
                                    checked={formData.allowDetour}
                                    onChange={handleChange}
                                    className="checkbox checkbox-success"
                                />
                                <span className="label-text font-medium text-gray-700">J'accepte les petits détours</span>
                            </label>
                            <label className="label cursor-pointer justify-start gap-3">
                                <input
                                    type="checkbox"
                                    name="isRecurring"
                                    checked={formData.isRecurring}
                                    onChange={handleChange}
                                    className="checkbox checkbox-success"
                                />
                                <span className="label-text font-medium text-gray-700">Trajet régulier (ex: Travail)</span>
                            </label>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
                                Annuler
                            </Button>
                            <Button type="submit" isLoading={isSubmitting}>
                                Publier le trajet
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {/* --- LISTE DES TRAJETS --- */}
            {rides.length === 0 && !showForm ? (
                <EmptyState
                    message="Vous n'avez publié aucun trajet pour le moment."
                    actionLabel="Publier mon premier trajet"
                    onAction={() => setShowForm(true)}
                    icon={<Navigation className="w-10 h-10 text-gray-300" />}
                />
            ) : (
                <div className="space-y-4">
                    {rides.map(ride => (
                        <Card key={ride.id} className="flex flex-col md:flex-row overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 flex-1 relative">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-lg text-gray-800">{ride.name}</h4>
                                    <div className="flex items-center gap-2 font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full text-sm">
                                        {ride.price} €
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 my-4 pl-3 border-l-2 border-gray-200">
                                    <div className="relative">
                                        <div className="absolute -left-[19px] top-1.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></div>
                                        <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">
                                            {new Date(ride.departureDate).toLocaleDateString()} à {ride.departureTime}
                                        </p>
                                        <p className="font-bold text-gray-800">{ride.departurePlace}</p>
                                    </div>
                                    <div className="relative pt-2">
                                        <div className="absolute -left-[19px] top-3.5 w-3 h-3 bg-gray-400 rounded-full border-2 border-white"></div>
                                        <p className="font-bold text-gray-800">{ride.arrivalPlace}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 text-xs text-gray-500 mt-4">
                                    <span className="flex items-center gap-1"><CarFront className="w-3 h-3" /> {ride.seatsAvailable} places dispo</span>
                                    {ride.isRecurring && <span className="badge badge-xs badge-ghost">Régulier</span>}
                                    {ride.allowDetour && <span className="badge badge-xs badge-ghost">Détour OK</span>}
                                </div>

                                <div className="absolute top-4 right-16">
                                    <StatusBadge type={ride.status === 'completed' ? 'neutral' : 'success'}>
                                        {ride.status === 'completed' ? 'Terminé' : 'Planifié'}
                                    </StatusBadge>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 md:w-48 flex flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-gray-100">
                                <Button variant="secondary" className="btn-sm w-full" onClick={() => setSelectedRideDetail(ride)}>
                                    Détails
                                </Button>
                                {ride.status !== 'completed' && (
                                    <Button
                                        className="btn-sm w-full btn-outline btn-error hover:!text-white"
                                        onClick={() => handleDelete(ride.id)}
                                    >
                                        Annuler
                                    </Button>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Popup Détails */}
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