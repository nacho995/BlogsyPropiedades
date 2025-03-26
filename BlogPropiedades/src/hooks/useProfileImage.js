import { useState, useEffect, useCallback } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook mejorado para manejar la imagen de perfil
 * Versión robusta que maneja imágenes locales y remotas
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Inicializar imagen desde localStorage
  useEffect(() => {
    const loadImageFromStorage = () => {
      try {
        // Buscar imagen en varios lugares posibles en localStorage
        const storedImage = localStorage.getItem('profilePic') || 
                           localStorage.getItem('profilePic_backup');
        
        if (storedImage && 
            storedImage !== 'undefined' && 
            storedImage !== 'null' && 
            typeof storedImage === 'string') {
          console.log("🖼️ Cargando imagen de perfil desde localStorage");
          setProfileImage(storedImage);
        } else {
          // Si no hay imagen válida, establecer la de respaldo y guardarla
          console.log("⚠️ No hay imagen válida en localStorage, usando fallback");
          localStorage.setItem('profilePic', fallbackImageBase64);
          setProfileImage(fallbackImageBase64);
        }
      } catch (err) {
        console.error("Error al cargar imagen inicial:", err);
        setProfileImage(fallbackImageBase64);
      }
    };
    
    loadImageFromStorage();
    
    // Escuchar eventos de cambio de imagen
    const handleStorageChange = (event) => {
      if (event.key === 'profilePic' && event.newValue) {
        console.log("📣 Cambio detectado en localStorage:", event.key);
        setProfileImage(event.newValue);
      }
    };
    
    // Agregar escuchador para storage (útil en múltiples pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // Agregar escuchador para eventos personalizados
    const handleImageUpdate = (event) => {
      const newImage = event.detail?.profileImage;
      if (newImage && typeof newImage === 'string') {
        console.log("📣 Evento de actualización de imagen recibido");
        setProfileImage(newImage);
      }
    };
    
    window.addEventListener('profileImageUpdated', handleImageUpdate);
    
    // Limpiar escuchadores al desmontar
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleImageUpdate);
    };
  }, []);
  
  // Manejar error de carga de imagen
  const handleImageError = useCallback(() => {
    console.log("❌ Error al cargar imagen, usando fallback");
    setProfileImage(fallbackImageBase64);
    
    // También actualizar en localStorage
    try {
      localStorage.setItem('profilePic', fallbackImageBase64);
    } catch (err) {
      console.error("Error al guardar imagen fallback:", err);
    }
  }, []);
  
  // Función para notificar a toda la aplicación sobre cambios de imagen
  const notifyImageUpdate = useCallback((imageData) => {
    console.log("🔄 Notificando cambio de imagen a toda la aplicación");
    
    // 1. Guardar en localStorage (disponible para todas las partes de la app)
    try {
      localStorage.setItem('profilePic', imageData);
      localStorage.setItem('profilePic_backup', imageData);
      localStorage.setItem('profilePic_lastUpdate', Date.now().toString());
    } catch (err) {
      console.error("Error al guardar imagen en localStorage:", err);
    }
    
    // 2. Emitir evento personalizado (para componentes activos)
    try {
      window.dispatchEvent(new CustomEvent('profileImageUpdated', {
        detail: { profileImage: imageData, timestamp: Date.now() }
      }));
    } catch (err) {
      console.error("Error al emitir evento de actualización:", err);
    }
  }, []);
  
  // Actualizar imagen de perfil (función principal)
  const updateProfileImage = useCallback(async (newImage) => {
    if (!newImage || typeof newImage !== 'string') {
      console.error("🚫 Imagen inválida proporcionada");
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log("🔄 Actualizando imagen de perfil...");
      
      // 1. Actualizar el estado local
      setProfileImage(newImage);
      
      // 2. Notificar a toda la aplicación
      notifyImageUpdate(newImage);
      
      setIsLoading(false);
      console.log("✅ Imagen actualizada correctamente");
      return true;
    } catch (err) {
      console.error("❌ Error al actualizar imagen:", err);
      setError("Error al actualizar la imagen de perfil");
      setIsLoading(false);
      return false;
    }
  }, [notifyImageUpdate]);
  
  return {
    profileImage: profileImage || fallbackImageBase64,
    isLoading,
    error,
    handleImageError,
    updateProfileImage,
    notifyImageUpdate,
    fallbackImageBase64
  };
};

export default useProfileImage; 