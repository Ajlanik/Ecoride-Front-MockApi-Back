// components/ui/Avatar.jsx
// pour afficher un avatar utilisateur ou une image de véhicule avec des tailles et formes personnalisables

import React, { useState } from 'react';

const Avatar = ({ src, alt, type = "user", size = "md", className = "" }) => {
    const [imgError, setImgError] = useState(false);

    // Définition des tailles
    const sizes = {
        sm: "w-8 h-8 text-xs",
        md: "w-12 h-12 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-24 h-24 text-3xl",
        full: "w-full h-full"
    };

    // Forme : Rond pour user, Carré arrondi pour voiture
    const shape = type === "user" ? "rounded-full" : "rounded-xl";

    // Si pas d'image ou erreur de chargement
    if (!src || imgError) {
        return (
            <div className={`${sizes[size]} ${shape} bg-gray-100 text-gray-400 flex items-center justify-center border border-gray-200 shrink-0 ${className}`}>
                {/* Icône par défaut selon le type */}
                {type === "user" ? (
                    <span className="font-bold">?</span> // Ou une icône SVG User
                ) : (
                    <span>🚗</span>
                )}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt || "Avatar"}
            className={`${sizes[size]} ${shape} object-cover border border-gray-200 bg-white ${className}`}
            onError={() => setImgError(true)}
        />
    );
};

export default Avatar;