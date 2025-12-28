import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { Calendar, Search } from 'lucide-react';
import AddressAutocomplete from '../components/ui/AddressAutocomplete';
import Button from '../components/ui/Button';

export default function Home() {
  const navigate = useNavigate();

  // États pour stocker les lieux complets (avec coordonnées)
  // NOTE : Pour la recherche actuelle, on utilise surtout l'adresse (texte).
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);
  const [date, setDate] = useState('');

  const handleSearch = () => {
    // Construction de l'URL avec des paramètres simples :
    // - from : texte départ
    // - to : texte destination
    // - date : YYYY-MM-DD
    const params = new URLSearchParams();

    if (fromPlace?.address) {
      params.append('from', fromPlace.address);
    }

    if (toPlace?.address) {
      params.append('to', toPlace.address);
    }

    if (date) {
      params.append('date', date);
    }

    // Redirection vers la page de résultats
    navigate(`/search?${params.toString()}`);
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in relative z-10">

        {/* Titre Accrocheur */}
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-8 drop-shadow-lg tracking-tight">
          Où voulez-vous <span className="text-emerald-300">aller</span> ?
        </h1>

        {/* Barre de recherche Flottante */}
        <div className="bg-white p-3 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-3 items-center w-full max-w-5xl">

          {/* Champ Départ (Autocomplete) */}
          <div className="w-full md:w-[35%] relative z-30">
            <AddressAutocomplete
              placeholder="Départ (ex: Namur)"
              onSelect={(place) => setFromPlace(place)}
              // On retire le label pour un look plus "Hero" sur la home
            />
          </div>

          {/* Séparateur Visuel (Mobile: caché, Desktop: ligne) */}
          <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>

          {/* Champ Arrivée (Autocomplete) */}
          <div className="w-full md:w-[35%] relative z-20">
            <AddressAutocomplete
              placeholder="Destination (ex: Charleroi)"
              onSelect={(place) => setToPlace(place)}
            />
          </div>

          {/* Séparateur */}
          <div className="hidden md:block w-px h-10 bg-gray-200 mx-2"></div>

          {/* Champ Date */}
          <div className="flex items-center px-4 py-2 w-full md:w-auto bg-gray-50 rounded-xl border border-transparent focus-within:border-emerald-500 focus-within:bg-white transition-all">
            <Calendar className="w-5 h-5 text-emerald-500 mr-2 shrink-0" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-transparent outline-none w-full text-gray-700 font-medium uppercase text-sm cursor-pointer"
            />
          </div>

          {/* Bouton Rechercher */}
          <Button
            onClick={handleSearch}
            className="w-full md:w-auto h-12 md:h-14 px-8 rounded-full text-lg shadow-lg shadow-emerald-500/30"
            // ---------------------------------------------------------------------
            // @@@@@ a décommenter si on veut empêcher de chercher si tout est vide
            // ---------------------------------------------------------------------
            // disabled={!fromPlace && !toPlace}  
          >
            <Search className="w-5 h-5 mr-2" />
            Rechercher
          </Button>
        </div>

        {/* Arguments de réassurance sous la barre */}
        {/* IMPORTANT : pas d'icônes/emoji hardcodés, on garde du texte simple */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-emerald-100 text-sm font-medium opacity-90">
          <span>Covoiturage fiable</span>
          <span>Réservation rapide</span>
          <span>Économique et écologique</span>
        </div>

      </div>
    </MainLayout>
  );
}
