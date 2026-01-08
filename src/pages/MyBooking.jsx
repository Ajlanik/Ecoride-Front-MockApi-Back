// src/pages/MyBooking.jsx
import React, { useState, useEffect } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { BookingService } from '../services/bookingService';

import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import RideDetailPopup from '../components/dashboard/RideDetailPopup';
import { Calendar } from 'lucide-react';

export default function MyBooking() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);

    useEffect(() => {
        const fetchBookings = async () => {
            if (user?.id) {
                try {
                    const data = await BookingService.getAll(user.id);
                    setBookings(data.reverse());
                } catch (error) {
                    console.error("Erreur chargement bookings", error);
                }
            }
            setLoading(false);
        };
        fetchBookings();
    }, [user?.id]);

    const handleCancel = async (id) => {
        if (window.confirm("Voulez-vous vraiment annuler cette réservation ?")) {
            try {
                await BookingService.updateStatus(id, 'CANCELLED');
                setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
            } catch (e) {
                alert("Impossible d'annuler pour le moment.");
            }
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ACCEPTED': return 'Confirmé';
            case 'CANCELLED': return 'Annulé';
            case 'REJECTED': return 'Refusé';
            case 'COMPLETED': return 'Terminé';
            case 'PENDING': return 'En attente';
            default: return status;
        }
    };

    const getStatusType = (status) => {
        switch (status) {
            case 'ACCEPTED': return 'success';
            case 'COMPLETED': return 'neutral';
            case 'CANCELLED':
            case 'REJECTED': return 'error';
            default: return 'warning';
        }
    };

    if (loading) return <MainLayout><Loader text="Chargement de vos réservations..." /></MainLayout>;

    return (
        <MainLayout>
            <div className="space-y-6 animate-fade-in">
                <div className="border-b border-gray-100 pb-6">
                    <h1 className="text-3xl font-bold text-white">Mes Réservations</h1>
                    <p className="text-emerald-100 opacity-80 mt-1">Retrouvez ici vos trajets en tant que passager.</p>
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
                            const safeDate = booking.dateDisplay ? new Date(booking.dateDisplay) : null;

                            return (
                                <Card
                                    key={booking.id}
                                    className="flex flex-col justify-between h-full hover:shadow-xl transition-shadow border-t-4 border-t-emerald-500"
                                >
                                    <div className="p-5 pb-0">
                                        {/* En-tête : Date & Statut */}
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

                                        {/* Trajet : Pickup & Dropoff */}
                                        <div className="relative pl-4 border-l-2 border-gray-200 space-y-6 my-6">
                                            {/* PICKUP */}
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-1 ring-gray-200"></div>
                                                <p className="font-semibold text-gray-800 line-clamp-2" title={booking.pickupAddress}>
                                                    {booking.pickupAddress}
                                                </p>
                                                <span className="text-[10px] text-emerald-600 font-bold uppercase">Départ</span>
                                            </div>

                                            {/* DROPOFF */}
                                            <div className="relative">
                                                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-200"></div>
                                                <p className="font-semibold text-gray-800 line-clamp-2" title={booking.dropoffAddress}>
                                                    {booking.dropoffAddress}
                                                </p>
                                                <span className="text-[10px] text-gray-500 font-bold uppercase">Arrivée</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pied de carte : Conducteur & Actions */}
                                    <div className="bg-gray-50 p-4 rounded-b-[1.5rem] border-t border-gray-100">
                                        <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={booking.driverAvatar}
                                                    alt={booking.driverName}
                                                    size="sm"
                                                />
                                                <span className="font-medium">{booking.driverName}</span>
                                            </div>
                                            <div className="text-xl font-bold text-emerald-700">
                                                {booking.totalPriceDisplay} €
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button
                                                variant="secondary"
                                                className="flex-1 btn-sm bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
                                                onClick={() => setSelectedBooking(booking)}
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

                {selectedBooking && (
                    <RideDetailPopup
                        ride={{
                            ...selectedBooking.carRide,
                            id: selectedBooking.carRideId,
                            driver: selectedBooking.carRide?.driver,
                            bookingId: selectedBooking.id,
                            rideStatus: selectedBooking.carRide?.status,
                            status: selectedBooking.status,
                            hasAuthUserRated: selectedBooking.hasAuthUserRated
                        }}
                        car={selectedBooking.carRide?.car}
                        mode="view"
                        onClose={() => setSelectedBooking(null)}
                    />
                )}
            </div>
        </MainLayout>
    );
}