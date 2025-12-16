




// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
//                                          Version plus soft du dashboard 
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------------------------------------



import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { carService } from '../services/carService';
import Navbar from '../components/Navbar';

// --- STYLES CONSTANTS (VERSION DARK / GLASS) ---
const INPUT_STYLE = "input input-bordered w-full bg-white/5 border-white/10 text-white focus:border-emerald-500 focus:bg-white/10 placeholder-gray-400";
const LABEL_STYLE = "label font-bold text-emerald-100 text-xs uppercase tracking-wide mb-1";
const FORM_CONTROL_STYLE = "form-control";
const CARD_STYLE = "glass-card p-5 hover:bg-white/10 transition-colors cursor-pointer group";

// --- SOUS-COMPOSANT : FORMULAIRE PROFIL ---
const GeneralTab = ({ user }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            <div className={FORM_CONTROL_STYLE}>
                <label className={LABEL_STYLE}>Prénom</label>
                <input type="text" defaultValue={user?.firstName} className={INPUT_STYLE} />
            </div>
            <div className={FORM_CONTROL_STYLE}>
                <label className={LABEL_STYLE}>Nom</label>
                <input type="text" defaultValue={user?.lastName} className={INPUT_STYLE} />
            </div>
            <div className={FORM_CONTROL_STYLE}>
                <label className={LABEL_STYLE}>Email</label>
                <input type="text" defaultValue={user?.email} disabled className={`${INPUT_STYLE} opacity-50 cursor-not-allowed`} />
            </div>
            <div className={FORM_CONTROL_STYLE}>
                <label className={LABEL_STYLE}>Téléphone</label>
                <input type="text" defaultValue={user?.phoneNumber || ""} className={INPUT_STYLE} placeholder="+33 6 00 00 00 00" />
            </div>
            <div className="col-span-full">
                <label className={LABEL_STYLE}>Bio</label>
                <textarea 
                className="textarea textarea-bordered bg-white/5 border-white/10 text-white w-full h-32 focus:border-emerald-500 focus:bg-white/10" defaultValue={user?.bio} placeholder="Racontez-nous qui vous êtes..."></textarea>
            </div>
            <div className="col-span-full flex justify-end">
                 <button className="btn bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-xl px-8 shadow-lg shadow-emerald-900/20">
                    Enregistrer les modifications
                 </button>
            </div>
        </div>
    );
};

