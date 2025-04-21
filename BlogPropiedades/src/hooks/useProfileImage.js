import { useState, useEffect } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook para gestionar la imagen de perfil del usuario con persistencia
 * @param {object | null} user - El objeto de usuario del contexto useUser
 */
const useProfileImage = (user) => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar la imagen al montar el componente o cuando cambie la URL en el user
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null); 
    
    const userImageUrl = user?.profileImage?.url;
    console.log("useProfileImage: Iniciando carga/actualización. userImageUrl:", userImageUrl);

    try {
      let imageToLoad = fallbackImageBase64;
      let foundImage = false;

      // 1. Usar la URL del objeto user si existe y es válida
      if (userImageUrl && typeof userImageUrl === 'string' && userImageUrl.startsWith('http')) {
        console.log("useProfileImage: Usando imagen desde el objeto user.");
        imageToLoad = userImageUrl;
        foundImage = true;
        // Actualizar localStorage para consistencia
        localStorage.setItem('profilePic', userImageUrl);
        localStorage.setItem('profilePic_backup', userImageUrl);
      }
      
      // 2. Si no hay imagen en user, intentar cargar de localStorage 
      if (!foundImage) {
        console.log("useProfileImage: No hay imagen en user, buscando en localStorage...");
        const storedImage = localStorage.getItem('profilePic');
        if (storedImage && 
            storedImage !== 'undefined' && 
            storedImage !== 'null' && 
            typeof storedImage === 'string') {
          
          console.log("useProfileImage: Usando imagen de localStorage principal");
          imageToLoad = storedImage;
          foundImage = true;
          localStorage.setItem('profilePic_backup', storedImage);
        } 
      }

      // 3. Si aún no hay imagen, intentar cargar del backup
      if (!foundImage) {
        const backupImage = localStorage.getItem('profilePic_backup');
        if (backupImage && 
            backupImage !== 'undefined' && 
            backupImage !== 'null' && 
            typeof backupImage === 'string') {
          
          console.log("useProfileImage: Recuperando imagen desde backup");
          imageToLoad = backupImage;
          foundImage = true;
          localStorage.setItem('profilePic', backupImage);
        }
      }
      
      // 4. Si no se encontró ninguna imagen válida, usar fallback
      if (!foundImage) {
          console.log("useProfileImage: No se encontró imagen válida, usando fallback.");
      }

      // Establecer la imagen final y estado de carga
      if (isMounted) {
        setProfileImage(imageToLoad); // Establecer la imagen encontrada o el fallback
        setIsLoading(false);
      }

    } catch (err) {
      console.error("useProfileImage: Error al cargar imagen inicial:", err);
      if (isMounted) {
        setError({ message: 'Error al cargar la imagen de perfil', original: err });
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
  }, [user?.profileImage?.url]);

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