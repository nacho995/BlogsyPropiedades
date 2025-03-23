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
      
      // Intentar con otras fuentes
      const localProfilePic = localStorage.getItem('profilePic_local');
      if (localProfilePic && (localProfilePic.startsWith('http') || localProfilePic.startsWith('data:'))) {
        return localProfilePic;
      }
      
      const base64ProfilePic = localStorage.getItem('profilePic_base64');
      if (base64ProfilePic && base64ProfilePic.startsWith('data:')) {
        return base64ProfilePic;
      }
      
      return null;
    } catch (e) {
      console.error("Error al obtener imagen de perfil del localStorage:", e);
      return null;
    }
  };
  
  const profilePic = getSafeProfileImage();
  
  // Manejar errores de imágenes sin eliminar datos
  useEffect(() => {
    if (imageError) {
      try {
        // En lugar de eliminar, registrar el error
        console.warn("⚠️ Error al cargar imagen de perfil", { 
          tieneImagen: !!profilePic, 
          tipo: profilePic ? (profilePic.startsWith('data:') ? 'base64' : 'url') : 'ninguno' 
        });
        
        // Registrar para diagnóstico
        if (profilePic) {
          try {
            // Guardar registro del error pero sin la imagen completa para evitar datos sensibles
            const errorLog = {
              timestamp: new Date().toISOString(),
              tipoImagen: profilePic.startsWith('data:') ? 'base64' : 'url',
              inicioUrl: profilePic.substring(0, 30) + '...'
            };
            
            localStorage.setItem('lastImageError', JSON.stringify(errorLog));
          } catch (e) {
            console.error("Error al registrar error de imagen:", e);
          }
        }
      } catch (e) {
        console.error("Error al manejar error de imagen:", e);
      }
    }
  }, [imageError, profilePic]);
  
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