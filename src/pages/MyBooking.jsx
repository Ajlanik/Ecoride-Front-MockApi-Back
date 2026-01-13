// src/pages/MyBooking.jsx
import React, { useState } from 'react';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';
import { useMyBookings } from '../hooks/useMyBookings'; // On utilise ton hook

import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Loader from '../components/ui/Loader';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import RideDetailPopup from '../components/dashboard/RideDetailPopup';
import { Calendar, History, Clock, MapPin } from 'lucide-react';

export default function MyBooking() {
    const { user } = useAuth();

    //debug
    const { bookings, upcomingBookings, pastBookings, loading, cancelBooking, refreshBookings } = useMyBookings(user);

    const [selectedBooking, setSelectedBooking] = useState(null);

    const handleCancel = async (id) => {
        if (window.confirm("Voulez-vous vraiment annuler cette réservation ?")) {
            await cancelBooking(id);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case "ACCEPTED": return "Confirmé";
            case "CANCELLED": return "Annulé";
            case "REJECTED": return "Refusé";
            case "COMPLETED": return "Terminé";
            case "PENDING": return "En attente";
            default: return status;
        }
    };

    const getStatusType = (status) => {
        switch (status) {
            case "ACCEPTED": return "success";
            case "COMPLETED": return "neutral";
            case "CANCELLED":
            case "REJECTED": return "error";
            default: return "warning";
        }
    };


    const activeBooking = selectedBooking
        ? bookings.find(b => b.id === selectedBooking.id) || selectedBooking
        : null;
    //debug end


    if (loading) return <MainLayout><Loader text="Chargement de vos réservations..." /></MainLayout>;

    // compasant interne pour chaque carte de réservation
    const BookingCard = ({ booking }) => {
        const safeDate = booking.dateDisplay ? new Date(booking.dateDisplay) : null;
        return (
            <Card className="flex flex-col justify-between h-full hover:shadow-xl transition-shadow border-t-4 border-t-emerald-500">
                <div className="p-5 pb-0">
                    {/* Date & Statut */}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                                {safeDate ? safeDate.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) : "N/C"}
                            </span>
                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {safeDate ? safeDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--:--"}
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
                            <p className="font-semibold text-gray-800 line-clamp-2 text-sm" title={booking.pickupAddress}>
                                {booking.pickupAddress}
                            </p>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase">Départ</span>
                        </div>

                        {/* DROPOFF */}
                        <div className="relative">
                            <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-white ring-1 ring-gray-200"></div>
                            <p className="font-semibold text-gray-800 line-clamp-2 text-sm" title={booking.dropoffAddress}>
                                {booking.dropoffAddress}
                            </p>
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Arrivée</span>
                        </div>
                    </div>
                </div>

                {/* Conducteur & Actions */}
                <div className="bg-gray-50 p-4 rounded-b-[1.5rem] border-t border-gray-100 mt-auto">
                    <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-3">
                            <Avatar src={booking.driverAvatar} alt={booking.driverName} size="sm" />
                            <span className="font-medium truncate max-w-[100px]">{booking.driverName}</span>
                        </div>
                        <div className="text-lg font-bold text-emerald-700">
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

                        {booking.status !== "CANCELLED" && booking.status !== "REJECTED" && booking.status !== "COMPLETED" && (
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
    };

    return (
        <MainLayout>
            <div className="space-y-8 animate-fade-in p-4 max-w-7xl mx-auto">
                <div className="border-b border-gray-100 pb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Mes Réservations</h1>
                    <p className="text-gray-500 mt-1">Retrouvez ici vos trajets en tant que passager.</p>
                </div>

                {/* SECTION 1: À VENIR, TRAJETS FUTURS */}
                <section>
                    <h2 className="text-xl font-bold text-emerald-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-6 h-6" /> À venir
                    </h2>
                    {upcomingBookings.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-300">
                            <p className="text-gray-500">Aucun trajet prévu prochainement.</p>
                            <Button className="mt-4 bg-emerald-600 text-white" onClick={() => window.location.href = "/"}>
                                Rechercher un trajet
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingBookings.map(booking => (
                                <BookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    )}
                </section>

                {/* SECTION 2: HISTORIQUE */}
                {pastBookings.length > 0 && (
                    <section className="pt-8 border-t border-gray-100">
                        <h2 className="text-xl font-bold text-gray-500 mb-4 flex items-center gap-2">
                            <History className="w-6 h-6" /> Historique
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale-[30%] hover:grayscale-0 transition-all">
                            {pastBookings.map(booking => (
                                <BookingCard key={booking.id} booking={booking} />
                            ))}
                        </div>
                    </section>
                )}

                {/* POPUP DE DÉTAILS */}
                {selectedBooking && (
                    <RideDetailPopup
                    ride={{
                            ...activeBooking.carRide,
                            id: activeBooking.carRideId,
                            driver: activeBooking.carRide?.driver,
                            bookingId: activeBooking.id,
                            rideStatus: activeBooking.carRide?.status,
                            status: activeBooking.status, 
                            hasAuthUserRated: activeBooking.hasAuthUserRated,
                            passengerRoute: activeBooking.passengerRoute
                        }}
                        car={activeBooking.carRide?.car}
                        mode="view"
                        onClose={() => setSelectedBooking(null)}
                        
                        //  On passe la fonction de refresh 
                        onUpdate={() => refreshBookings(true)}


                        /*ride={{
                            // On injecte toutes les infos du trajet
                            ...selectedBooking.carRide,
                            // On s'assure que les IDs sont bons
                            id: selectedBooking.carRideId,
                            driver: selectedBooking.carRide?.driver,


                            bookingId: selectedBooking.id,

                            rideStatus: selectedBooking.carRide?.status,
                            status: selectedBooking.status,
                            hasAuthUserRated: selectedBooking.hasAuthUserRated, // Pour savoir si déjà noté
                            passengerRoute: selectedBooking.passengerRoute
                        }}
                        car={selectedBooking.carRide?.car}
                        mode="view"
                        onClose={() => setSelectedBooking(null)}*/
                    />
                )}
            </div>
        </MainLayout>
    );
}