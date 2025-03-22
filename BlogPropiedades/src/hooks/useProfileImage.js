import { useState, useEffect, useCallback } from 'react';
import { syncProfileImage } from '../services/api';
import { fallbackImageBase64, validateAndProcessImage } from '../utils/profileUtils';

/**
 * Hook personalizado para manejar la imagen de perfil
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoSync - Si debe sincronizar automáticamente con el servidor al montar
 * @param {boolean} options.listenForUpdates - Si debe escuchar eventos de actualización de imagen
 * @returns {Object} - Estado y funciones para manejar la imagen de perfil
 */
const useProfileImage = (options = {}) => {
  const { autoSync = true, listenForUpdates = true } = options;
  
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Función para sincronizar la imagen con el servidor
  const syncImage = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await syncProfileImage();
      
      if (response && response.imageUrl) {
        const imageUrl = response.imageUrl;
        setProfileImage(imageUrl);
        // Actualizar localStorage solo como caché
        localStorage.setItem('profilePic', imageUrl);
        
        // Notificar a otros componentes
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { imageUrl }
        }));
      } else {
        // Si no hay imagen en el servidor, usar la imagen por defecto
        setProfileImage(fallbackImageBase64);
      }
    } catch (err) {
      console.error('Error al sincronizar imagen:', err);
      setError(err);
      // En caso de error, intentar usar la imagen en caché
      const cachedImage = localStorage.getItem('profilePic');
      if (cachedImage) {
        setProfileImage(cachedImage);
      } else {
        setProfileImage(fallbackImageBase64);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Función para actualizar la imagen
  const updateProfileImage = useCallback(async (newImage) => {
    try {
      setIsLoading(true);
      setError(null);

      // Procesar la imagen antes de enviarla
      const processedImage = await validateAndProcessImage(newImage);
      
      // Crear un Blob desde la imagen base64
      const base64Data = processedImage.split(',')[1];
      const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then(res => res.blob());
      
      // Crear un archivo desde el Blob
      const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
      
      // Actualizar en el servidor
      const response = await syncProfileImage(file);
      
      if (response && response.imageUrl) {
        const imageUrl = response.imageUrl;
        setProfileImage(imageUrl);
        localStorage.setItem('profilePic', imageUrl);
        
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { imageUrl }
        }));
        
        return imageUrl;
      } else {
        throw new Error('No se recibió una URL de imagen válida del servidor');
      }
    } catch (err) {
      console.error('Error al actualizar imagen:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Manejar errores de carga de imagen
  const handleImageError = useCallback(() => {
    console.error('Error al cargar imagen');
    setProfileImage(fallbackImageBase64);
  }, []);
  
  // Efecto para sincronización inicial y periódica
  useEffect(() => {
    if (!autoSync) return;
    
    syncImage();
    
    // Sincronizar cada 5 minutos
    const interval = setInterval(syncImage, 300000);
    
    // Sincronizar cuando la pestaña vuelve a estar activa
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncImage();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoSync, syncImage]);
  
  // Efecto para escuchar actualizaciones de otros componentes
  useEffect(() => {
    if (!listenForUpdates) return;
    
    const handleImageUpdate = (event) => {
      const newImage = event.detail.imageUrl;
      if (newImage && newImage !== profileImage) {
        setProfileImage(newImage);
      }
    };
    
    window.addEventListener('profileImageUpdated', handleImageUpdate);
    return () => window.removeEventListener('profileImageUpdated', handleImageUpdate);
  }, [listenForUpdates, profileImage]);
  
  return {
    profileImage: profileImage || fallbackImageBase64,
    isLoading,
    error,
    syncImage,
    handleImageError,
    updateProfileImage
  };
};

export default useProfileImage; 