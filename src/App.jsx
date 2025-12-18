import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
// Import des pages
import Connexion from './pages/Connexion';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import MyBooking from './pages/MyBooking';
import MyRidesPage from './pages/MyRidesPage';


// Récupération de l'ID Google depuis le .env
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Composant pour protéger les routes (redirige vers /login si non connecté)
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // Petit indicateur de chargement centré pendant que l'auth vérifie le token
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#022c22] text-emerald-400">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

// Composant principal de l'application avec les routes
// et le fournisseur OAuth Google
// ainsi que les contextes d'authentification et de toasts
// Note: Le MainLayout est inclus DANS les pages privées
// pour éviter de l'afficher sur la page de connexion
// et permettre une personnalisation par page si besoin
// (ex: fond d'écran différent sur la page d'accueil)


function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <ToastProvider> 
          <AuthProvider>
            <Routes>
              {/* --- Route Publique --- */}
              <Route path="/login" element={<Connexion />} />

              {/* --- Routes Privées (Nécessitent une connexion) --- */}
              {/* Note: Le MainLayout (Navbar + Background) est inclus DANS ces pages */}

              <Route path="/" element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } />

              <Route path="/dashboard" element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } />

              <Route path="/mybooking" element={
                <PrivateRoute>
                  <MyBooking />
                </PrivateRoute>
              } />

              {/* --- Nouvelle Route pour la gestion des Trajets (Publication) --- */}
              <Route path="/my-rides" element={
                <PrivateRoute>
                  <MyRidesPage />
                </PrivateRoute>
              } />

              {/* --- Redirection par défaut (Catch-all) --- */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;