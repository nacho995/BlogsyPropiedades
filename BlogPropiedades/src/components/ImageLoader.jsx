import React, { useEffect } from 'react';

/**
 * Componente para precargar la imagen de perfil
 */
const ImageLoader = () => {
  // Precargar imagen al montar el componente
  useEffect(() => {
    try {
      const profileImageUrl = localStorage.getItem('profilePic');
      
      if (profileImageUrl) {
        const img = new Image();
        img.src = profileImageUrl;
      }
    } catch (error) {
      console.error('Error al precargar imagen:', error);
    }
  }, []);
  
  // Este componente no renderiza nada visible
  return null;
};

export default ImageLoader; 