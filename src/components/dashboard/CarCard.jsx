import React from 'react';
import Button from '../ui/Button';

const CarCard = ({ car, onToggleStatus, onSetFavorite, onDetail }) => {
    return (
        <div className={`bg-white p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row gap-5 items-center transition-all ${car.isActive ? 'border-gray-100 hover:shadow-md' : 'border-gray-200 bg-gray-50 opacity-75'}`}>

            {/* Image avec Étoile */}
            <div className="w-full sm:w-32 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative group">
                <img
                    src={car.picture}
                    alt={car.model}
                    className={`w-full h-full object-cover ${!car.isActive && 'grayscale opacity-70'}`}
                    onError={(e) => e.target.src = "https://placehold.co/300x200?text=Voiture"}
                />

                <button 
                    onClick={(e) => { e.stopPropagation(); onSetFavorite(car.id); }}
                    className="absolute top-2 right-2 transition-transform hover:scale-110 focus:outline-none drop-shadow-md z-10"
                    title="Définir comme favori"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={`w-6 h-6 ${car.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'fill-transparent text-white stroke-2'}`} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                </button>
            </div>

            {/* Infos */}
            <div className="flex-1 w-full text-center sm:text-left space-y-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <h4 className={`font-bold text-lg ${car.isActive ? 'text-gray-800' : 'text-gray-500'}`}>{car.brand} {car.model}</h4>
                    <span className={`badge ${car.isActive ? 'badge-success text-white' : 'badge-ghost'} badge-xs`}>{car.isActive ? 'Actif' : 'Archivé'}</span>
                    {car.isFavorite && <span className="text-xs text-yellow-500 font-bold flex items-center gap-1">★ Favori</span>}
                </div>
                <div className="text-sm text-gray-500 font-mono bg-white inline-block px-2 py-0.5 rounded border border-gray-200">{car.licensePlate}</div>
                <div className="text-xs text-gray-400 flex items-center justify-center sm:justify-start gap-3 mt-1">
                    <span> Moteur: {car.engine || 'N/A'}</span>
                    <span> {car.numberOfSeat} places</span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 w-full sm:w-auto justify-center px-4">
                <div className="flex flex-col items-center gap-1">
                    <input type="checkbox" className={`toggle toggle-sm ${car.isActive ? 'toggle-success' : 'bg-gray-200 border-gray-300 hover:bg-gray-300'}`} checked={car.isActive} onChange={() => onToggleStatus(car)} />
                </div>
                <Button variant="secondary" className="btn-sm" onClick={() => onDetail(car)}>Détails</Button>
            </div>
        </div>
    );
};

export default CarCard;