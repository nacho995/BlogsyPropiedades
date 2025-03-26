import { useState, useEffect, useCallback } from 'react';
import { fallbackImageBase64, validateAndProcessImage } from '../utils';
import { syncProfileImage } from '../services/api';

/**
 * Hook personalizado para manejar la imagen de perfil
 * 
 * Características:
 * - Carga automática desde localStorage
 * - Sincronización con el servidor
 * - Manejo automático de errores
 * - Capacidad de escuchar actualizaciones externas
 * 
 * @param {Object} options Configuración del hook
 * @param {boolean} options.autoSync Si debe sincronizar automáticamente con el servidor
 * @param {boolean} options.listenForUpdates Si debe escuchar actualizaciones de otras partes de la app
 * @returns {Object} Estado y funciones de manejo de la imagen de perfil
 */
const useProfileImage = ({ 
  autoSync = false,
  listenForUpdates = false
} = {}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Función para manejar errores de imagen
  const handleImageError = useCallback((e) => {
    console.error('Error al cargar imagen de perfil');
    if (e?.target) {
      e.target.src = fallbackImageBase64;
    }
    setProfileImage(fallbackImageBase64);
  }, []);
  
  // Cargar imagen desde localStorage
  const loadLocalImage = useCallback(() => {
    try {
      const storedImage = localStorage.getItem('profilePic');
      if (storedImage) {
        if (storedImage !== profileImage) {
          // Verificar y validar la imagen antes de establecerla
          validateAndProcessImage(storedImage)
            .then(validatedImage => {
              setProfileImage(validatedImage);
            })
            .catch(() => {
              console.warn('Imagen de perfil en localStorage no válida');
              setProfileImage(fallbackImageBase64);
            });
        }
      } else {
        setProfileImage(fallbackImageBase64);
      }
    } catch (error) {
      console.error('Error al cargar imagen de localStorage:', error);
      setProfileImage(fallbackImageBase64);
    }
  }, [profileImage]);
  
  // Sincronizar imagen con el servidor
  const syncImage = useCallback(async () => {
    // Solo sincronizar si hay un token
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No hay token, no se puede sincronizar imagen');
      return null;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await syncProfileImage();
      
      if (result && result.imageUrl) {
        // Verificar y procesar la URL antes de guardarla
        const processedImage = await validateAndProcessImage(result.imageUrl);
        
        // Guardar en localStorage
        localStorage.setItem('profilePic', processedImage);
        setProfileImage(processedImage);
        
        setIsLoading(false);
        return processedImage;
      } else {
        setIsLoading(false);
        return null;
      }
    } catch (error) {
      console.error('Error al sincronizar imagen de perfil:', error);
      setError(error);
      setIsLoading(false);
      return null;
    }
  }, []);
  
  // Efecto para cargar la imagen al montar el componente
  useEffect(() => {
    loadLocalImage();
    
    // Si autoSync está habilitado, sincronizar con el servidor
    if (autoSync) {
      syncImage().catch(err => {
        console.error('Error en sincronización automática de imagen:', err);
      });
    }
  }, [loadLocalImage, autoSync, syncImage]);
  
  // Efecto para escuchar actualizaciones desde otras partes de la app
  useEffect(() => {
    if (!listenForUpdates) return;
    
    const handleStorageChange = (e) => {
      if (e.key === 'profilePic') {
        loadLocalImage();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('profile-image-updated', loadLocalImage);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('profile-image-updated', loadLocalImage);
    };
  }, [loadLocalImage, listenForUpdates]);
  
  return {
    profileImage,
    isLoading,
    error,
    syncImage,
    handleImageError,
    setProfileImage
  };
};

export default useProfileImage; 