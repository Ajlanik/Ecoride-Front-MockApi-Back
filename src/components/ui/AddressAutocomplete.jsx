import React, { useState, useEffect, useRef } from 'react';

// Composant d'autocomplétion d'adresse via OpenStreetMap (Nominatim)
const AddressAutocomplete = ({ label, placeholder, onSelect, required, initialValue = "" }) => {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    // Pour gérer le délai de frappe (debounce)
    const debounceTimeout = useRef(null);
    const wrapperRef = useRef(null);

    // Fermer la liste si on clique en dehors
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        
        if (value.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);

        debounceTimeout.current = setTimeout(async () => {
            setIsLoading(true);
            try {
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

    const handleSelect = (place) => {
        const displayName = place.display_name;
        
        setQuery(displayName);
        setShowSuggestions(false);
        
        // --- CORRECTION CRITIQUE ICI ---
        if (onSelect) {
            onSelect({
                address: displayName,
                lat: parseFloat(place.lat),
                lng: parseFloat(place.lon) // ON LIT 'lon' (API) ET ON LE MET DANS 'lng' (APP)
            });
        }
    };

    return (
        <div className="form-control w-full relative" ref={wrapperRef}>
            {label && (
                <label className="label pt-0 pb-2 justify-start">
                    <span className="label-text font-bold text-emerald-900 text-xs uppercase tracking-wide">
                        {label}
                    </span>
                </label>
            )}
            
            <input
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder={placeholder}
                required={required}
                className="input input-bordered w-full px-4 h-12 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all border-gray-300"
            />

            {isLoading && (
                <div className="absolute right-3 top-[38px] loading loading-spinner loading-sm text-emerald-500"></div>
            )}

            {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 left-0 right-0 top-[75px] bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {suggestions.map((place) => (
                        <li 
                            key={place.place_id}
                            onClick={() => handleSelect(place)}
                            className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-none transition-colors text-sm text-gray-700 flex flex-col"
                        >
                            <span className="font-bold text-emerald-900">
                                {place.address.road || place.address.city || place.address.town || place.address.village || ""} 
                            </span>
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