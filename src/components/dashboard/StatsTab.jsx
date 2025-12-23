import React from 'react';
import Card from '../ui/Card';
import { Star, CarFront, Leaf, Handshake, BarChart3 } from 'lucide-react'; // Nouveaux imports

const StatsTab = () => {
    // Données simulées
    const stats = [
        // On passe le composant Icône directement, plus de string
        { label: "Moyenne conducteur", value: "4.9", Icon: Star, color: "text-yellow-500", bg: "bg-yellow-50", border: "border-yellow-100" },
        { label: "Km partagés (mois)", value: "1240 km", Icon: CarFront, color: "text-blue-500", bg: "bg-blue-50", border: "border-blue-100" },
        { label: "CO2 économisé", value: "72 kg", Icon: Leaf, color: "text-emerald-500", bg: "bg-emerald-50", border: "border-emerald-100" },
        { label: "Trajets réalisés", value: "18", Icon: Handshake, color: "text-purple-500", bg: "bg-purple-50", border: "border-purple-100" },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Section KPI */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, index) => (
                    <Card key={index} hoverable className={`p-6 flex flex-col items-center text-center justify-center border ${stat.border} shadow-sm`}>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${stat.bg}`}>
                            {/* Rendu dynamique du composant Icône */}
                            <stat.Icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                        <span className={`text-2xl font-extrabold mt-1 text-gray-800`}>{stat.value}</span>
                    </Card>
                ))}
            </div>

            {/* Section Graphique (Placeholder propre) */}
            <Card className="p-12 min-h-[300px] flex flex-col items-center justify-center border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
                <BarChart3 className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-gray-500 font-medium">Graphique d'activité bientôt disponible</h3>
                <p className="text-gray-400 text-sm mt-2">Vous pourrez suivre l'évolution de vos économies ici.</p>
            </Card>
        </div>
    );
};

export default StatsTab;