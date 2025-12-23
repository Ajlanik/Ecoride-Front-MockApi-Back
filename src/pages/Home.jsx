import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Pour la redirection
import MainLayout from '../layouts/MainLayout';
import { MapPin, Flag, Calendar } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  
  // États pour stocker ce que l'utilisateur tape
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');

  const handleSearch = () => {
    // Redirection vers la page de résultats avec les paramètres dans l'URL
    navigate(`/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&date=${date}`);
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8 drop-shadow-lg">
          Où voulez-vous aller ?
        </h1>
        
        {/* Barre de recherche */}
        <div className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row gap-2 items-center w-full max-w-4xl pr-2">
            
            {/* Champ Départ */}
            <div className="flex items-center px-6 py-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 group focus-within:bg-gray-50 rounded-full transition-colors">
                <MapPin className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                <input 
                    type="text" 
                    placeholder="Départ (ex: Paris)" 
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 font-medium group-focus-within:text-emerald-900" 
                />
            </div>

            {/* Champ Destination */}
            <div className="flex items-center px-6 py-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 group focus-within:bg-gray-50 rounded-full transition-colors">
                <Flag className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                <input 
                    type="text" 
                    placeholder="Destination (ex: Lyon)" 
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 font-medium group-focus-within:text-emerald-900" 
                />
            </div>

            {/* Champ Date */}
            <div className="flex items-center px-6 py-3 w-full md:w-1/4 group focus-within:bg-gray-50 rounded-full transition-colors">
                <Calendar className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
                <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent outline-none w-full text-gray-700 font-medium uppercase text-sm cursor-pointer" 
                />
            </div>

            {/* Bouton Rechercher */}
            <button 
                onClick={handleSearch}
                className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 px-8 rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
               Rechercher
            </button>
        </div>
      </div>
    </MainLayout>
  );
}