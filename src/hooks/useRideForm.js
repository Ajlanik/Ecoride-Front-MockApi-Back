// EcorideAKNProd/EcorideAKNProd/src/hooks/UseRideForm.js

import { useState, useCallback, useMemo } from 'react';
import { RideService } from '../services/rideService';
import { useToast } from '../contexts/ToastContext';

const INITIAL_STATE = {
    departurePlace: '', arrivalPlace: '', startLat: null, startLon: null, endLat: null, endLon: null,
    departureDate: '', departureTime: '', price: '', seatsTotal: 1, carId: '',
    description: '', promoCode: '', allowDetour: true, isRecurring: false,
    distance: 0, duration: 0, geometry: null,
    recurrenceDays: [], recurrenceEndDate: ''
};

export const useRideForm = (user, onSuccess) => {
    const { triggerToast } = useToast();
    const [formData, setFormData] = useState(INITIAL_STATE);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAddressSelect = (type, place) => {
        if (!place) return;
        setFormData(prev => ({
            ...prev,
            [type === 'start' ? 'departurePlace' : 'arrivalPlace']: place.address,
            [type === 'start' ? 'startLat' : 'endLat']: place.lat,
            [type === 'start' ? 'startLon' : 'endLon']: place.lng,
        }));
    };

    const handleRouteCalculated = useCallback((routeData) => {
        if (!routeData) return;
        setFormData(prev => {
            const newDist = (routeData.totalDistance / 1000).toFixed(1);
            const newDur = Math.round(routeData.totalDuration / 60);
            if (prev.distance === newDist && prev.duration === newDur && prev.geometry) return prev;
            return { ...prev, distance: newDist, duration: newDur, geometry: routeData.geometry };
        });
    }, []);

    const handleRecurrenceDayChange = (day) => {
        setFormData(prev => {
            const days = prev.recurrenceDays.includes(day)
                ? prev.recurrenceDays.filter(d => d !== day)
                : [...prev.recurrenceDays, day];
            return { ...prev, recurrenceDays: days };
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.geometry) { triggerToast("Veuillez attendre le calcul de l'itinéraire.", "warning"); return; }
        if (!formData.carId) { triggerToast("Veuillez choisir un véhicule.", "warning"); return; }

        setIsSubmitting(true);
        try {
            await RideService.create({
                ...formData, userId: user.id, carId: String(formData.carId),
                seatsTotal: parseInt(formData.seatsTotal, 10), price: parseFloat(formData.price)
            });
            triggerToast("Trajet publié !", "success");
            setFormData(INITIAL_STATE);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            triggerToast("Erreur lors de la publication.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const mapStartCoords = useMemo(() => (
        formData.startLat ? { lat: formData.startLat, lng: formData.startLon } : null
    ), [formData.startLat, formData.startLon]);

    const mapEndCoords = useMemo(() => (
        formData.endLat ? { lat: formData.endLat, lng: formData.endLon } : null
    ), [formData.endLat, formData.endLon]);

    return {
        formData,
        isSubmitting,
        handleChange,
        handleAddressSelect,
        handleRouteCalculated,
        handleRecurrenceDayChange,
        handleSubmit,
        mapStartCoords,
        mapEndCoords
    };
};