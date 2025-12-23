// Composant CarForm.jsx : Formulaire pour ajouter ou éditer une voiture

import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CarForm = ({ initialData, onSubmit, onCancel, isLoading, isEditMode = false }) => {
    
    // Valeurs par défaut
    const defaultData = {
        brand: '', model: '', licensePlate: '', numberOfSeat: '4', engine: 'Electrique', 
        picture: '', purchaseDate: '', insurance: ''
    };

    const [formData, setFormData] = useState(defaultData);

    // Si on est en édition, on remplit le formulaire
    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultData,
                ...initialData,
                // Gestion sécurisée des dates pour éviter les bugs si null
                purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
                insurance: initialData.insurance ? initialData.insurance.split('T')[0] : ''
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, picture: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Style récupéré de ton composant Input.jsx pour assurer la cohérence des titres
    const labelStyle = "label-text font-bold text-emerald-900 text-xs uppercase tracking-wide";

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ZONE IMAGE */}
            <div className="w-full flex justify-center mb-4">
                <div className="relative group cursor-pointer w-full max-w-xs h-40 bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                    {formData.picture ? (
                        <img src={formData.picture} alt="Aperçu" className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-gray-400 text-xs text-center px-2">
                            <p>📸</p>
                            <p>Cliquez pour ajouter une photo</p>
                        </div>
                    )}
                    
                    {/* Overlay Modifier (visible au survol) */}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white text-xs font-bold">Modifier</span>
                    </div>

                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Input label="Marque" name="brand" value={formData.brand} onChange={handleChange} required />
                <Input label="Modèle" name="model" value={formData.model} onChange={handleChange} required />
            </div>
            
            <Input label="Plaque d'immatriculation" name="licensePlate" value={formData.licensePlate} onChange={handleChange} required />
            
            <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                    {/* ICI : J'ai appliqué le style 'labelStyle' (text-emerald-900) au lieu de ton style par défaut blanc */}
                    <label className="label pt-0 justify-start">
                        <span className={labelStyle}>Places</span>
                    </label>
                    {/* Le select reste exactement comme le tien */}
                    <select name="numberOfSeat" value={formData.numberOfSeat} onChange={handleChange} className="select select-bordered w-full">
                        <option value="2">2</option><option value="4">4</option><option value="5">5</option><option value="7">7</option>
                    </select>
                </div>
                <div className="form-control">
                    {/* ICI : Pareil pour Moteur */}
                    <label className="label pt-0 justify-start">
                        <span className={labelStyle}>Moteur</span>
                    </label>
                    {/* Le select reste exactement comme le tien */}
                    <select name="engine" value={formData.engine} onChange={handleChange} className="select select-bordered w-full">
                        <option value="Electrique">Electrique</option><option value="Hybride">Hybride</option><option value="Essence">Essence</option><option value="Diesel">Diesel</option>
                    </select>
                </div>
            </div>

            {/* Dates (Optionnelles à la création ?) */}
            <div className="grid grid-cols-2 gap-4 pt-2">
                 <Input label="Date d'achat" type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} />
                 <Input label="Fin Assurance" type="date" name="insurance" value={formData.insurance} onChange={handleChange} />
            </div>

            <div className="pt-4 flex gap-3 justify-end border-t border-gray-100 mt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                    {isEditMode ? "Enregistrer les modifications" : "Ajouter le véhicule"}
                </Button>
            </div>
        </form>
    );
};

export default CarForm;