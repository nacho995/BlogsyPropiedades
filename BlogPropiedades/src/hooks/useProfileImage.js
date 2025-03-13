import { useState, useEffect, useCallback, useRef } from 'react';
import { syncProfileImage } from '../services/api';
import { fallbackImageBase64, validateAndProcessImage } from '../utils/profileUtils';

/**
 * Hook personalizado para manejar la imagen de perfil
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.autoSync - Si debe sincronizar automáticamente con el servidor al montar
 * @param {boolean} options.listenForUpdates - Si debe escuchar eventos de actualización de imagen
 * @param {number} options.syncInterval - Intervalo de sincronización en milisegundos
 * @returns {Object} - Estado y funciones para manejar la imagen de perfil
 */
const useProfileImage = (options = {}) => {
  const { autoSync = true, listenForUpdates = true, syncInterval = 300000 } = options;
  
  // Estado para la imagen de perfil
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastSync, setLastSync] = useState(null);
  const syncTimeoutRef = useRef(null);
  
  // Función para sincronizar la imagen
  const syncImage = useCallback(async (force = false) => {
    try {
      // No sincronizar si ya se hizo recientemente y no es forzado
      if (!force && lastSync && (Date.now() - lastSync) < 60000) {
        return;
      }

      setIsLoading(true);
      setError(null);
      
      const syncedImage = await syncProfileImage();
      if (syncedImage) {
        setProfileImage(syncedImage);
        // Disparar evento para otros componentes
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { imageUrl: syncedImage }
        }));
      }
      
      setLastSync(Date.now());
    } catch (err) {
      console.error('Error en sincronización:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [lastSync]);
  
  // Función para actualizar la imagen
  const updateProfileImage = useCallback(async (newImage) => {
    try {
      setIsLoading(true);
      setError(null);

      // Procesar y validar la imagen
      const processedImage = await validateAndProcessImage(newImage);
      
      // Guardar en localStorage
      localStorage.setItem('profilePic', processedImage);
      localStorage.setItem('profilePic_local', processedImage);
      localStorage.setItem('profilePic_base64', processedImage);
      
      // Actualizar estado local
      setProfileImage(processedImage);
      
      // Forzar sincronización inmediata
      await syncImage(true);
      
      return processedImage;
    } catch (err) {
      console.error('Error al actualizar imagen:', err);
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [syncImage]);
  
  // Manejar errores de carga
  const handleImageError = useCallback(() => {
    console.error('Error al cargar imagen');
    syncImage(true); // Intentar resincronizar
  }, [syncImage]);
  
  // Efecto para sincronización periódica
  useEffect(() => {
    if (!autoSync) return;

    const startPeriodicSync = () => {
      // Limpiar timeout anterior si existe
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      // Configurar nueva sincronización periódica
      syncTimeoutRef.current = setInterval(() => {
        syncImage();
      }, syncInterval);
    };

    // Iniciar sincronización periódica
    startPeriodicSync();

    // Manejar visibilidad del documento
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncImage(); // Sincronizar al volver a la pestaña
        startPeriodicSync(); // Reiniciar sincronización periódica
      } else {
        // Limpiar interval cuando la pestaña no es visible
        if (syncTimeoutRef.current) {
          clearInterval(syncTimeoutRef.current);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar al desmontar
    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoSync, syncInterval, syncImage]);
  
  // Efecto para escuchar eventos de actualización
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
  
  // Efecto para carga inicial
  useEffect(() => {
    const loadInitialImage = async () => {
      setIsLoading(true);
      try {
        // Intentar cargar imagen local primero
        const localImage = localStorage.getItem('profilePic') || 
                         localStorage.getItem('profilePic_local') || 
                         localStorage.getItem('profilePic_base64');
        
        if (localImage) {
          setProfileImage(localImage);
        }

        // Si autoSync está habilitado, sincronizar con servidor
        if (autoSync) {
          await syncImage();
        }
      } catch (err) {
        console.error('Error en carga inicial:', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialImage();
  }, [autoSync, syncImage]);
  
  return {
    profileImage,
    isLoading,
    error,
    syncImage,
    handleImageError,
    updateProfileImage
  };
};

export default useProfileImage; 