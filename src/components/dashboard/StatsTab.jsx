//------ Onglet Statistiques du Dashboard ------//
// components/dashboard/StatsTab.jsx
// pour afficher les statistiques clés et un graphique d'activité (placeholder)

import React from 'react';
import Card from '../ui/Card';

const StatsTab = () => {
    // Données simulées (À connecter au back plus tard)
    const stats = [
        { label: "Moyenne conducteur", value: "4.9", icon: "⭐", color: "text-yellow-500", bg: "bg-yellow-50" },
        { label: "Km partagés (mois)", value: "1240 km", icon: "🚗", color: "text-blue-500", bg: "bg-blue-50" },
        { label: "CO2 économisé", value: "72 kg", icon: "🌍", color: "text-emerald-500", bg: "bg-emerald-50" },
        { label: "Trajets réalisés", value: "18", icon: "🤝", color: "text-purple-500", bg: "bg-purple-50" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Section KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hoverable className="p-6 flex flex-col items-center text-center justify-center border-none shadow-md">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-3 ${stat.bg}`}>
                            {stat.icon}
                        </div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                        <span className={`text-2xl font-extrabold mt-1 ${stat.color}`}>{stat.value}</span>
                    </Card>
                ))}
            </div>

            {/* Section Graphique (Placeholder) */}
            <Card className="p-8 min-h-[300px] flex flex-col items-center justify-center border-dashed border-2 border-gray-200 shadow-none">
                <span className="text-6xl grayscale opacity-20 mb-4">📊</span>
                <h3 className="text-gray-400 font-medium">Graphique d'activité</h3>
                <p className="text-gray-300 text-sm">Bientôt disponible</p>
            </Card>
        </div>
    );
};

export default StatsTab;