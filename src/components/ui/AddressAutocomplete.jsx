import React, { useState, useEffect, useRef } from 'react';

// Composant d'autocomplétion d'adresse via OpenStreetMap (Nominatim)
// Permet à l'utilisateur de rechercher une adresse et de sélectionner une suggestion.
// Renvoie une adresse formatée courte (Rue, Ville, Pays) et les coordonnées GPS.
const AddressAutocomplete = ({ label, placeholder, onSelect, required, initialValue = "" }) => {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Références pour gérer le délai de frappe et la fermeture du menu
    const debounceTimeout = useRef(null);
    const wrapperRef = useRef(null);

    // Effet pour fermer la liste si on clique en dehors du composant
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Gestion de la saisie utilisateur avec délai
    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        
        // On ne cherche pas si moins de 3 caractères
        if (value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        // Appel API différé de 500ms pour éviter de spammer
        debounceTimeout.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                // On demande 'addressdetails=1' pour avoir les champs séparés (rue, ville, etc.)
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&addressdetails=1&limit=5`,
                    { headers: { "User-Agent": "EcoRideApp/1.0" } }
                );
                const data = await response.json();
                setSuggestions(data);
                setShowSuggestions(true);
            } catch (error) {
                console.error("Erreur recherche adresse:", error);
            } finally {
                setIsLoading(false);
            }
        }, 500);
    };

    // Sélection d'une adresse dans la liste
    const handleSelect = (place) => {
        // --- LOGIQUE DE FORMATAGE COURT ---
        // L'objet 'place.address' contient les détails (numéro, rue, ville, etc.)
        const addr = place.address;
        
        // On construit l'adresse proprement : "Numéro Rue, CodePostal Ville, Pays"
        // On utilise filter(Boolean) pour retirer les éléments vides ou indéfinis
        const streetPart = [addr.house_number, addr.road].filter(Boolean).join(' ');
        
        // Pour la ville, l'API peut renvoyer 'city', 'town' ou 'village' selon la taille
        const cityPart = [addr.postcode, addr.city || addr.town || addr.village].filter(Boolean).join(' ');
        const countryPart = addr.country;

        // On assemble le tout avec des virgules
        const shortAddress = [streetPart, cityPart, countryPart].filter(Boolean).join(', ');
        
        // Si jamais l'adresse construite est vide, on garde le nom complet par sécurité
        const finalAddress = shortAddress || place.display_name;
        
        // Mise à jour de l'affichage local
        setQuery(finalAddress);
        setShowSuggestions(false);
        
        // On renvoie les données formatées au parent
        if (onSelect) {
            onSelect({
                address: finalAddress, 
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon) // l'API renvoie 'lon', on standardise en 'lng'
            });
        }
    };

    return (
        <div className="form-control w-full relative" ref={wrapperRef}>
            {/* Label optionnel */}
            {label && (
                <label className="label pt-0 pb-2 justify-start">
                    <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">
                        {label}
                    </span>
                </label>
            )}
            
            {/* Champ de saisie */}
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
                required={required}
                className="input input-bordered w-full px-4 h-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all border-gray-300"
            />

            {/* Indicateur de chargement */}
            {isLoading && (
                <div className="absolute right-3 top-[38px] loading loading-spinner loading-sm text-emerald-500"></div>
            )}

            {/* Liste des suggestions */}
            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 top-[75px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((place) => (
                        <li 
                            key={place.place_id}
                            onClick={() => handleSelect(place)}
                            className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors text-sm text-gray-700 flex flex-col"
                        >
                            {/* On affiche la rue en gras  */}
                            <span className="font-bold text-emerald-900">
                                {place.address.road || place.address.city || place.address.town || ""} 
                            </span>
                            {/* Le reste de l'adresse en petit en dessous */}
                            <span className="text-xs text-gray-500 truncate">
                                {place.display_name}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AddressAutocomplete;