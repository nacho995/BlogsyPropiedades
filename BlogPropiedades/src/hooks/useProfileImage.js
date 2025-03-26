import { useState, useEffect } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook mejorado para manejar la imagen de perfil
 * Versión simple y directa que garantiza sincronización
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cargar imagen al iniciar
  useEffect(() => {
    try {
      // Intentar cargar desde localStorage
      const storedImage = localStorage.getItem('profilePic');
      if (storedImage && storedImage !== 'undefined' && storedImage !== 'null') {
        console.log("🖼️ Hook: Cargando imagen desde localStorage");
        setProfileImage(storedImage);
      }
    } catch (err) {
      console.error('Error al cargar imagen de perfil inicial:', err);
      setError('Error al cargar la imagen de perfil');
    }
  }, []);
  
  // Función de notificación global simple y directa
  const broadcastUpdate = (imageData) => {
    console.log("📣 Hook: Enviando notificación de actualización de imagen");
    
    // 1. Guardar en localStorage en múltiples ubicaciones
    try {
      localStorage.setItem('profilePic', imageData);
      localStorage.setItem('profilePic_backup', imageData);
      localStorage.setItem('profilePic_lastUpdate', new Date().toISOString());
    } catch (err) {
      console.error('Error al guardar imagen en localStorage:', err);
    }
    
    // 2. Enviar evento global
    try {
      const event = new CustomEvent('profileImageUpdated', {
        detail: { profileImage: imageData, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    } catch (err) {
      console.error('Error al emitir evento de actualización:', err);
    }
    
    // 3. También guardar en userData si existe
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      userData.profilePic = imageData;
      localStorage.setItem('userData', JSON.stringify(userData));
    } catch (err) {
      console.warn('Error al actualizar userData:', err);
    }
  };
  
  // Manejar error de carga de imagen
  const handleImageError = () => {
    console.log("❌ Error al cargar imagen en Hook, usando fallback");
    setProfileImage(fallbackImageBase64);
  };
  
  // Actualizar la imagen con enfoque directo
  const updateProfileImage = async (newImage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("📤 Hook: Actualizando imagen de perfil");
      
      // 1. Establecer la imagen en el estado local
      setProfileImage(newImage);
      
      // 2. Transmitir la actualización a toda la aplicación
      broadcastUpdate(newImage);
      
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
    broadcastUpdate  // Exportamos para usos avanzados
  };
};

export default useProfileImage; 