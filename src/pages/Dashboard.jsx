// Tableau de bord utilisateur avec onglets pour profil, véhicules et stats


import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MainLayout from '../layouts/MainLayout'; // Utilisation du Layout
import ProfileTab from '../components/dashboard/ProfileTab';
import CarsTab from '../components/dashboard/CarsTab';
import StatsTab from '../components/dashboard/StatsTab';

import { calculateCompletion, getUserLevel } from '../utils/userUtils';
// Tu peux faire pareil pour StatsTab

export default function Dashboard() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const completion = calculateCompletion(user);
    const level = getUserLevel(completion);

    // Petit helper pour les boutons d'onglets
    const TabButton = ({ id, label }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === id ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
            {label}
        </button>
    );

    return (
        <MainLayout>
            <div className="flex flex-col lg:flex-row gap-8">

                {/* Sidebar (Résumé) */}
                <div className="lg:w-1/4 space-y-6">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl text-white shadow-xl">
                        <h3 className="font-bold text-xl mb-2">Mon Statut 🏆</h3>
                        <p className={`text-sm mb-4 ${level.color}`}>{level.label}</p>

                        {/* Barre de progression dynamique */}
                        <div className="w-full bg-emerald-900/30 rounded-full h-2.5 mb-1">
                            {/* ICI : On utilise la couleur dynamique */}
                            <div
                                className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${level.barColor}`}
                                style={{ width: `${completion}%` }}
                            ></div>
                        </div>

                        {/* Affichage du pourcentage en texte */}
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-xs opacity-60">
                                Niveau {Math.floor(completion / 20)}/5
                            </span>
                            <span className="text-xs font-bold text-emerald-300">{Math.round(completion)}% complété</span>
                        </div>
                    </div>
                </div>
                {/* Contenu Principal */}
                <div className="lg:w-3/4">
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] p-8 shadow-2xl min-h-[600px] border border-white/20">

                        {/* Header Interne */}
                        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 border-b border-gray-100 pb-8">
                            <div className="flex items-center gap-4">
                                <div className="avatar">
                                    <div className="w-20 h-20 rounded-full ring ring-emerald-500 ring-offset-2">
                                        <img src={user?.picture || "https://placehold.co/150"} alt="Profil" />
                                    </div>
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold text-emerald-950">
                                        {user?.firstName} <span className="font-normal text-gray-500">{user?.lastName}</span>
                                    </h1>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Membre depuis 2024</p>
                                </div>
                            </div>

                            {/* Navigation des onglets */}
                            <div className="flex bg-gray-100 p-1.5 rounded-full">
                                <TabButton id="general" label="Profil" />
                                <TabButton id="cars" label="Véhicules" />
                                <TabButton id="stats" label="Stats" />
                            </div>
                        </div>

                        {/* Affichage conditionnel propre */}
                        <div className="mt-6">
                            {activeTab === 'general' && <ProfileTab user={user} />}
                            {activeTab === 'cars' && <CarsTab userId={user?.id} />}
                            {activeTab === 'stats' && <div className="text-center text-gray-500">Composant Stats à extraire...</div>}
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    );
}