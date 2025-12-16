
import React from 'react';

const StatsTab = () => {
    // Données simulées (plus tard, elles viendront de statsService.js)
    const stats = [
        { label: "Moyenne conducteur", value: "4.9", icon: "⭐" },
        { label: "Km partagés (mois)", value: "1240 km", icon: "🚗" },
        { label: "CO2 économisé", value: "72 kg", icon: "🌍" },
        { label: "Trajets réalisés", value: "18", icon: "🤝" },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Carte principale */}
            <div className="bg-gradient-to-br from-emerald-50 to-white p-8 rounded-3xl border border-emerald-100 shadow-sm md:col-span-2">
                <h3 className="text-xl font-bold text-emerald-900 mb-6">Mes Performances ce mois-ci</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50 flex flex-col items-center text-center hover:scale-105 transition-transform">
                            <span className="text-3xl mb-2">{stat.icon}</span>
                            <span className="text-gray-500 text-sm font-medium uppercase tracking-wide">{stat.label}</span>
                            <span className="text-2xl font-bold text-emerald-800 mt-1">{stat.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Section vide pour futurs graphiques */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center min-h-[200px] text-gray-400 border-dashed border-2">
                <p>Graphique d'évolution (Bientôt)</p>
            </div>
             <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex items-center justify-center min-h-[200px] text-gray-400 border-dashed border-2">
                <p>Historique des crédits (Bientôt)</p>
            </div>
        </div>
    );
};

export default StatsTab;