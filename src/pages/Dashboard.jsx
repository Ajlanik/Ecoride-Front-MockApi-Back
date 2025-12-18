import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';
import ProfileTab from '../components/dashboard/ProfileTab';
import CarsTab from '../components/dashboard/CarsTab';
import StatsTab from '../components/dashboard/StatsTab';
import { calculateCompletion } from '../utils/userUtils';

// --- UI IMPORTS ---
import Avatar from '../components/ui/Avatar';
import Card from '../components/ui/Card';

export default function Dashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const completion = calculateCompletion(user);

    // Petit helper pour les boutons d'onglets
    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex-1 px-6 py-3 text-sm font-bold transition-all rounded-xl
                ${activeTab === id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-gray-500 hover:bg-white hover:text-emerald-600'}
            `}
        >
            {label}
        </button>
    );

    return (
        <MainLayout>
            <div className="flex flex-col lg:flex-row gap-8">

                {/* SIDEBAR (Résumé Profil Mobile & Desktop) */}
                <div className="lg:w-1/4 space-y-6">
                    <Card className="p-6 text-center border-none shadow-lg bg-white/80 backdrop-blur">
                        <div className="flex justify-center mb-4">
                            <Avatar src={user?.picture} type="user" size="xl" className="shadow-xl" />
                        </div>
                        <h2 className="text-xl font-bold text-emerald-950">
                            {user?.firstName} {user?.lastName}
                        </h2>
                        <p className="text-gray-500 text-sm mb-4">Membre EcoRide</p>
                        
                        {/* Barre de progression profil */}
                        <div className="text-left bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                <span>Complétion profil</span>
                                <span>{Math.round(completion)}%</span>
                            </div>
                            <progress className="progress progress-success w-full" value={completion} max="100"></progress>
                        </div>
                    </Card>

                    {/* MENU NAVIGATION */}
                    <Card className="p-2 bg-gray-50/80 border border-gray-100">
                        <div className="flex flex-col gap-1">
                            <TabButton id="general" label="👤 Mon Profil" />
                            <TabButton id="cars" label="🚗 Mes Véhicules" />
                            <TabButton id="stats" label="📊 Statistiques" />
                        </div>
                    </Card>
                </div>

                {/* CONTENU PRINCIPAL */}
                <div className="lg:w-3/4">
                    <div className="min-h-[500px]">
                        {activeTab === 'general' && <ProfileTab user={user} />}
                        {activeTab === 'cars' && <CarsTab userId={user?.id} />}
                        {activeTab === 'stats' && <StatsTab />}
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}