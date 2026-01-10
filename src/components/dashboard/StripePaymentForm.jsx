// src/components/dashboard/StripePaymentForm.jsx
import React, { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import Button from '../ui/Button';

const StripePaymentForm = ({ amount, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [errorMessage, setErrorMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        // STOPPER TOUT RECHARGEMENT
        event.preventDefault();
        event.stopPropagation();

        console.log("Soumission du formulaire Stripe...");

        if (!stripe || !elements) {
            console.error(" Stripe n'est pas prêt");
            return;
        }

        setLoading(true);
        setErrorMessage(null);

        try {
            // Appel Stripe SIMPLIFIÉ
            const result = await stripe.confirmPayment({
                elements,
                // On garde return_url
                confirmParams: {
                    return_url: "http://localhost:5173", // URL en dur pour tester
                },
                redirect: 'if_required',
            });


            console.log("Résultat Brut Stripe:", result);

            if (result.error) {
                console.error(" Erreur Stripe:", result.error.message);
                setErrorMessage(result.error.message);
                setLoading(false);
            } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
                console.log("Paiement réussi, ID:", result.paymentIntent.id);
                // Appel du parent
                onSuccess(result.paymentIntent.id);
            } else {
                console.log(" Statut inattendu:", result.paymentIntent?.status);
            }
        } catch (err) {
            console.error(" Exception JS dans handleSubmit:", err);
            setErrorMessage("Une erreur inattendue est survenue.");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-4 p-4 bg-white border rounded-xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Paiement sécurisé ({amount} €)</h3>

            <PaymentElement />

            {errorMessage && (
                <div className="text-red-500 text-sm mt-2 bg-red-50 p-2 rounded">
                    {errorMessage}
                </div>
            )}

            <div className="flex gap-3 mt-6">
                <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Annuler
                </Button>
                <Button
                    type="submit"
                    className="flex-1 bg-emerald-600 text-white"
                    disabled={!stripe || loading}
                >
                    {loading ? 'Traitement...' : `Payer ${amount} €`}
                </Button>
            </div>
        </form>
    );
};

export default StripePaymentForm;