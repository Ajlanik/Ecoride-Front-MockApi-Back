// src/components/dashboard/RideDetailPopupPassengerView.jsx
import React from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import AddressAutocomplete from '../ui/AddressAutocomplete';

import { CheckCircle, Ticket, Tag, Info } from 'lucide-react';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { BookingService } from '../../services/bookingService';
import StripePaymentForm from './StripePaymentForm';
import { useMemo } from 'react';


const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const RideDetailPopupPassengerView = ({
    ride,
    car,
    mode,

    localRide,
    currentRideStatus,

    driverInfo,

    passengerRoute,
    delayPickup,
    durationPassenger,
    addMinutesToTime,

    // Mode book
    seatsToBook,
    setSeatsToBook,
    promoInput,
    setPromoInput,
    promoMessage,
    appliedCode,
    priceDetails,
    bookingLoading,

    onApplyPromo,
    onAddressSelect,
    onBook,

    onPassengerFinish,
    onOpenRating,
}) => {

    // --- LOGS DE DÉBOGAGE  ---
    console.group("[PassengerView] Debug Data");
    console.log("1. Mode:", mode);
    console.log("2. Ride Global (DB):", ride);
    console.log("3. PassengerRoute (Props):", passengerRoute);
    console.log("   -> distance:", passengerRoute?.distance);
    console.log("   -> duration:", passengerRoute?.duration);
    console.log("   -> pickupAddress:", passengerRoute?.pickupAddress);
    console.log("4. Delay Pickup (min):", delayPickup);
    console.log("5. Duration Passenger (min):", durationPassenger);
    console.groupEnd();
    // ---------------------------------------------

    // Fallbacks si props non fournies
    const displayCar = car || ride?.car || localRide?.car;
    const displayDriver = driverInfo || ride?.driver || localRide?.driver;

    // Sécurité : évite un crash si priceDetails n'est pas encore disponible
    const safePriceDetails = priceDetails || {
        subtotal: 0,
        fee: 0,
        discountAmount: 0,
        total: ride?.price || 0,
    };

    // --- CALCULS INTELLIGENTS POUR L'AFFICHAGE ---

    // Distance : 
    // Si passengerRoute a une distance définie, on l'utilise. Sinon on prend celle du ride global.
    // On convertit en nombre pour comparer.
    const distP = parseFloat(passengerRoute?.distance);
    const finalDistance = (distP > 0) ? passengerRoute.distance : (ride?.distance || 0);

    // Horaires
    // Heure de départ du conducteur (base) 
    const baseDepartureTime = ride?.departureTime || "00:00";

    // Heure de prise en charge = Départ + Délai
    const pickupTimeDisplay = delayPickup > 0
        ? addMinutesToTime(baseDepartureTime, delayPickup)
        : baseDepartureTime;

    // Durée du trajet passager
    // Priorité à durationPassenger (calculé par le hook) > passengerRoute.duration (DB) > 0
    const finalDuration = durationPassenger > 0
        ? Math.round(durationPassenger)
        : (passengerRoute?.duration ? parseInt(passengerRoute.duration) : 0);

    // Heure d'arrivée = Prise en charge + Durée trajet
    const dropoffTimeDisplay = finalDuration > 0
        ? addMinutesToTime(pickupTimeDisplay, finalDuration)
        : "--:--";

    // Récupération de l'état : soit du Back (via props), soit du local (après action)
    const hasUserRatedDriver = ride.hasAuthUserRated || localRide.hasDriverRated;


    //------------------------------------
    //------------STRIPE------------------
    //------------------------------------

    // --- NOUVEAUX ÉTATS POUR LE PAIEMENT ---
    const [showPayment, setShowPayment] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [paymentInitLoading, setPaymentInitLoading] = useState(false);

    // --- TEST!!!!!!!!!!! Lancer le paiement ---
    const handleInitiatePayment = async () => {
        console.log("Clic sur Paiement")
        setPaymentInitLoading(true);
        try {
            // CORRECTION 1: Typos nsole -> console
            console.log(" Lancement initPayment avec rideId:", ride.id, "seats:", seatsToBook); 
            if (!ride?.id) throw new Error("ID du trajet manquant");

            console.log("Appel BookingService.initPayment...", ride.id, seatsToBook);

            const data = await BookingService.initPayment(ride.id, seatsToBook);

            console.log("Réponse initPayment:", data);
            if (!data.clientSecret) throw new Error("Pas de clientSecret reçu");

            setClientSecret(data.clientSecret);
            setShowPayment(true);
        } catch (error) {
            console.error("Erreur handleInitiatePayment:", error);
            alert("Erreur lors de l'initialisation du paiement.");
        } finally {
            setPaymentInitLoading(false);
        }
    };

    // --- SUCCÈS DU PAIEMENT ---
    const handlePaymentSuccess = (paymentIntentId) => {
        // On appelle la fonction onBook originale l'ID du paiement en plus
        onBook({ stripePaymentIntentId: paymentIntentId });
    };
    // Mémo pour options Stripe
    const stripeOptions = useMemo(() => {
        return clientSecret ? { 
            clientSecret, 
            appearance: { theme: 'stripe' } 
        } : null;
    }, [clientSecret]);



    //------------STRIPE------------------
    //------------------------------------

    return (
        <div className="space-y-6">
            {/* Infos Conducteur */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-bold uppercase mb-3">Conducteur</p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar src={displayDriver?.picture || displayDriver?.avatar} size="md" />
                        <div>
                            <p className="font-bold text-gray-800 text-sm">
                                {displayDriver ? `${displayDriver.firstName} ${displayDriver.lastName || ''}` : 'Conducteur'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <span className="text-yellow-500">★</span>
                                <span>{displayDriver?.rating || 'Nouveau'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Avatar src={displayCar?.picture} type="car" size="md" />
                        <div>
                            <p className="font-bold text-sm text-gray-700">{displayCar ? displayCar.model : "?"}</p>
                            <span className="text-xs text-gray-500 font-mono">{displayCar ? displayCar.licensePlate : "PLAQUE"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Passager (Si pas en mode recherche) */}
            {mode !== 'book' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    {currentRideStatus === 'completed' && localRide.status !== 'COMPLETED' && (
                        <div className="flex flex-col gap-3">
                            <p className="text-sm text-emerald-800 font-medium text-center">
                                Le conducteur a terminé le trajet. Tout s'est bien passé ?
                            </p>
                            <Button onClick={onPassengerFinish} className="w-full bg-emerald-600 text-white">
                                <CheckCircle className="w-4 h-4 mr-2" /> Valider la fin du trajet
                            </Button>
                        </div>
                    )}
                    {localRide.status === 'COMPLETED' && (
                        <div className="text-center">
                            <Button
                                disabled={hasUserRatedDriver}
                                onClick={() => {
                                    const driverDisplayName = displayDriver
                                        ? `${displayDriver.firstName} ${displayDriver.lastName || ''}`
                                        : 'le conducteur';

                                    // On utilise ride.bookingId (ID Réservation) et non localRide.id (ID Trajet)
                                    // La cible est le 'DRIVER'
                                    onOpenRating(driverDisplayName, ride.bookingId, 'DRIVER');
                                }}
                                className="w-full btn-sm mt-2 bg-emerald-600 text-white disabled:bg-gray-200 disabled:text-gray-500"
                            >
                                {hasUserRatedDriver ? 'Conducteur noté ✓' : 'Noter le conducteur'}
                            </Button>
                        </div>
                    )}

                    {(currentRideStatus === 'scheduled' || currentRideStatus === 'pending') && (
                        <p className="text-center text-sm text-gray-500 italic">Le trajet n'a pas encore commencé.</p>
                    )}
                </div>
            )}

            {/* Timeline & Stats (Mode Passager) */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative mt-4">
                <div className="absolute left-[8px] top-[26px] bottom-[26px] w-[2px] bg-gray-200"></div>

                <div className="space-y-6">
                    {/* Pickup */}
                    <div className="flex gap-4 items-start relative">
                        <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow absolute left-0 top-1"></div>
                        <div className="ml-6 w-full">
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm font-bold text-gray-900">
                                    {pickupTimeDisplay}
                                </p>
                                <span className="text-xs font-bold text-blue-600 uppercase">Montée</span>
                            </div>

                            {mode === 'book' ? (
                                <AddressAutocomplete
                                    label=""
                                    placeholder="Où le conducteur doit-il vous prendre ?"
                                    initialValue={passengerRoute?.pickupAddress || ride.departurePlace}
                                    onSelect={(p) => onAddressSelect('pickup', p)}
                                />
                            ) : (
                                <p className="text-sm text-gray-800 font-medium mt-1">
                                    {passengerRoute?.pickupAddress || ride.departurePlace}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Arrivée */}
                    <div className="flex gap-4 items-start relative">
                        <div className="w-4 h-4 rounded-full bg-gray-900 border-4 border-white shadow absolute left-0 top-1"></div>
                        <div className="ml-6 w-full">
                            <div className="flex justify-between items-baseline">
                                <p className="text-sm font-bold text-gray-900">
                                    {dropoffTimeDisplay}
                                </p>
                                <span className="text-xs font-bold text-gray-500 uppercase">Descente</span>
                            </div>

                            {mode === 'book' ? (
                                <AddressAutocomplete
                                    label=""
                                    placeholder="Où voulez-vous descendre ?"
                                    initialValue={passengerRoute?.dropoffAddress || ride.arrivalPlace}
                                    onSelect={(p) => onAddressSelect('dropoff', p)}
                                />
                            ) : (
                                <p className="text-sm text-gray-800 font-medium mt-1">
                                    {passengerRoute?.dropoffAddress || ride.arrivalPlace}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-gray-200">
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold">Durée estimée</p>
                        <p className="text-lg font-extrabold text-emerald-700">
                            {finalDuration > 0 ? `${Math.floor(finalDuration / 60)}h${String(finalDuration % 60).padStart(2, '0')}` : '--'}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Distance</p>
                        <p className="text-lg font-extrabold text-emerald-700">
                            {finalDistance} km
                        </p>
                    </div>
                </div>
            </div>

            {/* --- BLOC RÉSERVATION (Mode book uniquement) --- */}
            {/* On cache ce bloc si showPayment est true pour laisser place au formulaire Stripe */}
            {mode === 'book' && !showPayment && (
                <div className="bg-white border-t border-gray-100 pt-4 mt-2">
                    {/* Sélecteur Places */}
                    <div className="form-control mb-4">
                        <label className="label pt-0 justify-start gap-2">
                            <span className="label-text text-xs font-bold uppercase text-emerald-900">Passagers</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSeatsToBook(Math.max(1, seatsToBook - 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg font-bold hover:bg-gray-200"
                            >-</button>
                            <span className="font-bold text-lg w-6 text-center">{seatsToBook}</span>
                            <button
                                onClick={() => setSeatsToBook(Math.min(ride.seatsAvailable, seatsToBook + 1))}
                                className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-lg font-bold hover:bg-gray-200"
                            >+</button>
                        </div>
                    </div>

                    {/* Code Promo */}
                    <div className="flex gap-2 mb-2">
                        <div className="relative flex-1">
                            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={promoInput}
                                onChange={(e) => setPromoInput(e.target.value)}
                                placeholder="Code Promo"
                                className="input input-bordered w-full h-10 pl-10"
                            />
                        </div>
                        <Button onClick={onApplyPromo} className="h-10 bg-emerald-600 text-white">
                            Appliquer
                        </Button>
                    </div>

                    {promoMessage && (
                        <p className={`text-xs mb-4 ml-1 ${promoMessage.type === 'success' ? 'text-emerald-600 font-bold' : 'text-red-500'}`}>
                            {promoMessage.text}
                        </p>
                    )}

                    {/* Résumé Financier */}
                    <div className="space-y-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg mb-4">
                        <div className="flex justify-between">
                            <span>Trajet ({seatsToBook}x {ride.price}€)</span>
                            <span>{safePriceDetails.subtotal.toFixed(2)} €</span>
                        </div>

                        <div className="flex justify-between">
                            <span className="flex items-center gap-1">
                                Frais de service <Info className="w-3 h-3" />
                            </span>
                            <span>{safePriceDetails.fee.toFixed(2)} €</span>
                        </div>

                        {safePriceDetails.discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-600 font-bold">
                                <span className="flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> Réduc ({appliedCode})
                                </span>
                                <span>-{safePriceDetails.discountAmount.toFixed(2)} €</span>
                            </div>
                        )}

                        <div className="flex justify-between font-extrabold text-lg text-emerald-950 border-t border-gray-200 pt-2 mt-2">
                            <span>Total</span>
                            <span>{safePriceDetails.total.toFixed(2)} €</span>
                        </div>
                    </div>

                    {/*Le bouton appelle le paiement d'abord */}
                    <Button
                        className="w-full bg-emerald-600 text-white py-3 text-lg shadow-lg"
                        onClick={handleInitiatePayment}
                        disabled={paymentInitLoading || bookingLoading}
                    >
                        {paymentInitLoading ? 'Chargement...' : 'Procéder au paiement'}
                    </Button>
                </div>
            )}

            {/* Le bloc Stripe est placé ici pour être visible */}
            {showPayment && clientSecret && (
                <div className="mt-4">
                    {/* On passe l'objet stripeOptions mémorisé */}
                    <Elements stripe={stripePromise} options={stripeOptions}>
                        <StripePaymentForm
                            amount={safePriceDetails.total.toFixed(2)}
                            onSuccess={handlePaymentSuccess}
                            onCancel={() => setShowPayment(false)}
                        />
                    </Elements>
                </div>
            )}
        </div>
    );
};

export default RideDetailPopupPassengerView;