// EcorideAKNProd/EcorideAKNProd/src/hooks/useRideSearch.js
import { useState, useEffect } from 'react';
import { RideService } from '../services/rideService';

export const useRideSearch = (searchParams) => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            setError(false);
            try {
                const filters = {
                    departurePlace: searchParams.get('from'),
                    arrivalPlace: searchParams.get('to'),
                    departureDate: searchParams.get('date'),
                };
                const rides = await RideService.search(filters);
                setResults(rides);
            } catch (err) {
                console.error(err);
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        
        fetchResults();
    }, [searchParams]);

    return { results, loading, error };
};