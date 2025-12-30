import React from 'react';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import AddressAutocomplete from '../ui/AddressAutocomplete';

import { CheckCircle, Star, Info, MapPin, Ticket, Tag } from 'lucide-react';

/**
 * ============================================================================
 *          UI PASSAGER (composant de présentation)
 * Objectif :
 * - Ce fichier ne contient aucune logique API (pas de fetch / services).
 * - Il affiche uniquement la vue passager selon mode = 'view' ou 'book'.
 * ============================================================================
 */
const dayTranslations = {
    MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi', FRIDAY: 'Vendredi', SATURDAY: 'Samedi', SUNDAY: 'Dimanche'
};
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
    // -------------------------------------------------------------------------
    // Sécurité : évite un crash si priceDetails n'est pas encore disponible
    // (ex: prop oubliée, chargement, etc.)
    // -------------------------------------------------------------------------
    const safePriceDetails = priceDetails || {
        subtotal: 0,
        fee: 0,
        discountAmount: 0,
        total: 0,
    };

    return (
        <div className="space-y-6">
            {/* Infos Conducteur */}
            <div className="bg-white border border-gray-200 p-4 rounded-xl">
                <p className="text-xs text-gray-500 font-bold uppercase mb-3">Conducteur</p>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar src={driverInfo?.picture} size="md" />
                        <div>
                            <p className="font-bold text-gray-800 text-sm">
                                {driverInfo ? `${driverInfo.firstName} ${driverInfo.lastName}` : 'Conducteur'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {driverInfo?.rating ? `${driverInfo.rating}/5` : 'Nouveau'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                        <Avatar src={car?.picture} type="car" size="md" />
                        <div>
                            <p className="font-bold text-sm text-gray-700">{car ? car.model : "?"}</p>
                            <span className="text-xs text-gray-500 font-mono">{car ? car.licensePlate : "PLAQUE"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Passager (Si pas en mode recherche) */}
            {mode !== 'book' ? (
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
                            {/* Côté Passager : Bouton Noter le conducteur */}
                            <Button
                                disabled={localRide.hasDriverRated}
                                onClick={() => {
                                    // CORRECTION ICI : firstName et lastName (avec des majuscules)
                                    const driverDisplayName = driverInfo
                                        ? `${driverInfo.firstName} ${driverInfo.lastName || ''}`
                                        : 'le conducteur';

                                    onOpenRating(driverDisplayName, localRide.id, 'DRIVER');
                                }}
                                className="w-full btn-sm mt-2 bg-emerald-600 text-white disabled:bg-gray-200 disabled:text-gray-500"
                            >
                                {localRide.hasDriverRated ? 'Conducteur noté ✓' : 'Noter le conducteur'}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                    {/* Adresse Input */}
                    <AddressAutocomplete
                        label="Où le conducteur doit-il vous prendre ?"
                        initialValue={ride.departurePlace}
                        onSelect={(p) => onAddressSelect('pickup', p)}
                    />
                    <AddressAutocomplete
                        label="Où voulez-vous descendre ?"
                        initialValue={ride.arrivalPlace}
                        onSelect={(p) => onAddressSelect('dropoff', p)}
                    />

                    {/* Sélecteur Places */}
                    <div className="form-control">
                        <label className="label pt-0">
                            <span className="label-text text-xs font-bold uppercase text-emerald-900">Passagers</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={ride.seatsAvailable}
                            value={seatsToBook}
                            onChange={(e) => setSeatsToBook(Number(e.target.value))}
                            className="input input-bordered w-full h-10"
                        />
                    </div>

                    {/* Code Promo */}
                    <div className="pt-2">
                        <div className="flex gap-2">
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
                            <p
                                className={`text-xs mt-1 ml-1 ${promoMessage.type === 'success'
                                    ? 'text-emerald-600 font-bold'
                                    : 'text-red-500'
                                    }`}
                            >
                                {promoMessage.text}
                            </p>
                        )}
                    </div>

                    {/* Résumé Financier */}
                    <div className="space-y-2 text-sm text-gray-600 border-t border-gray-200 pt-3 mt-2">
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

                        <div className="flex justify-between font-extrabold text-lg text-emerald-950 border-t border-gray-200 pt-3 mt-2">
                            <span>Total à payer</span>
                            <span>{safePriceDetails.total.toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* Bouton Réserver */}
                    <div className="pt-2">
                        <Button
                            className="w-full bg-emerald-600 text-white"
                            onClick={onBook}
                            disabled={bookingLoading}
                        >
                            {bookingLoading ? 'Envoi en cours...' : 'Réserver'}
                        </Button>
                    </div>
                </div>
            )}

            {/* Timeline & Stats (Mode Passager) */}
            <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 relative mt-4">
                <div className="absolute left-[8px] top-[26px] bottom-[26px] w-[2px] bg-gray-200"></div>

                <div className="space-y-6">
                    {/* Départ */}
                    <div className="flex gap-4 items-start relative">
                        <div className="w-4 h-4 rounded-full bg-emerald-600 border-4 border-white shadow absolute left-0 top-1"></div>
                        <div className="ml-6">
                            <p className="text-sm font-bold text-gray-900">
                                {ride.departureTime || '--:--'}
                            </p>
                            <p className="text-xs text-gray-500 uppercase font-bold">Départ</p>
                            <p className="text-sm text-gray-800 font-medium">{ride.departurePlace}</p>

                            {/*  Récurrence */}
                            {ride.isRecurring && (
                                <div className="mt-3 p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start gap-3">
                                    <div className="p-1.5 bg-emerald-100 rounded-full text-emerald-600 mt-0.5">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m17 2 4 4-4 4" /><path d="M3 11v-1a4 4 0 0 1 4-4h14" /><path d="m7 22-4-4 4-4" /><path d="M21 13v1a4 4 0 0 1-4 4H3" /></svg>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-emerald-900">Trajet Récurrent</p>
                                        <p className="text-xs text-emerald-700">
                                            Chaque {(ride.recurrenceDays || []).map(d => dayTranslations[d]).join(', ')}
                                            <br />
                                            Jusqu'au {new Date(ride.recurrenceEndDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            )}


                        </div>
                    </div>

                    {/* Pickup */}
                    <div className="flex gap-4 items-start relative">
                        <div className="w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow absolute left-0 top-1"></div>
                        <div className="ml-6">
                            <p className="text-sm font-bold text-gray-900">
                                {addMinutesToTime(ride.departureTime, delayPickup)}
                            </p>
                            <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                            <p className="text-sm text-gray-800 font-medium">
                                {passengerRoute?.pickupAddress || ride.departurePlace}
                            </p>
                        </div>
                    </div>

                    {/* Arrivée */}
                    <div className="flex gap-4 items-start relative">
                        <div className="w-4 h-4 rounded-full bg-gray-900 border-4 border-white shadow absolute left-0 top-1"></div>
                        <div className="ml-6">
                            <p className="text-sm font-bold text-gray-900">
                                {addMinutesToTime(ride.departureTime, delayPickup + durationPassenger)}
                            </p>
                            <p className="text-xs text-gray-500 uppercase font-bold">Arrivée</p>
                            <p className="text-sm text-gray-800 font-medium">
                                {passengerRoute?.dropoffAddress || ride.arrivalPlace}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Durée estimée</p>
                        <p className="text-lg font-extrabold text-emerald-700">
                            {durationPassenger || passengerRoute?.duration || 0} min
                        </p>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-100">
                        <p className="text-xs text-gray-500 uppercase font-bold">Distance</p>
                        <p className="text-lg font-extrabold text-emerald-700">
                            {passengerRoute?.distance || 0} km
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RideDetailPopupPassengerView;
