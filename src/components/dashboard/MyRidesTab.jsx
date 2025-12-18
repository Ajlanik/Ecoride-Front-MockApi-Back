// components/dashboard/MyRidesTab.jsx
// pour gérer l'onglet "Mes Trajets" dans le tableau de bord utilisateur

import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout'; // On utilise le Layout ici
import { useAuth } from '../contexts/AuthContext';
import { RideService } from '../services/rideService';
import { CarService } from '../services/carService';

import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import AddressAutocomplete from '../components/ui/AddressAutocomplete'; // <--- NOUVEAU
import RideMap from '../components/ui/RideMap'; // <--- NOUVEAU

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

    //------ Fonctions pour charger les données ------//
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

    //------ si chargement ------//
    if (loading) return <div className="min-h-screen flex items-center justify-center">Chargement...</div>;

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
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-emerald-100 mb-10 animate-fade-in">
                        <h3 className="font-bold text-xl mb-6 text-emerald-900 border-b border-gray-100 pb-4">Nouveau Trajet</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Input label="Nom du trajet" name="name" value={formData.name} onChange={handleChange} required placeholder="ex: Retour Weekend" />
                                <Input label="Code Promo" name="promoCode" value={formData.promoCode} onChange={handleChange} placeholder="ex: SUMMER" />
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
                                        setStartCoords({ lat: data.lat, lng: data.lon });
                                    }}
                                />

                                <AddressAutocomplete
                                    label="Lieu d'Arrivée (Adresse exacte)"
                                    placeholder="ex: Gare de Lyon, Paris"
                                    required
                                    onSelect={(data) => {
                                        setFormData(prev => ({ ...prev, arrivalPlace: data.address }));
                                        setEndCoords({ lat: data.lat, lng: data.lon });
                                    }}
                                />
                            </div>

                            {/* --- CARTE INTELLIGENTE (RIDEMAP) --- */}
                            <div className="mt-4">
                                <label className="label font-bold text-emerald-900 text-xs uppercase tracking-wide mb-2">
                                    Aperçu du trajet (Automatique)
                                </label>
                                <div className="w-full h-96 rounded-2xl overflow-hidden border-2 border-emerald-100 relative z-0 shadow-inner">
                                    
                                    {/* OUTILS CARTE (Boutons visibles) */}
                                    <div className="absolute top-4 right-4 z-[1000] bg-white/95 backdrop-blur p-4 rounded-xl shadow-xl border border-gray-200 flex flex-col gap-3 min-w-[200px]">
                                        <p className="font-bold text-xs text-gray-500 uppercase">Outils Carte</p>

                                        {/* Bouton DÉPART */}
                                        <Button
                                            type="button"
                                            variant={mapMode === 'start' ? 'primary' : 'ghost'}
                                            onClick={() => setMapMode('start')}
                                            // Style conditionnel pour visibilité quand inactif
                                            className={`btn-sm w-full text-xs ${mapMode !== 'start' ? 'border-2 border-emerald-100 text-emerald-700 hover:border-emerald-200' : ''}`}
                                        >
                                             Définir Départ
                                        </Button>

                                        {/* Bouton ARRIVÉE */}
                                        <Button
                                            type="button"
                                            variant={mapMode === 'end' ? 'danger' : 'ghost'}
                                            onClick={() => setMapMode('end')}
                                            // Style conditionnel pour visibilité quand inactif
                                            className={`btn-sm w-full text-xs ${mapMode !== 'end' ? 'border-2 border-red-100 text-red-600 hover:border-red-200' : ''}`}
                                        >
                                             Définir Arrivée
                                        </Button>

                                        <div className="divider my-0 opacity-50"></div>
                                        <p className="text-[10px] text-center italic text-gray-500">
                                            {mapMode === 'start' && "Cliquez sur la carte pour le DÉPART"}
                                            {mapMode === 'end' && "Cliquez sur la carte pour l'ARRIVÉE"}
                                            {mapMode === 'view' && "Sélectionnez un bouton ci-dessus"}
                                        </p>
                                    </div>

                                    {/* COMPOSANT CARTE AVANCÉ */}
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
                    </div>
                )}

                {/* --- LISTE DES TRAJETS --- */}
                <div className="grid gap-6">
                    {rides.length === 0 && !showForm && (
                        <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg">Aucun trajet publié pour le moment.</p>
                            <Button variant="ghost" onClick={() => setShowForm(true)} className="mt-4">Commencer maintenant</Button>
                        </div>
                    )}

                    {rides.map(ride => (
                        <div key={ride.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-lg transition-all transform hover:-translate-y-1">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${ride.status === 'completed' ? 'badge-neutral' : 'badge-success text-white'} badge-lg`}>
                                        {ride.status || 'SCHEDULED'}
                                    </span>
                                    <h4 className="font-bold text-xl text-emerald-950">{ride.name}</h4>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-gray-700 font-medium">
                                    <span className="flex items-center gap-2"> {ride.departurePlace}</span>
                                    <span className="hidden sm:inline text-gray-300">➜</span>
                                    <span className="flex items-center gap-2"> {ride.arrivalPlace}</span>
                                </div>

                                <div className="text-sm text-gray-500 flex flex-wrap gap-3">
                                    <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-200"> {ride.departureDate} • {ride.departureTime}</span>
                                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg border border-emerald-100 font-bold">💶 {ride.price} €</span>
                                    <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg border border-blue-100">💺 {ride.seatsAvailable} places</span>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button variant="secondary" onClick={() => setSelectedRideDetail(ride)}>Détails</Button>
                                <Button variant="danger" onClick={() => handleDelete(ride.id)}>Supprimer</Button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* --- MODALE DÉTAIL --- */}
                {selectedRideDetail && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fade-in">
                        <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative max-h-[90vh] overflow-y-auto">
                            <button onClick={() => setSelectedRideDetail(null)} className="absolute top-4 right-4 btn btn-circle btn-sm btn-ghost">✕</button>
                            <h3 className="text-2xl font-bold text-emerald-900 mb-6">{selectedRideDetail.name}</h3>
                            
                            <div className="space-y-4">
                                <p><strong>Départ :</strong> {selectedRideDetail.departurePlace}</p>
                                <p><strong>Arrivée :</strong> {selectedRideDetail.arrivalPlace}</p>
                                
                                {/* Carte Read-Only avec Routing */}
                                <div className="h-64 rounded-xl overflow-hidden border border-gray-200 relative">
                                    <RideMap 
                                        startCoords={{ lat: selectedRideDetail.startLat, lng: selectedRideDetail.startLon }}
                                        endCoords={{ lat: selectedRideDetail.endLat, lng: selectedRideDetail.endLon }}
                                        readonly={true} // Mode lecture seule
                                    />
                                </div>
                            </div>
                            
                            <div className="mt-8 flex justify-end">
                                <Button onClick={() => setSelectedRideDetail(null)}>Fermer</Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default MyRidesPage;