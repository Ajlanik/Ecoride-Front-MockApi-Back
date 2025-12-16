import React from 'react';
import MainLayout from '../layouts/MainLayout';
import Button from '../components/ui/Button'; // Utilisation de ton nouveau bouton

export default function Home() {
  return (
    <MainLayout>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-8">
          Où voulez-vous aller ?
        </h1>
        
        {/* Barre de recherche style "EcoRide" */}
        <div className="bg-white p-2 rounded-full shadow-2xl flex flex-col md:flex-row gap-2 items-center w-full max-w-4xl pr-2">
            
            <div className="flex items-center px-6 py-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100">
                <span className="text-xl mr-3">📍</span>
                <input type="text" placeholder="Départ" className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 font-medium" />
            </div>

            <div className="flex items-center px-6 py-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100">
                <span className="text-xl mr-3">🏁</span>
                <input type="text" placeholder="Destination" className="bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 font-medium" />
            </div>

            <div className="flex items-center px-6 py-3 w-full md:w-1/4">
                <span className="text-xl mr-3">📅</span>
                <input type="date" className="bg-transparent outline-none w-full text-gray-700 font-medium" />
            </div>

            {/* Ici on utilise ton nouveau Button */}
            <Button className="w-full md:w-auto rounded-full px-8 py-3 h-auto min-h-0 text-lg">
                Rechercher
            </Button>
        </div>

      </div>
    </MainLayout>
  );
}