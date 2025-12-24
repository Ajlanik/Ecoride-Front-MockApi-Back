import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout';

// Composants Onglets
import ProfileTab from '../components/dashboard/ProfileTab';
import CarsTab from '../components/dashboard/CarsTab';
import StatsTab from '../components/dashboard/StatsTab';
import MyRidesTab from '../components/dashboard/MyRidesTab'; // Assure-toi que ce fichier existe bien dans components/dashboard

import Card from '../components/ui/Card';
import Avatar from '../components/ui/Avatar';
import { calculateCompletion } from '../utils/userUtils';

export default function Dashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    // Gestion des onglets via l'URL (?tab=...)
    const [searchParams, setSearchParams] = useSearchParams();
    const currentTab = searchParams.get('tab') || 'general';

    // Redirection si non connecté (au cas où)
    useEffect(() => {
        if (!user) navigate('/login');
    }, [user, navigate]);

    const completion = calculateCompletion(user);

    // Fonction pour changer d'onglet
    const setActiveTab = (tabName) => {
        setSearchParams({ tab: tabName });
    };

    // Composant Helper pour les boutons du menu
    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`
                flex-1 px-6 py-3 text-sm font-bold transition-all rounded-xl text-left md:text-center flex items-center gap-2
                ${currentTab === id 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'text-gray-500 hover:bg-white hover:text-emerald-600'}
            `}
        >
            {/* Petit indicateur actif */}
            {currentTab === id && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
            {label}
        </button>
    );

    if (!user) return null;

    return (
        <MainLayout>
            <div className="flex flex-col lg:flex-row gap-8">

                {/* --- SIDEBAR / MENU --- */}
                <div className="lg:w-1/4 flex flex-col gap-6">
                    {/* Carte Info User Rapide */}
                    <Card className="p-6 bg-white/90 backdrop-blur border-none shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <Avatar src={user.picture} alt={user.firstName} size="md" />
                            <div>
                                <h2 className="font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
                                <p className="text-xs text-gray-400">Membre EcoRide</p>
                            </div>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className="text-left bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                <span>Complétion profil</span>
                                <span>{Math.round(completion)}%</span>
                            </div>
                            <progress className="progress progress-success w-full" value={completion} max="100"></progress>
                        </div>
                    </Card>

                    {/* Menu Navigation */}
                    <Card className="p-2 bg-gray-50/80 border border-gray-100">
                        <div className="flex flex-col gap-1">
                            <TabButton id="general" label="Mon Profil" />
                            <TabButton id="cars" label="Mes Véhicules" />
                            <TabButton id="rides" label="Mes Trajets" />
                            <TabButton id="stats" label="Statistiques" />
                        </div>
                    </Card>
                </div>

                {/* --- CONTENU PRINCIPAL --- */}
                <div className="lg:w-3/4">
                    <div className="min-h-[500px]">
                        {currentTab === 'general' && <ProfileTab user={user} />}
                        {currentTab === 'cars' && <CarsTab userId={user.id} />}
                        {currentTab === 'rides' && <MyRidesTab />}
                        {currentTab === 'stats' && <StatsTab />}
                    </div>
                </div>

            </div>
        </MainLayout>
    );
}