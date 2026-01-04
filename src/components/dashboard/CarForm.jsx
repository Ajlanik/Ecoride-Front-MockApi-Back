import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const CarForm = ({ initialData, onSubmit, onCancel, isLoading, isEditMode = false }) => {
    
    // Valeurs par défaut alignées avec le Mapper (Frontend Master)
    const defaultData = {
        brand: '', 
        model: '', 
        licensePlate: '', 
        numberOfSeat: '4', // String pour l'input select
        engine: 'Electrique', 
        picture: '', 
        purchaseDate: '', 
        insuranceDate: ''
    };

    const [formData, setFormData] = useState(defaultData);

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...defaultData,
                ...initialData,
                // On sécurise les dates pour l'input type="date"
                purchaseDate: initialData.purchaseDate ? initialData.purchaseDate.split('T')[0] : '',
                insuranceDate: initialData.insuranceDate ? initialData.insuranceDate.split('T')[0] : '',
                numberOfSeat: String(initialData.numberOfSeat || 4)
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData); // Le Service + Mapper s'occuperont du formatage API
    };

    const labelStyle = "label-text font-bold text-emerald-900 text-xs uppercase tracking-wide";

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Aperçu Image (Si URL valide) */}
            {formData.picture && (
                <div className="flex justify-center">
                    <img 
                        src={formData.picture} 
                        alt="Aperçu" 
                        className="h-32 w-full object-cover rounded-xl border border-gray-200 shadow-sm"
                        onError={(e) => e.target.style.display = 'none'} 
                    />
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <Input label="Marque" name="brand" placeholder="ex: Tesla" required value={formData.brand} onChange={handleChange} />
                <Input label="Modèle" name="model" placeholder="ex: Model 3" required value={formData.model} onChange={handleChange} />
            </div>

            <Input label="Immatriculation" name="licensePlate" placeholder="AA-123-BB" required value={formData.licensePlate} onChange={handleChange} />

            <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                    <label className="label pt-0 justify-start"><span className={labelStyle}>Places</span></label>
                    <select name="numberOfSeat" value={formData.numberOfSeat} onChange={handleChange} className="select select-bordered w-full focus:ring-emerald-500">
                        {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                            <option key={n} value={n}>{n} places</option>
                        ))}
                    </select>
                </div>
                <div className="form-control">
                    <label className="label pt-0 justify-start"><span className={labelStyle}>Motorisation</span></label>
                    <select name="engine" value={formData.engine} onChange={handleChange} className="select select-bordered w-full focus:ring-emerald-500">
                        <option value="Electrique">Electrique</option>
                        <option value="Hybride">Hybride</option>
                        <option value="Essence">Essence</option>
                        <option value="Diesel">Diesel</option>
                        <option value="GPL">GPL</option>
                    </select>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                 <Input label="Date d'achat" type="date" name="purchaseDate" value={formData.purchaseDate} onChange={handleChange} />
                 <Input label="Fin Assurance" type="date" name="insuranceDate" value={formData.insuranceDate} onChange={handleChange} />
            </div>

            {/* Note pour l'upload d'image */}
            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-2 text-xs text-blue-700">
                {/* Note : on garde un texte simple (pas d'icône) */}
                <p>Pour l'instant, l'image est gérée par URL. L'upload de fichiers sera activé avec le serveur.</p>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                    {isEditMode ? "Enregistrer" : "Ajouter ce véhicule"}
                </Button>
            </div>
        </form>
    );
};

export default CarForm;