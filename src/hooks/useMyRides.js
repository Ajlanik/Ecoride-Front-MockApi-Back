// EcorideAKNProd/EcorideAKNProd/src/hooks/useMyRides.js

import { useState, useEffect, useCallback } from 'react';
import { RideService } from '../services/rideService';
import { CarService } from '../services/carService';
import { useToast } from '../contexts/ToastContext';

export const useMyRides = (user) => {
    const { triggerToast } = useToast();
    const [rides, setRides] = useState([]);
    const [cars, setCars] = useState([]); // Besoin des voitures pour l'affichage
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        if (!user?.id) return;
        setLoading(true);
        try {
            const [myRides, myCars] = await Promise.all([
                RideService.getAll({ userId: user.id }),
                CarService.getAll({ userId: user.id })
            ]);
            setRides(myRides); // Le tri est déjà fait dans le service maintenant
            setCars(myCars);
        } catch (error) {
            console.error(error);
            triggerToast("Impossible de charger les trajets.", "error");
        } finally {
            setLoading(false);
        }
    }, [user?.id, triggerToast]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const deleteRide = async (rideId) => {
        try {
            await RideService.delete(rideId);
            setRides(prev => prev.filter(r => r.id !== rideId));
            triggerToast("Trajet annulé.", "info");
        } catch (error) {
            console.error(error);
            triggerToast("Erreur annulation.", "error");
        }
    };

    return { rides, cars, loading, deleteRide, refreshRides: loadData };
};