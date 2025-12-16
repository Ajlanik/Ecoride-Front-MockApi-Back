import React from 'react';
import { GoogleLogin } from '@react-oauth/google';

const GoogleLoginBtn = ({ onLoginSuccess, onLoginError }) => {
  return (
    <div className="my-4">
      {/* Plus besoin de passer clientId ici, le Provider s'en occupe */}
      <GoogleLogin
        onSuccess={onLoginSuccess}
        onError={onLoginError}
        theme="filled_blue" // Optionnel : pour le style bleu standard
        shape="pill"        // Optionnel : pour des bords arrondis
      />
    </div>
  );
};

export default GoogleLoginBtn;