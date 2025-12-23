import React, { useState } from 'react';
import { User, CarFront } from 'lucide-react';

const Avatar = ({ src, alt, type = "user", size = "md", className = "" }) => {
    const [imgError, setImgError] = useState(false);

    // Définition des tailles
    const sizes = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16",
        xl: "w-24 h-24",
        full: "w-full h-full"
    };

    // Taille d'icône proportionnelle
    const iconSizes = {
        sm: "w-4 h-4",
        md: "w-6 h-6",
        lg: "w-8 h-8",
        xl: "w-10 h-10",
        full: "w-10 h-10"
    };

    const shape = type === "user" ? "rounded-full" : "rounded-xl";

    // Si pas d'image ou erreur de chargement -> Fallback Icône
    if (!src || imgError) {
        return (
            <div className={`${sizes[size]} ${shape} bg-gray-100 text-gray-400 flex items-center justify-center border border-gray-200 shrink-0 ${className}`}>
                {type === "user" ? (
                    <User className={iconSizes[size]} />
                ) : (
                    <CarFront className={iconSizes[size]} />
                )}
            </div>
        );
    }

    return (
        <img 
            src={src} 
            alt={alt || "Avatar"} 
            className={`${sizes[size]} ${shape} object-cover border border-gray-100 bg-gray-50 shrink-0 ${className}`}
            onError={() => setImgError(true)}
        />
    );
};

export default Avatar;