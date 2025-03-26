import { useState, useEffect } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook mejorado para manejar la imagen de perfil usando localStorage
 * Con sincronización entre componentes mediante eventos del navegador
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Función para emitir evento de actualización
  const notifyImageUpdate = (imageData) => {
    console.log("🔄 Notificando actualización de imagen de perfil");
    
    try {
      // Emitir evento para otros componentes
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: imageData } 
      }));
      
      // Guardar en múltiples ubicaciones para mayor robustez
      localStorage.setItem('profilePic', imageData);
      localStorage.setItem('profilePic_backup', imageData);
      localStorage.setItem('profilePic_lastUpdate', new Date().toISOString());
      
      // Guardar en userData si existe
      try {
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        userData.profilePic = imageData;
        localStorage.setItem('userData', JSON.stringify(userData));
      } catch (e) {
        console.warn('Error al actualizar userData:', e);
      }
      
      return true;
    } catch (err) {
      console.error('Error al notificar actualización de imagen:', err);
      return false;
    }
  };
  
  // Escuchar cambios en la imagen de perfil desde otros componentes
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      console.log("📥 Recibida actualización de imagen de perfil");
      const newImage = event.detail.profileImage;
      if (newImage) {
        setProfileImage(newImage);
      }
    };
    
    // Registrar el listener para el evento personalizado
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    // Cargar imagen del localStorage al montar el componente
    try {
      // Intentar varias fuentes en orden de prioridad
      const storedImage = localStorage.getItem('profilePic') || 
                         localStorage.getItem('profilePic_backup') ||
                         localStorage.getItem('profilePic_local');
                         
      if (storedImage) {
        console.log("🖼️ Imagen cargada del localStorage");
        setProfileImage(storedImage);
      } else {
        // Intentar obtener de userData
        try {
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (userData.profilePic) {
            console.log("🖼️ Imagen cargada de userData");
            setProfileImage(userData.profilePic);
            
            // Guardar en profilePic para futuras cargas
            localStorage.setItem('profilePic', userData.profilePic);
          }
        } catch (e) {
          console.warn('Error al leer userData:', e);
        }
      }
    } catch (err) {
      console.error('Error al cargar imagen del localStorage:', err);
      setError('Error al cargar la imagen de perfil');
    }
    
    // Limpiar el listener al desmontar
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);
  
  // Manejar error de carga de imagen
  const handleImageError = () => {
    console.log("❌ Error al cargar imagen, usando fallback");
    setProfileImage(fallbackImageBase64);
  };
  
  // Actualizar la imagen en localStorage y notificar a otros componentes
  const updateProfileImage = async (newImage) => {
    try {
      console.log("📤 Actualizando imagen de perfil");
      setIsLoading(true);
      setError(null);
      
      // Actualizar el estado local
      setProfileImage(newImage);
      
      // Notificar a otros componentes del cambio
      notifyImageUpdate(newImage);
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error al actualizar imagen de perfil:', err);
      setError('Error al guardar la imagen');
      setIsLoading(false);
      return false;
    }
  };
  
  return {
    profileImage,
    isLoading,
    error,
    handleImageError,
    updateProfileImage,
    notifyImageUpdate // Exportamos también esta función para usos avanzados
  };
};

export default useProfileImage; 