import React from 'react';
import MainLayout from '../layouts/MainLayout';

export default function MyBooking() {
    return (
        <MainLayout>
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center animate-fade-in">
                <div className="bg-white/10 backdrop-blur-md p-10 rounded-3xl border border-white/10 shadow-xl max-w-2xl">
                    <span className="text-6xl mb-4 block">TICKEEEEEEETTTTT</span>
                    <h1 className="text-3xl font-bold text-white mb-4">
                        Mes Réservations
                    </h1>
                    <p className="text-emerald-100 text-lg opacity-90">
                        Cette fonctionnalité arrive bientôt ! Vous pourrez retrouver ici tous vos trajets passés et futurs.
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}