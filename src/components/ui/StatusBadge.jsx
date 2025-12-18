// components/ui/StatusBadge.jsx
// pour afficher un badge de statut avec des styles basés sur le type de statut 

import React from 'react';

const StatusBadge = ({ children, type = "default", className = "" }) => {
  
  const styles = {
    success: "bg-emerald-100 text-emerald-800 border-emerald-200", // Vert (Actif, Confirmé)
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200",   // Jaune (En attente)
    error:   "bg-red-100 text-red-800 border-red-200",             // Rouge (Annulé, Inactif)
    info:    "bg-blue-100 text-blue-800 border-blue-200",           // Bleu (Infos)
    neutral: "bg-gray-100 text-gray-600 border-gray-200",           // Gris (Passé, Archivé)
    dark:    "bg-gray-800 text-white border-gray-900"               // Noir (Terminé)
  };

  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border
      ${styles[type] || styles.neutral}
      ${className}
    `}>
      {children}
    </span>
  );
};

export default StatusBadge;