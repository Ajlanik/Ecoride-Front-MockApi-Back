import React, { useState, useEffect } from 'react';
import { CarService } from '../../services/carService';

// --- IMPORTS UI (DESIGN SYSTEM) ---
import Button from '../ui/Button';
import Card from '../ui/Card';
import Popup from '../ui/Popup';
import Avatar from '../ui/Avatar';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';

import CarForm from './CarForm';

const CarsTab = ({ userId }) => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // États pour les Popups
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null); // Sert pour l'édition (Détails)
    
    // État pour le filtre (Rétabli)
    const [showArchived, setShowArchived] = useState(false);

    // --- CHARGEMENT ---
    useEffect(() => { fetchCars(); }, [userId]);

    const fetchCars = async () => {
        if (userId) {
            try {
                const data = await CarService.getAll({ userId: userId });
                setCars(data);
            } catch (error) { console.error(error); }
        }
        setLoading(false);
    };

    // --- ACTIONS ---
    const handleToggleStatus = async (car) => {
        const newStatus = !car.isActive;
        // Optimistic UI update (Mise à jour visuelle immédiate)
        setCars(prev => prev.map(c => c.id === car.id ? { ...c, isActive: newStatus } : c));
        try {
            await CarService.update(car.id, { isActive: newStatus });
        } catch (error) {
            console.error("Erreur update", error);
            fetchCars(); // Rollback en cas d'erreur
        }
    };

    const handleSetFavorite = async (carId) => {
        setCars(prev => prev.map(c => ({ ...c, isFavorite: c.id === carId })));
        try {
            // Logique métier : Un seul favori possible, le back gérera idéalement ça, 
            // mais ici on peut forcer la mise à jour si besoin.
            await CarService.update(carId, { isFavorite: true });
        } catch (e) { console.error(e); }
    };

    // Soumission du formulaire AJOUT
    const handleAddSubmit = async (formData) => {
        try {
            const newCar = await CarService.create({ ...formData, userId });
            setCars([...cars, newCar]);
            setShowAddPopup(false);
        } catch (e) { console.error(e); alert("Erreur lors de l'ajout"); }
    };

    // Soumission du formulaire EDITION (Rétabli)
    const handleEditSubmit = async (formData) => {
        try {
            // On fusionne les anciennes données avec les nouvelles
            const payload = { ...selectedCar, ...formData };
            
            const updatedCar = await CarService.update(selectedCar.id, payload);
            
            // Mise à jour de la liste locale
            setCars(prev => prev.map(c => c.id === updatedCar.id ? updatedCar : c));
            setSelectedCar(null); // Ferme la popup
        } catch (e) { console.error(e); alert("Erreur lors de la modification"); }
    };

    // --- RENDU ---
    if (loading) return <Loader text="Chargement de votre garage..." />;

    // Filtrage des voitures (Actives vs Toutes)
    const filteredCars = showArchived ? cars : cars.filter(c => c.isActive);
    
    // Tri : Favori en premier
    const sortedCars = [...filteredCars].sort((a, b) => (b.isFavorite === true) - (a.isFavorite === true));

    return (
        <div className="space-y-6 animate-fade-in">
            
            {/* Header Onglet + Filtres */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-emerald-900">
                        Mes Véhicules ({filteredCars.length})
                    </h3>
                    
                    {/* Toggle Archivés (Rétabli) */}
                    <div className="form-control">
                        <label className="label cursor-pointer gap-2">
                            <span className="label-text text-xs text-gray-500 font-medium">Voir archivés</span>
                            <input 
                                type="checkbox" 
                                className="toggle toggle-xs toggle-neutral" 
                                checked={showArchived} 
                                onChange={() => setShowArchived(!showArchived)} 
                            />
                        </label>
                    </div>
                </div>

                <Button onClick={() => setShowAddPopup(true)} className="btn-sm shadow-emerald-500/20 shadow-lg">
                    + Ajouter un véhicule
                </Button>
            </div>

            {/* LISTE DES VOITURES */}
            {filteredCars.length === 0 ? (
                <EmptyState 
                    icon="🚗" 
                    message={showArchived ? "Aucun véhicule trouvé." : "Vous n'avez aucun véhicule actif."}
                    actionLabel="Ajouter un véhicule"
                    onAction={() => setShowAddPopup(true)}
                />
            ) : (
                <div className="grid gap-4">
                    {sortedCars.map(car => (
                        <Card key={car.id} className={`p-4 flex flex-col sm:flex-row gap-5 items-center transition-all ${!car.isActive ? 'opacity-75 bg-gray-50' : ''}`}>
                            
                            {/* Image avec Avatar Intelligent */}
                            <div className="relative group">
                                <Avatar 
                                    src={car.picture} 
                                    type="car" 
                                    size="xl" 
                                    className={!car.isActive ? "grayscale" : ""}
                                />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleSetFavorite(car.id); }}
                                    className={`absolute -top-2 -right-2 btn btn-circle btn-xs border-none shadow-md ${car.isFavorite ? 'bg-yellow-400 text-white hover:bg-yellow-500' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                    title="Définir comme favori"
                                >
                                    ★
                                </button>
                            </div>

                            {/* Infos */}
                            <div className="flex-1 text-center sm:text-left space-y-1">
                                <div className="flex items-center justify-center sm:justify-start gap-2">
                                    <h4 className={`font-bold text-lg ${car.isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                                        {car.brand} {car.model}
                                    </h4>
                                    <StatusBadge type={car.isActive ? 'success' : 'neutral'}>
                                        {car.isActive ? 'Actif' : 'Archivé'}
                                    </StatusBadge>
                                </div>
                                
                                <div className="text-sm text-gray-500 font-mono bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-100">
                                    {car.licensePlate}
                                </div>
                                
                                <div className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-3 mt-1">
                                    <span>⚡ {car.engine || 'N/A'}</span>
                                    <span>💺 {car.numberOfSeat} places</span>
                                </div>
                            </div>

                            {/* Actions (Toggle Switch + Bouton Détails) */}
                            <div className="flex items-center gap-4 px-4">
                                <div className="form-control" title={car.isActive ? "Désactiver le véhicule" : "Réactiver le véhicule"}>
                                    <input 
                                        type="checkbox" 
                                        className={`toggle toggle-sm ${car.isActive ? 'toggle-success' : 'toggle-lg bg-gray-200'}`} 
                                        checked={car.isActive} 
                                        onChange={() => handleToggleStatus(car)} 
                                    />
                                </div>
                                
                                {/* BOUTON DÉTAIL (Rétabli) */}
                                <Button 
                                    variant="secondary" 
                                    className="btn-sm" 
                                    onClick={() => setSelectedCar(car)}
                                >
                                    Modifier
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* POPUP D'AJOUT */}
            <Popup 
                isOpen={showAddPopup} 
                onClose={() => setShowAddPopup(false)} 
                title="Ajouter un véhicule"
            >
                <CarForm 
                    onSubmit={handleAddSubmit} 
                    onCancel={() => setShowAddPopup(false)}
                    isLoading={false} 
                />
            </Popup>

            {/* POPUP DE MODIFICATION (S'ouvre si selectedCar existe) */}
            <Popup 
                isOpen={!!selectedCar} 
                onClose={() => setSelectedCar(null)} 
                title={`Modifier ${selectedCar?.brand} ${selectedCar?.model}`}
            >
                <CarForm 
                    initialData={selectedCar}
                    onSubmit={handleEditSubmit} 
                    onCancel={() => setSelectedCar(null)}
                    isLoading={false}
                    isEditMode={true}
                />
            </Popup>

        </div>
    );
};

export default CarsTab;