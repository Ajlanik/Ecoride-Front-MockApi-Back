// components/ui/Card.jsx
// pour créer une carte réutilisable avec des styles personnalisables

import React from 'react';

const Card = ({ children, className = "", onClick, hoverable = false }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white rounded-[1.5rem] border border-gray-100 shadow-sm
        ${hoverable ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer transition-all duration-300' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;