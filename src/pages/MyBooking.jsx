import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { BookingService } from '../services/bookingService';
import { CarService } from '../services/carService';

import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import RideDetailPopup from '../components/dashboard/RideDetailPopup';
import { Calendar, User } from 'lucide-react';

export default function MyBooking() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedBooking, setSelectedBooking] = useState(null);
    const [associatedCar, setAssociatedCar] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            if (user) {
                const data = await BookingService.getAll(user.id);

                // On trie pour voir les plus récents en premier
                setBookings(data.reverse());
            }
            setLoading(false);
        };
        fetchBookings();
    }, [user]);

    // --- APPEL API POUR L'ANNULATION ---
    const handleCancel = async (id) => {
        if (window.confirm("Voulez-vous vraiment annuler cette réservation ?")) {
            try {
                await BookingService.updateStatus(id, 'CANCELLED');

                setBookings(prev => prev.map(b =>
                    b.id === id ? { ...b, status: 'CANCELLED' } : b
                ));
            } catch (e) {
                console.error("Erreur annulation", e);
                alert("Impossible d'annuler pour le moment.");
            }
        }
    };

    const handleOpenDetail = async (booking) => {
        if (booking.carId) {
            try {
                const car = await CarService.getById(booking.carId);
                setAssociatedCar(car);
            } catch (e) {
                setAssociatedCar(null);
            }
        }
        setSelectedBooking(booking);
    };

    // Petit helper pour le texte du badge
    const getStatusLabel = (status) => {
        switch (status) {
            case 'ACCEPTED': return 'Confirmé';
            case 'CANCELLED': return 'Annulé';
            case 'REJECTED': return 'Refusé';
            case 'COMPLETED': return 'Terminé';
            case 'PENDING': return 'En attente';
            default: return 'En attente';
        }
    };

    // Petit helper pour la couleur du badge
    const getStatusType = (status) => {
        switch (status) {
            case 'ACCEPTED': return 'success';
            case 'COMPLETED': return 'neutral';
            case 'CANCELLED':
            case 'REJECTED': return 'error';
            default: return 'warning';
        }
    };

    if (loading) return <MainLayout><Loader text="Chargement de vos billets..." /></MainLayout>;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-white">Mes Réservations</h1>
                        <p className="text-emerald-100 opacity-80 mt-1">Retrouvez ici vos trajets en tant que passager.</p>
                    </div>
                </div>

                {bookings.length === 0 ? (
                    <EmptyState
                        message="Vous n'avez aucune réservation en cours."
                        actionLabel="Rechercher un trajet"
                        onAction={() => window.location.href = '/'}
                        icon={<Calendar className="w-10 h-10 text-gray-300" />}
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {bookings.map((booking) => {
                            // ---------------------------------------------------------------------
                            // Nom du chauffeur :
                            // - Si l'API renvoie déjà driverName, on l'affiche.
                            // - Sinon, fallback basé sur driverUserId (enrichi via BookingService).
                            // IMPORTANT : booking.userId = passager, pas conducteur.
                            // ---------------------------------------------------------------------
                            const driverDisplayName =
                                booking.driverName ||
                                (booking.driverUserId ? `Utilisateur #${booking.driverUserId}` : 'Chauffeur');

                            const safeDate = booking.dateDisplay ? new Date(booking.dateDisplay) : null;

                            return (
                                <Card
                                    key={booking.id}
                                    className="flex flex-col justify-between h-full hover:shadow-xl transition-shadow border-t-4 border-t-emerald-500"
                                >
                                    <div className="p-5 pb-0">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                                    {safeDate ? safeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </span>
                                                <span className="text-sm text-gray-500 capitalize">
                                                    {safeDate ? safeDate.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }) : 'Date inconnue'}
                                                </span>
                                            </div>

                                            <StatusBadge type={getStatusType(booking.status)}>
                                                {getStatusLabel(booking.status)}
                                            </StatusBadge>
                                        </div>

                                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-6 my-6">
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-gray-200"></div>
                                                <p className="font-semibold text-gray-800">{booking.departurePlace || 'Départ'}</p>
                                            </div>
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-200"></div>
                                                <p className="font-semibold text-gray-800">{booking.arrivalPlace || 'Arrivée'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-b-[1.5rem] border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <span>{driverDisplayName}</span>
                                            </div>

                                            <div className="text-xl font-bold text-emerald-700">
                                                {booking.totalPriceDisplay ?? '--'} €
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                className="flex-1 btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                                onClick={() => handleOpenDetail(booking)}
                                            >
                                                Détails
                                            </Button>

                                            {booking.status !== 'CANCELLED' && booking.status !== 'REJECTED' && booking.status !== 'COMPLETED' && (
                                                <Button
                                                    className="flex-1 btn-sm btn-outline btn-error hover:!text-white"
                                                    onClick={() => handleCancel(booking.id)}
                                                >
                                                    Annuler
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Popup Détail */}
                {selectedBooking && (
                    <RideDetailPopup
                        ride={{
                            ...selectedBooking,

                            // RideDetailPopup attend l'id du trajet dans "id"
                            id: selectedBooking.carRideId,

                            // Booking id pour les actions (finish passenger / review)
                            bookingId: selectedBooking.id,

                            // Status du trajet (enrichi via BookingService)
                            rideStatus: selectedBooking.rideStatus,

                            // IMPORTANT : conducteur = driverUserId (pas userId passager)
                            userId: selectedBooking.driverUserId,
                        }}
                        car={associatedCar}
                        mode="view"
                        onClose={() => setSelectedBooking(null)}
                    />
                )}
            </div>
        </MainLayout>
    );
}
