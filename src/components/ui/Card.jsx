// components/ui/Card.jsx
// pour créer une carte réutilisable avec des styles personnalisables

import React from 'react';

const Card = ({ children, className = "", onClick, hoverable = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        card-std
        ${hoverable ? "hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;