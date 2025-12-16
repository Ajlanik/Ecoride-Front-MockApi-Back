// Gestion d'un bouton réutilisable avec différents styles et états de chargement
import React from 'react';

const Button = ({ children, variant = "primary", isLoading, className = "", ...props }) => {
  const baseStyle = "btn rounded-full font-bold shadow-md transition-transform active:scale-95 border-none";
  
  const variants = {
    primary: "bg-emerald-600 hover:bg-emerald-700 text-white",
    secondary: "bg-white text-emerald-900 hover:bg-gray-200",
    outline: "btn-outline text-white hover:bg-white/10 hover:border-white",
    ghost: "btn-ghost text-emerald-600 hover:bg-emerald-50",
    danger: "btn-error text-white"
  };

  return (
    <button 
      className={`${baseStyle} ${variants[variant]} ${className}`} 
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <span className="loading loading-spinner"></span> : children}
    </button>
  );
};

export default Button;