// --- SOUS-COMPOSANT : VOITURES ---
const CarsTab = ({ userId }) => {
    const [cars, setCars] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCar, setSelectedCar] = useState(null);

    useEffect(() => {
        const fetchCars = async () => {
            if (userId) {
                const data = await carService.getUserCars(userId);
                setCars(data);
            }
            setLoading(false);
        };
        fetchCars();
    }, [userId]);

    if (loading) return <div className="text-center p-8 text-emerald-200">Chargement...</div>;

    // VUE DÉTAIL
    if (selectedCar) {
        return (
            <div className="animate-fade-in">
                <button onClick={() => setSelectedCar(null)} className="btn btn-sm btn-ghost text-gray-300 mb-4 gap-2 hover:text-white">
                    ← Retour
                </button>

                <div className="glass-card p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="md:w-1/3">
                            <img src={selectedCar.img} alt={selectedCar.model} className="w-full h-56 object-cover rounded-2xl shadow-lg" />
                            <div className={`mt-4 text-center py-2 rounded-lg font-bold text-xs uppercase tracking-widest ${selectedCar.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                                {selectedCar.isActive ? ' Actif' : ' Inactif'}
                            </div>
                        </div>

                        <div className="md:w-2/3 text-white">
                            <div className="flex justify-between items-start mb-6">
                                <h2 className="text-3xl font-bold">{selectedCar.brand} <span className="text-emerald-400">{selectedCar.model}</span></h2>
                                <button className="btn btn-outline btn-sm text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-black">Modifier</button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase">Plaque</p>
                                    <p className="text-lg font-mono">{selectedCar.licensePlate}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase">Moteur</p>
                                    <p className="text-lg">{selectedCar.engine}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase">Places</p>
                                    <p className="text-lg">{selectedCar.numberOfSeat}</p>
                                </div>
                                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                                    <p className="text-xs text-gray-400 uppercase">Achat</p>
                                    <p className="text-lg">{new Date(selectedCar.purchaseDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // VUE LISTE
    return (
        <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-white">Mon Garage ({cars.length})</h3>
                <button className="btn btn-sm bg-emerald-500 text-white border-none hover:bg-emerald-600 shadow-lg shadow-emerald-500/20">
                    + Ajouter
                </button>
            </div>

            {cars.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white/5 rounded-2xl border border-dashed border-white/10">
                    <p>Aucun véhicule trouvé.</p>
                </div>
            ) : (
                cars.map(car => (
                    <div key={car.id} onClick={() => setSelectedCar(car)} className={CARD_STYLE}>
                        <div className="flex items-center gap-4">
                            <img src={car.img} alt={car.model} className="w-20 h-20 object-cover rounded-xl" />
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-white">{car.brand} <span className="text-gray-400 font-normal">{car.model}</span></h3>
                                <p className="text-sm text-emerald-400 mt-1">{car.licensePlate}</p>
                            </div>
                            <button className="btn btn-ghost btn-sm text-gray-400">details ›</button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

// --- SOUS-COMPOSANT : STATISTIQUES ---
const StatsTab = () => (
    <div className="glass-card p-8">
        <h3 className="text-lg font-bold text-white mb-6">Mes Performances</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">4.9</div>
                <div className="text-xs text-gray-400 uppercase">Note</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-white mb-1">1240</div>
                <div className="text-xs text-gray-400 uppercase">Km / Mois</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-emerald-400 mb-1">72kg</div>
                <div className="text-xs text-gray-400 uppercase">CO2 Économisé</div>
            </div>
            <div className="bg-white/5 p-4 rounded-xl text-center">
                <div className="text-3xl font-bold text-white mb-1">18</div>
                <div className="text-xs text-gray-400 uppercase">Trajets</div>
            </div>
        </div>
    </div>
);

// --- DASHBOARD PRINCIPAL ---
export default function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="ecoride-dark-bg min-h-screen pb-10">
      <Navbar /> 

      <div className="container mx-auto px-4 mt-8 max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
            
            {/* SIDEBAR GAUCHE */}
            <div className="lg:w-1/4 space-y-6">
                <div className="glass-card p-6 text-white text-center">
                    <div className="avatar mb-4">
                        <div className="w-24 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
                            <img src={user?.picture || "https://placehold.co/400"} alt="Profil" />
                        </div>
                    </div>
                    <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
                    <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest mt-1">
                        {user?.role === 1 ? 'Passager' : 'Conducteur'}
                    </p>
                    <div className="mt-6 space-y-2">
                        <div className="badge badge-lg bg-emerald-500/20 text-emerald-300 border-none w-full">VIP Member</div>
                        <div className="badge badge-lg bg-white/5 text-gray-300 border-none w-full">Solde : {user?.credits} €</div>
                    </div>
                </div>
            </div>

            {/* CARTE PRINCIPALE */}
            <div className="lg:w-3/4">
                <div className="glass-card p-8 min-h-[600px]">
                    
                    {/* NAVIGATION ONGLETS */}
                    <div className="flex justify-center mb-8">
                        <div className="bg-black/20 p-1 rounded-full inline-flex">
                            <button onClick={() => setActiveTab('general')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                                Profil
                            </button>
                            <button onClick={() => setActiveTab('cars')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'cars' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                                Véhicules
                            </button>
                            <button onClick={() => setActiveTab('stats')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'stats' ? 'bg-emerald-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                                Stats
                            </button>
                        </div>
                    </div>

                    {/* CONTENU */}
                    <div className="animate-fade-in">
                        {activeTab === 'general' && <GeneralTab user={user} />}
                        {activeTab === 'cars' && <CarsTab userId={user?.id} />}
                        {activeTab === 'stats' && <StatsTab />}
                    </div>

                </div>
            </div>

        </div>
      </div>
    </div>
  );
}