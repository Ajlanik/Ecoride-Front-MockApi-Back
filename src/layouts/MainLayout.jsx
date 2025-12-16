// Le layout principal de l'application avec une barre de navigation et un conteneur centré

import React from 'react';
import Navbar from '../components/Navbar';

const MainLayout = ({ children }) => {
  return (
    <div className="ecoride-bg min-h-screen flex flex-col">
      <Navbar />
      {/* Container principal centré avec padding standard */}
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default MainLayout;