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
    if (!force && timeSinceLastRequest < 3000) { // Aumentado a 3 segundos
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

      // Primero intentar usar datos del usuario
      let userData = null;
      try {
        userData = JSON.parse(localStorage.getItem('userData') || '{}');
      } catch (err) {
        console.warn('Error al analizar datos de usuario:', err);
      }

      // Si no hay datos en localStorage pero tenemos info en la respuesta
      if (!userData || !Object.keys(userData).length) {
        try {
          // Comprobar si hay información del usuario en la respuesta
          const responseData = localStorage.getItem('userResponse');
          if (responseData) {
            try {
              const parsedData = JSON.parse(responseData);
              if (parsedData && parsedData.profileImage) {
                // Guardar información en localStorage para uso futuro
                localStorage.setItem('userData', JSON.stringify({
                  ...parsedData
                }));
                
                // Guardar URL directamente
                if (typeof parsedData.profileImage === 'string') {
                  localStorage.setItem('profilePic', parsedData.profileImage);
                } else if (parsedData.profileImage && typeof parsedData.profileImage === 'object' && 
                          (parsedData.profileImage.src || parsedData.profileImage.url)) {
                  localStorage.setItem('profilePic', parsedData.profileImage.src || parsedData.profileImage.url);
                }
                
                userData = parsedData;
                console.log('Datos de usuario recuperados de la respuesta y almacenados');
              }
            } catch (e) {
              console.warn('Error al procesar respuesta del usuario:', e);
            }
          }
        } catch (err) {
          console.warn('Error al recuperar datos de la respuesta:', err);
        }
      }

      // Establecer timeout para la solicitud
      requestTimeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          console.warn('Timeout al sincronizar imagen');
          setIsLoading(false);
          
          // Si tenemos datos del usuario, usar la imagen de allí
          if (userData && userData.profileImage) {
            if (typeof userData.profileImage === 'string') {
              setProfileImage(userData.profileImage);
            } else if (userData.profileImage && typeof userData.profileImage === 'object') {
              const url = userData.profileImage.src || userData.profileImage.url;
              if (url) setProfileImage(url);
            }
          } else {
            setProfileImage(fallbackImageBase64);
          }
        }
      }, REQUEST_TIMEOUT);

      // Intentar sincronizar con la API
      const image = await syncProfileImage(userData);
      
      // Limpiar timeout ya que obtuvimos respuesta
      if (requestTimeoutRef.current) {
        clearTimeout(requestTimeoutRef.current);
        requestTimeoutRef.current = null;
      }
      
      if (isMounted.current) {
        if (image) {
          setProfileImage(image);
          setRetryCount(0);
        } else {
          // Si no hay imagen, intentar usar profileImage del usuario
          if (userData && userData.profileImage) {
            let imageUrl = null;
            
            if (typeof userData.profileImage === 'string') {
              imageUrl = userData.profileImage;
            } else if (userData.profileImage && typeof userData.profileImage === 'object') {
              imageUrl = userData.profileImage.src || userData.profileImage.url;
            }
            
            if (imageUrl) {
              setProfileImage(imageUrl);
              localStorage.setItem('profilePic', imageUrl);
              setRetryCount(0);
              console.log('Usando imagen de perfil desde datos de usuario:', imageUrl);
            } else {
              setProfileImage(fallbackImageBase64);
              setError(new Error('Formato de imagen de perfil no válido'));
            }
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
              syncImage(true); // Forzar reintento
            }
          }, RETRY_DELAY * (retryCount + 1)); // Aumento progresivo del tiempo entre reintentos
        } else {
          // Después de los reintentos, usar imagen por defecto
          setProfileImage(fallbackImageBase64);
          setError(err);
          
          // Intentar usar datos del usuario como último recurso
          try {
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');
            if (userData && userData.profileImage) {
              let imageUrl = null;
              
              if (typeof userData.profileImage === 'string') {
                imageUrl = userData.profileImage;
              } else if (userData.profileImage && typeof userData.profileImage === 'object') {
                imageUrl = userData.profileImage.src || userData.profileImage.url;
              }
              
              if (imageUrl) {
                setProfileImage(imageUrl);
                localStorage.setItem('profilePic', imageUrl);
                console.log('Usando imagen de perfil desde datos de usuario (después de errores):', imageUrl);
              }
            }
          } catch (e) {
            console.warn('Error al procesar datos de usuario como respaldo:', e);
          }
        }
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [retryCount]);

  // Efecto para verificar si hay datos de usuario con profileImage
  useEffect(() => {
    // Verificar si hay información en localStorage
    try {
      const userResponse = localStorage.getItem('userResponse');
      if (userResponse) {
        const userData = JSON.parse(userResponse);
        
        // Si hay una respuesta con imagen de perfil y no tenemos nada en localStorage
        if (userData && userData.profileImage && !localStorage.getItem('profilePic')) {
          let imageUrl = null;
          
          if (typeof userData.profileImage === 'string') {
            imageUrl = userData.profileImage;
          } else if (userData.profileImage && typeof userData.profileImage === 'object') {
            imageUrl = userData.profileImage.src || userData.profileImage.url;
          }
          
          if (imageUrl) {
            // Guardar la imagen en localStorage para uso futuro
            localStorage.setItem('profilePic', imageUrl);
            localStorage.setItem('userData', JSON.stringify(userData));
            
            // Actualizar el estado si estamos montados
            if (isMounted.current) {
              setProfileImage(imageUrl);
            }
            
            console.log('Datos de usuario recuperados automáticamente de localStorage');
          }
        }
      }
    } catch (err) {
      console.warn('Error al verificar datos de usuario en localStorage:', err);
    }
  }, []);

  // Efecto para sincronización automática
  useEffect(() => {
    if (autoSync) {
      // Esperar un poco antes de la primera sincronización
      const initialSyncTimeout = setTimeout(() => {
        if (isMounted.current) {
          syncImage(true);
        }
      }, 1500); // Aumentado a 1.5 segundos

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