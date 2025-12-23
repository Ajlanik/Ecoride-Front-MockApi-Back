import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import SearchResults from './pages/SearchResults';

// Import des pages
import Connexion from './pages/Connexion';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import MyBooking from './pages/MyBooking';
// SUPPRIMÉ : import MyRidesPage ...

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#022c22] text-emerald-400">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <Router>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* --- Route Publique --- */}
              <Route path="/login" element={<Connexion />} />

              {/* --- Routes Privées --- */}
              <Route path="/" element={
                <PrivateRoute>
                  <Home />
                </PrivateRoute>
              } />

              {/* Le Dashboard gère maintenant les sous-pages via ?tab=... */}
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
              <Route path="/search" element={
                <PrivateRoute>
                  <SearchResults />
                </PrivateRoute>
              } />
              {/* SUPPRIMÉ : Route /my-rides */}

              {/* --- Catch-all --- */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AuthProvider>
        </ToastProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;