// EcorideAKNProd/EcorideAKNProd/src/components/dashboard/CarsTab.jsx

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCars } from '../../hooks/useCars'; // Import du hook

// UI
import Button from '../ui/Button';
import Popup from '../ui/Popup';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';
import CarForm from './CarForm';
import CarCard from './CarCard';

const CarsTab = ({ userId }) => {
    const { user } = useAuth();
    
    // Utilisation du Hook
    const { cars, loading, addCar, updateCar, toggleCarStatus, setCarFavorite } = useCars(userId, user);

    const [showAddPopup, setShowAddPopup] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null);

    const handleAddSubmit = async (formData) => {
        const success = await addCar(formData);
        if (success) setShowAddPopup(false);
    };

    const handleEditSubmit = async (formData) => {
        const success = await updateCar(selectedCar.id, formData);
        if (success) setSelectedCar(null);
    };

    if (loading) return <Loader text="Chargement de votre garage..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Mes Véhicules</h2>
                    <p className="text-sm text-gray-500">Gérez votre flotte pour le covoiturage.</p>
                </div>
                <Button onClick={() => setShowAddPopup(true)} className="btn-sm shadow-emerald-200">
                    Ajouter
                </Button>
            </div>

            {cars.length === 0 ? (
                <EmptyState
                    message="Votre garage est vide."
                    actionLabel="Ajouter un véhicule"
                    onAction={() => setShowAddPopup(true)}
                />
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {cars.map(car => (
                        <CarCard
                            key={car.id}
                            car={car}
                            onToggleStatus={toggleCarStatus}
                            onSetFavorite={setCarFavorite}
                            onDetail={setSelectedCar}
                        />
                    ))}
                </div>
            )}

            <Popup isOpen={showAddPopup} onClose={() => setShowAddPopup(false)} title="Nouveau véhicule">
                <CarForm onSubmit={handleAddSubmit} onCancel={() => setShowAddPopup(false)} isLoading={false} />
            </Popup>

            <Popup isOpen={!!selectedCar} onClose={() => setSelectedCar(null)} title={`Modifier ${selectedCar?.brand} ${selectedCar?.model}`}>
                <CarForm initialData={selectedCar} onSubmit={handleEditSubmit} onCancel={() => setSelectedCar(null)} isLoading={false} isEditMode={true} />
            </Popup>
        </div>
    );
};

export default CarsTab;