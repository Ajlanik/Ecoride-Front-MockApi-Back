// components/ui/Loader.jsx
// pour afficher un indicateur de chargement avec un tourniquer et du texte

import React from 'react';

const Loader = ({ text = "Chargement..." }) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 animate-fade-in">
      {/* Spinner DaisyUI en Vert EcoRide */}
      <span className="loading loading-spinner loading-lg text-[#6CF527]"></span>
      <p className="text-gray-400 font-medium tracking-wide animate-pulse">{text}</p>
    </div>
  );
};

export default Loader;