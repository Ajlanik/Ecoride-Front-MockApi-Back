// src/components/FacebookLoginBtn.jsx
import React from 'react';
import FacebookLogin from '@greatsumini/react-facebook-login';

// On récupère l'ID depuis le fichier .env
const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

const FacebookLoginBtn = ({ onLoginSuccess, onLoginError }) => {

  return (
    <div className="my-2 w-full">
      <FacebookLogin
        appId={appId}
        // On demande l'accès au profil public et à l'email
        fields="name,email,picture"

        // En cas de succès de la connexion technique
        onSuccess={(response) => {
          console.log('FB Login success, token:', response.accessToken);
        }}

        // En cas d'échec
        onFail={(error) => {
          console.error('Login Facebook Failed:', error);
          if (onLoginError) onLoginError(error);
        }}

        // Une fois le profil récupéré (C'est ce qui nous intéresse)
        onProfileSuccess={(response) => {
          console.log('Profile Facebook récupéré:', response);

          // On construit l'objet à envoyer au backend
          const socialData = {
            provider: 'facebook',
            token: response.id, 
            email: response.email,
            firstName: response.first_name || response.name.split(' ')[0],
            lastName: response.last_name || response.name.split(' ')[1] || 'Facebook',
          };

          // CORRECTION ICI : On envoie 'socialData' (l'objet propre), PAS 'response'
          if (onLoginSuccess) onLoginSuccess(socialData); 
        }}

        // Rendu visuel personnalisé du bouton
        render={({ onClick }) => (
          <button
            onClick={onClick}
            className="btn w-full bg-[#1877F2] hover:bg-[#166fe5] text-white border-none shadow-md flex items-center gap-2 rounded-full font-bold normal-case"
          >
            {/* Logo Facebook SVG simple (blanc) */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" className="w-4 h-4 fill-current">
              <path d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z" />
            </svg>
            Continuer avec Facebook
          </button>
        )}
      />
    </div>
  );
};

export default FacebookLoginBtn;