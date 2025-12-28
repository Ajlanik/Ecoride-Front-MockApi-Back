import React from 'react';
import Button from '../ui/Button';

const CarCard = ({ car, onToggleStatus, onSetFavorite, onDetail }) => {
    return (
        <div className={`
            bg-white p-4 rounded-2xl shadow-sm border flex flex-col sm:flex-row gap-5 items-center transition-all 
            ${car.isActive ? 'border-gray-100 hover:shadow-md' : 'border-gray-200 bg-gray-50/80 opacity-80'}
        `}>

            {/* Image Voiture */}
            <div className="w-full sm:w-32 h-24 flex-shrink-0 bg-gray-100 rounded-xl overflow-hidden relative group">
                <img
                    src={car.picture}
                    alt={`${car.brand} ${car.model}`}
                    className={`w-full h-full object-cover transition-opacity ${!car.isActive && 'grayscale'}`}
                    onError={(e) => e.target.src = "https://placehold.co/300x200?text=Voiture"} // Fallback image
                />

                {/* Bouton Favori (Overlay) */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSetFavorite(car.id);
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-white/40 backdrop-blur-md rounded-full hover:bg-white/60 transition-all shadow-sm text-[10px] font-bold"
                    title="Définir comme favori"
                >
                    {car.isFavorite ? 'Favori' : 'Mettre en favori'}
                </button>
            </div>

            {/* Informations */}
            <div className="flex-1 text-center sm:text-left min-w-0 space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                    <h3 className="font-bold text-lg text-gray-800 truncate">
                        {car.brand} {car.model}
                    </h3>
                    {car.isFavorite && (
                        <span className="badge badge-xs badge-warning text-[10px] font-bold text-yellow-900">
                            Favori
                        </span>
                    )}
                </div>
                
                <div className="text-sm text-gray-500 font-mono bg-gray-50 inline-block px-2 py-0.5 rounded border border-gray-200">
                    {car.licensePlate}
                </div>
                
                <div className="text-xs text-gray-400 flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        {car.engine}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-md">
                        {car.numberOfSeat} places
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center gap-3 w-full sm:w-auto px-2 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 pl-4">
                
                {/* Toggle Visibilité */}
                <button 
                    onClick={() => onToggleStatus(car)}
                    className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${car.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}
                >
                    {car.isActive ? 'Visible' : 'Masqué'}
                </button>
                
                <Button 
                    variant="secondary" 
                    className="btn-sm w-full" 
                    onClick={() => onDetail(car)}
                >
                    Modifier
                </Button>
            </div>
        </div>
    );
};

export default CarCard;