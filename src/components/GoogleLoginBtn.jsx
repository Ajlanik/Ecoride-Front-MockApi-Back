import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

// Composant pour le bouton de connexion Google
const GoogleLoginBtn = ({ onLoginSuccess, onLoginError }) => {
  return (
    <div className="my-4">
      <GoogleLogin
        onSuccess={onLoginSuccess}
        onError={onLoginError}
        theme="filled_blue" //  pour le style bleu standard
        shape="pill"        // pour des bords arrondis
      />
    </div>
  );
};

export default GoogleLoginBtn;