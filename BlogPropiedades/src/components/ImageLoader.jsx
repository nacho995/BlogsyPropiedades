import React, { useEffect, useState } from 'react';
import { fallbackImageBase64 } from '../utils/profileUtils';

// Componente mejorado para precargar imágenes con manejo de errores
function ImageLoader() {
  const [imageError, setImageError] = useState(false);
  
  // Imagen por defecto (la misma que usamos en otros componentes)
  const defaultProfilePic = fallbackImageBase64;
  
  // Obtener imagen del localStorage de forma segura
  const getSafeProfileImage = () => {
    try {
      const profilePic = localStorage.getItem('profilePic');
      // Verificar que la URL sea válida
      if (profilePic && (profilePic.startsWith('http') || profilePic.startsWith('data:'))) {
        return profilePic;
      }
      return null;
    } catch (e) {
      console.error("Error al obtener imagen de perfil del localStorage:", e);
      return null;
    }
  };
  
  const profilePic = getSafeProfileImage();
  
  // Limpiar localStorage de imágenes corruptas
  useEffect(() => {
    if (imageError) {
      try {
        // Si hay error, intentar limpiar la imagen corrupta
        localStorage.removeItem('profilePic');
        console.log("🧹 Imagen de perfil problemática eliminada del localStorage");
      } catch (e) {
        console.error("Error al limpiar localStorage:", e);
      }
    }
  }, [imageError]);
  
  return (
    <div style={{ display: 'none' }}>
      {/* Precargar imagen por defecto */}
      <img src={defaultProfilePic} alt="preload default" />
      
      {/* Precargar imagen de perfil si existe */}
      {profilePic && (
        <img 
          src={profilePic} 
          alt="preload profile" 
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export default ImageLoader; 