// src/components/dashboard/RatingPopup.jsx
import React, { useState } from 'react';
import Popup from '../ui/Popup';
import Button from '../ui/Button';
import { Star } from 'lucide-react';

const RatingPopup = ({ targetName, onClose, onSubmit, isLoading }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoveredStar, setHoveredStar] = useState(0);

    const handleSubmit = () => {
        if (rating === 0) return alert("Veuillez choisir une note.");
        onSubmit({ rating, comment });
    };

    return (
        <Popup isOpen={true} onClose={onClose} title={`Noter ${targetName}`}>
            <div className="flex flex-col items-center gap-6 p-4">
                
                {/* Étoiles */}
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star 
                                size={40} 
                                className={`${(hoveredStar || rating) >= star ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
                            />
                        </button>
                    ))}
                </div>
                <p className="text-sm font-bold text-gray-500">
                    {rating === 5 ? "Parfait !" : rating === 4 ? "Très bien" : rating === 3 ? "Bien" : rating === 2 ? "Moyen" : rating === 1 ? "Mauvais" : "Sélectionnez une note"}
                </p>

                {/* Commentaire */}
                <textarea
                    className="textarea textarea-bordered w-full h-32"
                    placeholder={`Un petit mot sur votre trajet avec ${targetName}...`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                ></textarea>

                {/* Actions */}
                <div className="flex justify-end gap-3 w-full mt-2">
                    <Button variant="ghost" onClick={onClose}>Annuler</Button>
                    <Button variant="primary" onClick={handleSubmit} isLoading={isLoading} disabled={rating === 0}>
                        Envoyer l'avis
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default RatingPopup;