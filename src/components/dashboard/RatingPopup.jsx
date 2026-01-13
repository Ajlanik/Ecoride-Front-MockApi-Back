// src/components/dashboard/RatingPopup.jsx
import React, { useState } from 'react';
import Popup from '../ui/Popup';
import Button from '../ui/Button';
import { Star } from 'lucide-react'; //pour les icônes d'étoiles

//  On reçoit 'target' (objet) et 'isOpen' du parent

const RatingPopup = ({ isOpen, target, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [hoveredStar, setHoveredStar] = useState(0);
    const [isLoading, setIsLoading] = useState(false); //  On gère le chargement ici

    // Modif 3 : On extrait le nom proprement de l'objet target
    const targetName = target?.name || "l'utilisateur";

    const handleSubmit = async () => {
        if (rating === 0) return alert("Veuillez choisir une note.");
        
        setIsLoading(true);
        // On attend que le parent ait fini le traitement
        await onSubmit({ rating, comment });
        setIsLoading(false);
    };

    return (
        <Popup isOpen={isOpen} onClose={onClose} title={`Noter ${targetName}`}>
            <div className="flex flex-col items-center gap-6 p-4">
                
                {/* Étoiles */}
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredStar(star)}
                            onMouseLeave={() => setHoveredStar(0)}
                            onClick={() => setRating(star)}
                            className="transition-transform hover:scale-110 focus:outline-none"
                        >
                            <Star 
                                size={40} 
                                className={`${(hoveredStar || rating) >= star ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                            />
                        </button>
                    ))}
                </div>
                <p className="text-sm font-bold text-gray-500">
                    {rating === 5 ? "Parfait !" : rating === 4 ? "Très bien" : rating === 3 ? "Bien" : rating === 2 ? "Moyen" : rating === 1 ? "Mauvais" : "Sélectionnez une note"}
                </p>

                {/* Commentaire */}
                <textarea
                    className="textarea textarea-bordered w-full h-32 bg-gray-50 text-black"
                    placeholder={`Un petit mot sur votre trajet avec ${targetName}...`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                ></textarea>

                {/* Actions */}
                <div className="flex justify-end gap-3 w-full mt-2">
                    <Button variant="ghost" onClick={onClose} disabled={isLoading}>Annuler</Button>
                    <Button 
                        variant="primary" 
                        onClick={handleSubmit} 
                        className="bg-emerald-600 text-white" // Petit ajout de style :)
                        isLoading={isLoading} 
                        disabled={rating === 0 || isLoading}
                    >
                        Envoyer l'avis
                    </Button>
                </div>
            </div>
        </Popup>
    );
};

export default RatingPopup;