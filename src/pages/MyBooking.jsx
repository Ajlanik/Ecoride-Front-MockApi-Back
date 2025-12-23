// src/pages/MyBooking.jsx

import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { BookingService } from '../services/bookingService';
import { CarService } from '../services/carService'; // Pour récupérer l'image de la voiture si besoin

// UI Components
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import RideDetailPopup from '../components/dashboard/RideDetailPopup'; // <--- Import du Popup
import { Calendar, Euro, User } from 'lucide-react'; // Icônes basiques pour la lisibilité

export default function MyBooking() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    // État pour gérer l'ouverture du popup détail
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [associatedCar, setAssociatedCar] = useState(null); // Pour afficher la voiture dans le détail

    // 1. Chargement des réservations au montage
    useEffect(() => {
        const fetchBookings = async () => {
            if (user) {
                // BookingService.getAll récupère déjà les noms des villes (Paris/Lyon)
                const data = await BookingService.getAll(user.id);
                setBookings(data);
            }
            setLoading(false);
        };
        fetchBookings();
    }, [user]);

    // 2. Gestion de l'annulation
    const handleCancel = async (id) => {
        if(window.confirm("Voulez-vous vraiment annuler cette réservation ?")) {
            try {
                await BookingService.cancel(id);
                // Mise à jour locale pour éviter de recharger la page
                setBookings(prev => prev.map(b => 
                    b.id === id ? { ...b, status: 'CANCELLED' } : b
                ));
            } catch (e) {
                console.error("Erreur annulation", e);
                alert("Impossible d'annuler pour le moment.");
            }
        }
    };

    // 3. Gestion de l'ouverture du détail
    const handleOpenDetail = async (booking) => {
        // On prépare les données.
        // On essaie de charger la voiture si on a un carId dans le booking
        if (booking.carId) {
            try {
                const car = await CarService.getById(booking.carId);
                setAssociatedCar(car);
            } catch (e) {
                setAssociatedCar(null);
            }
        } else {
            setAssociatedCar(null);
        }
        setSelectedBooking(booking);
    };

    if (loading) return <MainLayout><Loader text="Chargement de vos billets..." /></MainLayout>;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                
                {/* En-tête */}
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Mes Réservations</h1>
                        <p className="text-emerald-100 opacity-80 mt-1">Retrouvez ici vos trajets en tant que passager.</p>
                    </div>
                </div>

                {/* Contenu : Liste des cartes */}
                {bookings.length === 0 ? (
                    <EmptyState 
                        message="Vous n'avez aucune réservation en cours." 
                        actionLabel="Rechercher un trajet"
                        onAction={() => window.location.href = '/'}
                        icon={<Calendar className="w-10 h-10 text-gray-300"/>}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => (
                            <Card key={booking.id} className="flex flex-col justify-between h-full hover:shadow-xl transition-shadow border-t-4 border-t-emerald-500">
                                
                                {/* --- Header Carte : Date et Statut --- */}
                                <div className="p-5 pb-0">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            {/* Affichage de l'heure et la date */}
                                            {/* Note: booking.dateDisplay contient "YYYY-MM-DDTHH:MM" */}
                                            <span className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                                {booking.dateDisplay ? new Date(booking.dateDisplay).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                            </span>
                                            <span className="text-sm text-gray-500 capitalize">
                                                {booking.dateDisplay ? new Date(booking.dateDisplay).toLocaleDateString([], {weekday: 'long', day: 'numeric', month: 'long'}) : 'Date inconnue'}
                                            </span>
                                        </div>
                                        <StatusBadge type={
                                            booking.status === 'ACCEPTED' ? 'success' : 
                                            booking.status === 'CANCELLED' ? 'error' : 'warning'
                                        }>
                                            {booking.status === 'ACCEPTED' ? 'Confirmé' : 
                                             booking.status === 'CANCELLED' ? 'Annulé' : 'En attente'}
                                        </StatusBadge>
                                    </div>

                                    {/* --- Itinéraire Visuel --- */}
                                    <div className="relative pl-4 border-l-2 border-gray-200 space-y-6 my-6">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-gray-200"></div>
                                            <p className="font-semibold text-gray-800 text-sm">{booking.departurePlace}</p>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-200"></div>
                                            <p className="font-semibold text-gray-800 text-sm">{booking.arrivalPlace}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Footer & Actions (C'est ici qu'on corrige les boutons) --- */}
                                <div className="bg-gray-50 p-4 rounded-b-[1.5rem] border-t border-gray-100">
                                    <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span>{booking.driverName || "Conducteur"}</span>
                                        </div>
                                        <div className="flex items-center gap-1 font-bold text-emerald-700">
                                            <Euro className="w-4 h-4" />
                                            <span>{booking.price} €</span>
                                        </div>
                                    </div>

                                    {/* Groupe de boutons */}
                                    <div className="flex gap-2">
                                        {/* Bouton Détail */}
                                        <Button 
                                            variant="secondary" 
                                            className="flex-1 btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                            onClick={() => handleOpenDetail(booking)}
                                        >
                                            Détails
                                        </Button>

                                        {/* Bouton Annuler (Visible uniquement si pas déjà annulé) */}
                                        {booking.status !== 'CANCELLED' && (
                                            <Button 
                                                variant="danger" 
                                                className="flex-1 btn-sm bg-white border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 shadow-sm"
                                                onClick={() => handleCancel(booking.id)}
                                            >
                                                Annuler
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* --- POPUP DÉTAIL --- */}
                {selectedBooking && (
                    <RideDetailPopup 
                        // On doit adapter l'objet booking pour qu'il ressemble à un objet "Ride" 
                        // complet attendu par le Popup (notamment pour les coordonnées GPS)
                        ride={{
                            ...selectedBooking,
                            departureDate: selectedBooking.dateDisplay, // On mappe la date pour le popup
                            // Si BookingService.getAll a bien fait son travail, 
                            // startLat, startLon, etc. sont déjà dans selectedBooking
                        }}
                        car={associatedCar}
                        mode="view" // Mode lecture seule (pas de bouton réserver)
                        onClose={() => setSelectedBooking(null)}
                    />
                )}

            </div>
        </MainLayout>
    );
}