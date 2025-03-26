import { useState, useEffect, useCallback, useRef } from 'react';
import { fallbackImageBase64, validateAndProcessImage } from '../utils';
import { syncProfileImage } from '../services/api';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo
const REQUEST_TIMEOUT = 5000; // 5 segundos

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
  autoSync = true,
  listenForUpdates = true,
  syncInterval = 300000 // 5 minutos por defecto
} = {}) => {
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const lastRequestTime = useRef(0);
  const requestTimeoutRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const isMounted = useRef(true);

  // Función para manejar errores de carga de imagen
  const handleImageError = useCallback((e) => {
    console.warn('Error al cargar imagen de perfil:', e);
    setProfileImage(fallbackImageBase64);
    setError(new Error('Error al cargar la imagen de perfil'));
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
              if (isMounted.current) {
                setProfileImage(validatedImage);
              }
            })
            .catch(() => {
              console.warn('Imagen de perfil en localStorage no válida');
              if (isMounted.current) {
                setProfileImage(fallbackImageBase64);
              }
            });
        }
      } else {
        if (isMounted.current) {
          setProfileImage(fallbackImageBase64);
        }
      }
    } catch (error) {
      console.error('Error al cargar imagen de localStorage:', error);
      if (isMounted.current) {
        setProfileImage(fallbackImageBase64);
      }
    }
  }, [profileImage]);
  
  // Función para sincronizar la imagen
  const syncImage = useCallback(async (force = false) => {
    if (!isMounted.current) return;

    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime.current;

    // Evitar solicitudes demasiado frecuentes
    if (!force && timeSinceLastRequest < 2000) { // Aumentado a 2 segundos
      console.warn('🛑 Demasiadas solicitudes de sincronización. Ignorando...');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      lastRequestTime.current = now;

      // Limpiar timeout anterior si existe
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }

      // Establecer timeout para la solicitud
      requestTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          throw new Error('Timeout al sincronizar imagen');
        }
      }, REQUEST_TIMEOUT);

      const image = await syncProfileImage();
      
      if (isMounted.current) {
        if (image) {
          setProfileImage(image);
          setRetryCount(0);
        } else {
          // Si no hay imagen, intentar usar profileImage del usuario
          const userData = JSON.parse(localStorage.getItem('userData') || '{}');
          if (userData.profileImage) {
            setProfileImage(userData.profileImage);
            setRetryCount(0);
          } else {
            setProfileImage(fallbackImageBase64);
            setError(new Error('No se encontró imagen de perfil'));
          }
        }
      }
    } catch (err) {
      console.error('Error al sincronizar imagen:', err);
      
      if (isMounted.current) {
        if (retryCount < MAX_RETRIES) {
          // Intentar de nuevo después de un delay
          retryTimeoutRef.current = setTimeout(() => {
            if (isMounted.current) {
              setRetryCount(prev => prev + 1);
            }
          }, RETRY_DELAY);
        } else {
          setProfileImage(fallbackImageBase64);
          setError(err);
        }
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [retryCount]);
  
  // Efecto para sincronización automática
  useEffect(() => {
    if (autoSync) {
      // Esperar un poco antes de la primera sincronización
      const initialSyncTimeout = setTimeout(() => {
        if (isMounted.current) {
          syncImage(true);
        }
      }, 1000);

      return () => clearTimeout(initialSyncTimeout);
    }
  }, [autoSync, syncImage]);

  // Efecto para sincronización periódica
  useEffect(() => {
    if (listenForUpdates) {
      const interval = setInterval(() => {
        if (isMounted.current) {
          syncImage();
        }
      }, syncInterval);

      return () => clearInterval(interval);
    }
  }, [listenForUpdates, syncInterval, syncImage]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    profileImage,
    isLoading,
    error,
    handleImageError,
    syncImage
  };
};

export default useProfileImage; 