import React, { useState, useEffect } from 'react';
import { CarService } from '../../services/carService';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

// UI
import Button from '../ui/Button';
import Popup from '../ui/Popup';
import Loader from '../ui/Loader';
import EmptyState from '../ui/EmptyState';

import CarForm from './CarForm';
import CarCard from './CarCard';

const CarsTab = ({ userId }) => {
    const { triggerToast } = useToast();
    const { user } = useAuth();
    
    // Si userId n'est pas passé, on prend celui du user connecté (Sécurité)
    const targetUserId = userId || user?.id;

    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [showAddPopup, setShowAddPopup] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null); 

    // --- CHARGEMENT ---
    useEffect(() => {
        if (targetUserId) {
            fetchCars();
        }
    }, [targetUserId]);

    const fetchCars = async () => {
        setLoading(true);
        try {
            // Appel API Backend
            const data = await CarService.getAll({ userId: targetUserId });
            setCars(data);
        } catch (error) {
            console.error(error);
            triggerToast("Erreur chargement véhicules.", "error");
        } finally {
            setLoading(false);
        }
    };

    // --- ACTIONS ---

  // Gestion de la soumission du formulaire d'ajout
 const handleAddSubmit = async (formData) => {
        try {
            // SÉCURITÉ : On vérifie qu'un utilisateur est bien connecté
            if (!user || !user.id) {
                console.error("Aucun utilisateur connecté trouvé !");
                triggerToast("Erreur : Vous devez être connecté.", "error");
                return;
            }

            // Préparation du payload
            const payload = {
                ...formData,
                // DYNAMIQUE : On utilise l'ID de l'utilisateur connecté
                numberOfSeat: parseInt(formData.numberOfSeat, 10),
                userId: user.id 
            };

            await CarService.create(payload);
            
            setShowAddPopup(false);
            fetchCars(); 

        } catch (error) {
            console.error("Erreur lors de la création du véhicule:", error);
            triggerToast("Erreur lors de la création", "error");
        }
    };

    const handleEditSubmit = async (formData) => {
        try {
            await CarService.update(selectedCar.id, formData);
            triggerToast("Véhicule mis à jour.", "success");
            setSelectedCar(null);
            fetchCars();
        } catch (error) {
            triggerToast("Erreur lors de la modification.", "error");
        }
    };

    const handleToggleStatus = async (car) => {
        try {
            const newStatus = !car.isActive;
            // Optimistic UI (Mise à jour visuelle immédiate pour fluidité)
            setCars(prev => prev.map(c => c.id === car.id ? { ...c, isActive: newStatus } : c));
            
            // Appel Backend
            await CarService.update(car.id, { isActive: newStatus });
            triggerToast(newStatus ? "Véhicule visible." : "Véhicule masqué.", "info");
        } catch (error) {
            triggerToast("Erreur de mise à jour.", "error");
            fetchCars(); // Revert en cas d'erreur
        }
    };

    const handleSetFavorite = async (carId) => {
        // Logique Backend à venir : POST /cars/{id}/favorite
        triggerToast("Favori mis à jour (Simulation)", "success");
        setCars(prev => prev.map(c => ({
            ...c,
            isFavorite: c.id === carId // Un seul favori à la fois (logique front pour l'instant)
        })));
    };

    if (loading) return <Loader text="Chargement de votre garage..." />;

    return (
        <div className="space-y-6 animate-fade-in">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Mes Véhicules</h2>
                    <p className="text-sm text-gray-500">Gérez votre flotte pour le covoiturage.</p>
                </div>
                <Button onClick={() => setShowAddPopup(true)} className="btn-sm shadow-emerald-200">
                    Ajouter
                </Button>
            </div>

            {/* Liste */}
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
                            onToggleStatus={handleToggleStatus}
                            onSetFavorite={handleSetFavorite}
                            onDetail={setSelectedCar}
                        />
                    ))}
                </div>
            )}

            {/* --- POPUPS --- */}
            
            <Popup 
                isOpen={showAddPopup} 
                onClose={() => setShowAddPopup(false)} 
                title="Nouveau véhicule"
            >
                <CarForm 
                    onSubmit={handleAddSubmit} 
                    onCancel={() => setShowAddPopup(false)}
                    isLoading={false} 
                />
            </Popup>

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