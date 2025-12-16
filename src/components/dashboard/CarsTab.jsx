import React, { useState, useEffect } from 'react';
import { CarService } from '../../services/carService';
import Button from '../ui/Button';
import CarForm from './CarForm'; // Import du nouveau formulaire
import CarCard from './CarCard'; // Import de la nouvelle carte

const CarsTab = ({ userId }) => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCar, setSelectedCar] = useState(null); // Mode Edition si non null
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

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

    // --- LOGIQUE METIER ---
    const handleSetFavorite = async (carId) => {
        setCars(prev => prev.map(c => ({ ...c, isFavorite: c.id === carId })));
        try {
            await CarService.update(carId, { isFavorite: true });
            // Boucle MockAPI (A remplacer par logique backend)
            cars.forEach(async (c) => {
                if (c.id !== carId && c.isFavorite) await CarService.update(c.id, { isFavorite: false });
            });
        } catch (error) { fetchCars(); }
    };

    const handleToggleStatus = async (car) => {
        const action = car.isActive ? "désactiver" : "réactiver";
        if (window.confirm(`Voulez-vous vraiment ${action} ce véhicule ?`)) {
            try {
                await CarService.update(car.id, { isActive: !car.isActive });
                setCars(prev => prev.map(c => c.id === car.id ? { ...c, isActive: !c.isActive } : c));
                if (selectedCar?.id === car.id) setSelectedCar(prev => ({ ...prev, isActive: !prev.isActive }));
            } catch (e) { alert("Erreur statut"); }
        }
    };

    // --- LOGIQUE FORMULAIRES ---
    const handleAddSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                userId,
                isActive: true,
                isFavorite: false,
                numberOfSeat: parseInt(formData.numberOfSeat),
                // Si pas d'image, image par défaut
                picture: formData.picture || `https://source.unsplash.com/random/300x200/?car,${formData.brand}`,
                purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : new Date().toISOString(),
                insurance: formData.insurance ? new Date(formData.insurance).toISOString() : new Date().toISOString()
            };
            const created = await CarService.create(payload);
            setCars(prev => [...prev, created]);
            setShowAddModal(false);
            alert("Véhicule ajouté !");
        } catch (e) { alert("Erreur ajout"); } finally { setIsSubmitting(false); }
    };

    const handleEditSubmit = async (formData) => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...selectedCar, // On garde l'ID et les champs non modifiés
                ...formData,
                purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate).toISOString() : selectedCar.purchaseDate,
                insurance: formData.insurance ? new Date(formData.insurance).toISOString() : selectedCar.insurance
            };
            const updated = await CarService.update(selectedCar.id, payload);
            setCars(prev => prev.map(c => c.id === updated.id ? updated : c));
            setSelectedCar(null); // Retour liste
            alert("Modifications enregistrées !");
        } catch (e) { alert("Erreur édition"); } finally { setIsSubmitting(false); }
    };

    const filteredCars = showArchived ? cars : cars.filter(c => c.isActive);

    if (loading) return <div className="p-8 text-center text-emerald-800 animate-pulse">Chargement...</div>;

    // --- VUE 1 : EDITION ---
    if (selectedCar) {
        return (
            <div className="animate-fade-in">
                <Button variant="ghost" onClick={() => setSelectedCar(null)} className="mb-4 gap-2 pl-0 hover:bg-transparent hover:text-emerald-700">← Retour à la liste</Button>
                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-emerald-100">
                    <h2 className="text-2xl font-bold text-emerald-950 mb-6 border-b pb-4">Modifier le véhicule</h2>
                    
                    {/* On réutilise le composant Formulaire ici ! */}
                    <CarForm 
                        initialData={selectedCar} 
                        onSubmit={handleEditSubmit} 
                        onCancel={() => setSelectedCar(null)}
                        isLoading={isSubmitting}
                        isEditMode={true}
                    />
                </div>
            </div>
        );
    }

    // --- VUE 2 : LISTE ---
    return (
        <div className="space-y-6 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                        Mes voitures <span className="badge badge-ghost font-normal">{filteredCars.length}</span>
                    </h3>
                    <div className="form-control">
                        <label className="label cursor-pointer gap-2">
                            <span className="label-text text-xs text-gray-500">Voir archivés</span>
                            <input type="checkbox" className="toggle toggle-xs toggle-neutral" checked={showArchived} onChange={() => setShowArchived(!showArchived)} />
                        </label>
                    </div>
                </div>
                <Button variant="primary" className="btn-sm shadow-emerald-500/20 shadow-lg" onClick={() => setShowAddModal(true)}>+ Ajouter</Button>
            </div>

            {filteredCars.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 mb-4">{cars.length > 0 ? "Aucun véhicule actif." : "Votre garage est vide."}</p>
                    {cars.length === 0 && <Button variant="secondary" onClick={() => setShowAddModal(true)}>Ajouter mon premier véhicule</Button>}
                </div>
            ) : (
                <div className="grid gap-4">
                    {filteredCars.map(car => (
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

            {/* MODALE D'AJOUT (Réutilise aussi le formulaire !) */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h3 className="text-xl font-bold text-emerald-900 mb-6">Ajouter un véhicule</h3>
                        <CarForm 
                            onSubmit={handleAddSubmit} 
                            onCancel={() => setShowAddModal(false)}
                            isLoading={isSubmitting}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarsTab;