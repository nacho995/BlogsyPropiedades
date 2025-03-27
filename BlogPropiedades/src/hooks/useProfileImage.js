import { useState, useEffect } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook para gestionar la imagen de perfil del usuario con persistencia
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar la imagen al montar el componente
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    
    try {
      // Primero intentar cargar de localStorage principal
      const storedImage = localStorage.getItem('profilePic');
      
      if (storedImage && 
          storedImage !== 'undefined' && 
          storedImage !== 'null' && 
          typeof storedImage === 'string') {
        
        console.log("useProfileImage: Cargando imagen de localStorage");
        
        // Asegurar que también esté en backup
        localStorage.setItem('profilePic_backup', storedImage);
        
        if (isMounted) {
          setProfileImage(storedImage);
          setIsLoading(false);
        }
      } 
      // Si no hay imagen principal, intentar cargar del backup
      else {
        console.log("useProfileImage: No se encontró imagen en localStorage principal, buscando en backup");
        const backupImage = localStorage.getItem('profilePic_backup');
        
        if (backupImage && 
            backupImage !== 'undefined' && 
            backupImage !== 'null' && 
            typeof backupImage === 'string') {
          
          console.log("useProfileImage: Recuperando imagen desde backup");
          
          // Restaurar en localStorage principal
          localStorage.setItem('profilePic', backupImage);
          
          if (isMounted) {
            setProfileImage(backupImage);
            setIsLoading(false);
          }
        } else {
          // No hay imagen disponible, usar fallback
          console.log("useProfileImage: No se encontró imagen en ningún almacenamiento");
          if (isMounted) {
            setProfileImage(fallbackImageBase64);
            setIsLoading(false);
          }
        }
      }
    } catch (err) {
      console.error("useProfileImage: Error al cargar imagen:", err);
      if (isMounted) {
        setError({
          message: 'Error al cargar la imagen de perfil',
          original: err
        });
        setProfileImage(fallbackImageBase64);
        setIsLoading(false);
      }
    }
    
    // Escuchar actualizaciones en tiempo real
    const handleProfileUpdate = (event) => {
      try {
        if (event.detail?.profileImage && 
            typeof event.detail.profileImage === 'string' &&
            isMounted) {
          
          console.log("useProfileImage: Actualizando imagen por evento");
          
          setProfileImage(event.detail.profileImage);
          
          // También guardar en localStorage como respaldo
          localStorage.setItem('profilePic', event.detail.profileImage);
          localStorage.setItem('profilePic_backup', event.detail.profileImage);
        }
      } catch (err) {
        console.error("useProfileImage: Error al procesar evento de actualización:", err);
      }
    };
    
    // Registrar listener para actualización en tiempo real
    window.addEventListener('profileImageUpdated', handleProfileUpdate);
    
    // Limpiar al desmontar
    return () => {
      isMounted = false;
      window.removeEventListener('profileImageUpdated', handleProfileUpdate);
    };
  }, []);

  // Función para manejar errores de carga de imagen
  const handleImageError = () => {
    console.warn("useProfileImage: Error al cargar imagen, usando fallback");
    setProfileImage(fallbackImageBase64);
    setError({
      message: 'No se pudo cargar la imagen de perfil'
    });
  };

  // Función para actualizar la imagen de perfil
  const updateProfileImage = async (newImage) => {
    if (!newImage) return false;
    
    try {
      // Verificar que la imagen sea válida
      if (typeof newImage !== 'string' || 
          newImage === 'undefined' || 
          newImage === 'null') {
        console.warn('updateProfileImage: Imagen inválida proporcionada');
        return false;
      }
      
      console.log("useProfileImage: Actualizando imagen manualmente");
      
      // Actualizar estado
      setProfileImage(newImage);
      
      // Guardar en localStorage para persistencia
      localStorage.setItem('profilePic', newImage);
      localStorage.setItem('profilePic_backup', newImage);
      localStorage.setItem('profilePic_lastUpdate', Date.now().toString());
      
      // Emitir evento para otros componentes
      window.dispatchEvent(new CustomEvent('profileImageUpdated', {
        detail: { 
          profileImage: newImage, 
          timestamp: Date.now(),
          source: 'useProfileImage'
        }
      }));
      
      return true;
    } catch (err) {
      console.error("useProfileImage: Error al actualizar imagen:", err);
      setError({
        message: 'Error al actualizar la imagen de perfil',
        original: err
      });
      return false;
    }
  };

  return {
    profileImage,
    isLoading,
    error,
    handleImageError,
    updateProfileImage,
    fallbackImageBase64
  };
};

export default useProfileImage; 