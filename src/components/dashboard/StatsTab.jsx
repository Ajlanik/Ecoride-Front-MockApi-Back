import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Card from '../ui/Card';
import Loader from '../ui/Loader';
import { TrendingUp, Award, Zap, Leaf } from 'lucide-react';
import { UserService } from "../../services/userService";
/*const StatsTab = ({ user }) => {
    const { triggerToast } = useToast();
    const [stats, setStats] = useState({
        rating: 0,
        credits: 0,
        co2Saved: 0,
        ridesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user.id) return;
            setLoading(true);
            try {
                // TODO: BACKEND - Créer un endpoint GET /api/users/{id}/stats
                // Le backend fera : SELECT SUM(distance) FROM rides WHERE user_id = ...

                // Pour l'instant, on récupère les trajets pour simuler le calcul (Transition)
                // Une fois le back prêt, on remplacera par : const data = await UserService.getStats(user.id);
                const rides = await RideService.getAll({ userId: user.id });

                // --- LOGIQUE TEMPORAIRE FRONT (A DÉPLACER AU BACK) ---
                const completedRides = rides.filter(r => r.status === "completed");
                const totalKm = completedRides.reduce((acc, ride) => acc + (ride.distance || 0), 0);
                const co2 = totalKm * 0.120; // 120g par km
                // ----------------------------------------------------

                setStats({
                    rating: 4.8, // À récupérer du User ou des Avis
                    credits: user.credits,
                    co2Saved: parseFloat(co2.toFixed(1)),
                    ridesCount: rides.length
                });

            } catch (error) {
                console.error(error);
                triggerToast("Erreur chargement statistiques", "error");
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user?.id]);
*/
const StatsTab = ({ user }) => {
    const { triggerToast } = useToast();
    const [stats, setStats] = useState({
        rating: 0,
        credits: 0,
        co2Saved: 0,
        ridesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user || !user.id) {
                setLoading(false);
                return;
            }

            setLoading(true);
            try {
                // Appel au backend Java
                const data = await UserService.getStats(user.id);

                setStats({
                    rating: data.rating !== undefined ? data.rating : (user.rating || "pas encore noté"),
                    credits: data.credits !== undefined ? data.credits : (user.credits || 0),
                    co2Saved: data.co2Saved || 0,
                    ridesCount: data.ridesCount || 0
                });

            } catch (error) {
                // Silencieux en production ou via un service de monitoring
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    if (loading) return <Loader text="Calcul de votre impact..." />;



    return (
        <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" /> Mes Statistiques
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* NOTE MOYENNE */}
                <Card className="p-6 bg-emerald-50 border-emerald-100 flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-full text-emerald-600">
                        <Award className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs text-emerald-800 font-bold uppercase tracking-wider">Note Moyenne</p>
                        <p className="text-3xl font-extrabold text-gray-800">{stats.rating}/5</p>
                    </div>
                </Card>

                {/* CRÉDITS */}
                <Card className="p-6 bg-blue-50 border-blue-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                        <Zap className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs text-blue-800 font-bold uppercase tracking-wider">Crédits</p>
                        <p className="text-3xl font-extrabold text-gray-800">{stats.credits} €</p>
                    </div>
                </Card>

                {/* CO2 ECONOMISE */}
                <Card className="p-6 bg-green-50 border-green-100 flex items-center gap-4">
                    <div className="p-3 bg-green-100 rounded-full text-green-600">
                        <Leaf className="w-8 h-8" />
                    </div>
                    <div>
                        <p className="text-xs text-green-800 font-bold uppercase tracking-wider">CO2 Économisé</p>
                        <div className="flex items-baseline gap-1">
                            <p className="text-3xl font-extrabold text-gray-800">{stats.co2Saved}</p>
                            <span className="text-sm font-medium text-gray-500">kg</span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Résumé textuel */}
            <div className="text-center text-sm text-gray-400 mt-4">
                Basé sur {stats.ridesCount} trajet(s) publié(s).
            </div>
        </div>
    );
};

export default StatsTab;
