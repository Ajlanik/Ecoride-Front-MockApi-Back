import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { RideService } from '../services/rideService';
import { CarService } from '../services/carService';

// --- IMPORTS UI (DESIGN SYSTEM) ---
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';           // <--- NOUVEAU
import StatusBadge from '../components/ui/StatusBadge'; // <--- NOUVEAU
import Loader from '../components/ui/Loader';       // <--- NOUVEAU
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import RideMap from '../components/ui/RideMap'; 
import RideDetailPopup from '../components/dashboard/RideDetailPopup'; 

//------ Page Mes Trajets ------//
const MyRidesPage = () => {
    const { user } = useAuth();

    //------ États Données ------//
    const [rides, setRides] = useState([]);
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    //------ États Vue ------//
    const [showForm, setShowForm] = useState(false);
    const [selectedRideDetail, setSelectedRideDetail] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    //------ États Formulaire ------//
    const [formData, setFormData] = useState({
        name: '', description: '', promoCode: '',
        departurePlace: '', arrivalPlace: '',
        dateStart: '', timeStart: '',
        carId: '', price: '', seatsTotal: 1,
        allowDetour: false, isRecurring: false, duration: 60
    });

    //------ États Carte ------//
    const [startCoords, setStartCoords] = useState(null);
    const [endCoords, setEndCoords] = useState(null);
    const [mapMode, setMapMode] = useState('view');

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            const myCars = await CarService.getAll({ userId: user.id });
            const activeCars = myCars
                .filter(c => c.isActive)
                .sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));
            setCars(activeCars);
            if (activeCars.length > 0) setFormData(prev => ({ ...prev, carId: activeCars[0].id }));

            const myRides = await RideService.getAll({ driverId: user.id });
            setRides(myRides);
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startCoords || !endCoords) {
            alert("Attention : Vous devez définir le Départ et l'Arrivée sur la carte !");
            return;
        }

        setIsSubmitting(true);
        try {
            const rideToCreate = {
                driverId: user.id,
                ...formData,
                startLat: startCoords.lat, startLon: startCoords.lng,
                endLat: endCoords.lat, endLon: endCoords.lng,
                departureDate: formData.dateStart,
                departureTime: formData.timeStart,
                seatsAvailable: formData.seatsTotal
            };
            const createdRide = await RideService.create(rideToCreate);
            setRides([...rides, createdRide]);
            setShowForm(false);
            setStartCoords(null); setEndCoords(null);
            alert("Trajet publié avec succès ! ");
        } catch (error) { alert("Erreur publication."); } finally { setIsSubmitting(false); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Annuler ce trajet ?")) {
            try { await RideService.delete(id); setRides(rides.filter(r => r.id !== id)); }
            catch (e) { alert("Erreur suppression"); }
        }
    };

    //------ UTILISATION DU NOUVEAU LOADER ------//
    if (loading) return <Loader text="Chargement de vos trajets..." />;

    // ----- Rendu Principal ------//
    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto p-6">

                {/* HEADER DE PAGE */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-emerald-900">Mes Trajets</h1>
                        <p className="text-gray-500">Gérez vos annonces de covoiturage</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="shadow-emerald-500/20 shadow-lg">
                        {showForm ? 'Fermer le formulaire' : '+ Publier un trajet'}
                    </Button>
                </div>

                {/* --- FORMULAIRE CRÉATION --- */}
                {showForm && (
                    <Card className="p-8 border-emerald-100 mb-10 animate-fade-in">
                        <h3 className="font-bold text-xl mb-6 text-emerald-900 border-b border-gray-100 pb-4">Nouveau Trajet</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nom du trajet" name="name" value={formData.name} onChange={handleChange} required placeholder="ex: Retour Weekend" />
                                <Input label="Code Promo" name="promoCode" value={formData.promoCode} onChange={handleChange} placeholder="ex: SUMMER" />
                            </div>

                            <div className="form-control w-full">
                                <label className="label pt-0 pb-2 justify-start">
                                    <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Description du trajet</span>
                                </label>
                                <textarea
                                    name="description"
                                    className="textarea textarea-bordered h-24 w-full focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300 text-base"
                                    placeholder="Précisions sur le lieu de RDV, ambiance, musique, animaux acceptés..."
                                    value={formData.description}
                                    onChange={handleChange}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="form-control w-full">
                                    <label className="label pt-0 pb-2 justify-start">
                                        <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">Véhicule</span>
                                    </label>
                                    <select
                                        name="carId"
                                        className="select select-bordered w-full h-12 px-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 border-gray-300 font-normal text-base"
                                        value={formData.carId}
                                        onChange={handleChange}
                                    >
                                        {cars.map(car => (
                                            <option key={car.id} value={car.id}>
                                                {car.brand} {car.model} {car.isFavorite ? '⭐' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <Input label="Places dispo" type="number" name="seatsTotal" value={formData.seatsTotal} onChange={handleChange} min="1" max="8" required />
                                <Input label="Prix par place (€)" type="number" name="price" value={formData.price} onChange={handleChange} min="0" step="0.5" required />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <Input label="Date départ" type="date" name="dateStart" value={formData.dateStart} onChange={handleChange} required />
                                <Input label="Heure départ" type="time" name="timeStart" value={formData.timeStart} onChange={handleChange} required />
                            </div>

                            <div className="flex gap-8 py-2">
                                <label className="cursor-pointer flex items-center gap-2">
                                    <input type="checkbox" className="checkbox checkbox-primary" name="allowDetour" checked={formData.allowDetour} onChange={handleChange} />
                                    <span className="label-text text-gray-700 font-medium">Détour autorisé</span>
                                </label>
                                <label className="cursor-pointer flex items-center gap-2">
                                    <input type="checkbox" className="checkbox checkbox-primary" name="isRecurring" checked={formData.isRecurring} onChange={handleChange} />
                                    <span className="label-text text-gray-700 font-medium">Trajet récurrent</span>
                                </label>
                            </div>

                            {/* --- AUTOCOMPLETION DES ADRESSES --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-20">
                                <AddressAutocomplete
                                    label="Lieu de Départ (Adresse exacte)"
                                    placeholder="ex: 10 Rue de la Paix, Paris"
                                    required
                                    onSelect={(data) => {
                                        setFormData(prev => ({ ...prev, departurePlace: data.address }));
                                        setStartCoords({ lat: data.lat, lng: data.lng }); 
                                    }}
                                />
                                <AddressAutocomplete
                                    label="Lieu d'Arrivée (Adresse exacte)"
                                    placeholder="ex: Gare de Lyon, Paris"
                                    required
                                    onSelect={(data) => {
                                        setFormData(prev => ({ ...prev, arrivalPlace: data.address }));
                                        setEndCoords({ lat: data.lat, lng: data.lng }); 
                                    }}
                                />
                            </div>

                            {/* --- CARTE AVEC RIDE MAP --- */}
                            <div className="mt-4">
                                <label className="label font-bold text-emerald-900 text-xs uppercase tracking-wide mb-2">
                                    Aperçu du trajet (Automatique)
                                </label>
                                <div className="w-full h-96 rounded-2xl overflow-hidden border-2 border-emerald-100 relative z-0 shadow-inner">
                                    <RideMap 
                                        startCoords={startCoords}
                                        endCoords={endCoords}
                                        mapMode={mapMode}
                                        setMapMode={setMapMode}
                                        onMapClick={(pos) => {
                                            if (mapMode === 'start') setStartCoords(pos);
                                            if (mapMode === 'end') setEndCoords(pos);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <Button type="submit" variant="primary" isLoading={isSubmitting} className="px-10 py-3 text-lg h-auto">
                                    Publier le trajet
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* --- LISTE DES TRAJETS (INTEGRATION CARD + STATUS BADGE) --- */}
                <div className="grid gap-6">
                    {rides.length === 0 && !showForm && (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg">Aucun trajet publié pour le moment.</p>
                            <Button variant="ghost" onClick={() => setShowForm(true)} className="mt-4">Commencer maintenant</Button>
                        </div>
                    )}

                    {rides.map(ride => (
                        <Card key={ride.id} hoverable className="flex flex-col md:flex-row justify-between items-center gap-6 p-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    {/* Utilisation de StatusBadge pour gérer les couleurs automatiquement */}
                                    <StatusBadge type={ride.status === 'completed' ? 'neutral' : 'success'}>
                                        {ride.status || 'SCHEDULED'}
                                    </StatusBadge>
                                    
                                    <h4 className="font-bold text-xl text-emerald-950">{ride.name}</h4>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-700 font-medium">
                                    <span className="flex items-center gap-2"> {ride.departurePlace}</span>
                                    <span className="hidden sm:inline text-gray-300">➜</span>
                                    <span className="flex items-center gap-2"> {ride.arrivalPlace}</span>
                                </div>

                                <div className="text-sm text-gray-500 flex flex-wrap gap-3">
                                    <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-200"> {ride.departureDate} • {ride.departureTime}</span>
                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-bold"> {ride.price} €</span>
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100"> {ride.seatsAvailable} places</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setSelectedRideDetail(ride)}>Détails</Button>
                                <Button variant="danger" onClick={() => handleDelete(ride.id)}>Supprimer</Button>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* --- MODALE DÉTAIL --- */}
                {selectedRideDetail && (
                    <RideDetailPopup 
                        ride={selectedRideDetail}
                        car={cars.find(c => c.id === selectedRideDetail.carId)}
                        onClose={() => setSelectedRideDetail(null)}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default MyRidesPage;