// EcorideAKNProd/EcorideAKNProd/src/hooks/useCars.js

import { useState, useEffect, useCallback } from 'react';
import { CarService } from '../services/carService';
import { useToast } from '../contexts/ToastContext';

export const useCars = (userId, user) => {
    const { triggerToast } = useToast();
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);

    // Si userId n'est pas passé, on prend celui du user connecté
    const targetUserId = userId || user?.id;

    const fetchCars = useCallback(async () => {
        if (!targetUserId) return;
        setLoading(true);
        try {
            const data = await CarService.getAll({ userId: targetUserId });
            setCars(data);
        } catch (error) {
            console.error(error);
            triggerToast("Erreur chargement véhicules.", "error");
        } finally {
            setLoading(false);
        }
    }, [targetUserId, triggerToast]);

    useEffect(() => {
        fetchCars();
    }, [fetchCars]);

    const addCar = async (formData) => {
        if (!user || !user.id) {
            triggerToast("Erreur : Vous devez être connecté.", "error");
            return false;
        }
        try {
            const payload = { ...formData, numberOfSeat: parseInt(formData.numberOfSeat, 10), userId: user.id };
            await CarService.create(payload);
            await fetchCars();
            return true;
        } catch (error) {
            console.error("Erreur création:", error);
            triggerToast("Erreur lors de la création", "error");
            return false;
        }
    };

    const updateCar = async (carId, formData) => {
        try {
            await CarService.update(carId, formData);
            triggerToast("Véhicule mis à jour.", "success");
            await fetchCars();
            return true;
        } catch (error) {
            triggerToast("Erreur lors de la modification.", "error");
            return false;
        }
    };

    const toggleCarStatus = async (car) => {
        const newStatus = !car.isActive;
        // Optimistic UI
        setCars(prev => prev.map(c => c.id === car.id ? { ...c, isActive: newStatus } : c));
        try {
            await CarService.update(car.id, { isActive: newStatus });
            triggerToast(newStatus ? "Véhicule visible." : "Véhicule masqué.", "info");
        } catch (error) {
            triggerToast("Erreur de mise à jour.", "error");
            fetchCars(); // Revert
        }
    };

    const setCarFavorite = async (carId) => {
        try {
            await CarService.setFavorite(carId);
            triggerToast("Véhicule défini comme favori.", "success");
            setCars(prev => prev.map(c => ({ ...c, isFavorite: c.id === carId })));
        } catch (error) {
            triggerToast("Erreur lors de la définition du favori.", "error");
        }
    };

    return { cars, loading, addCar, updateCar, toggleCarStatus, setCarFavorite, refreshCars: fetchCars };
};