import { useState, useEffect } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook simplificado para manejar la imagen de perfil usando localStorage
 * Con sincronización entre componentes mediante eventos del navegador
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Escuchar cambios en la imagen de perfil desde otros componentes
  useEffect(() => {
    const handleProfileImageUpdate = (event) => {
      const newImage = event.detail.profileImage;
      if (newImage) {
        setProfileImage(newImage);
      }
    };
    
    // Registrar el listener para el evento personalizado
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    // Cargar imagen del localStorage al montar el componente
    try {
      const storedImage = localStorage.getItem('profilePic');
      if (storedImage) {
        setProfileImage(storedImage);
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
    setProfileImage(fallbackImageBase64);
  };
  
  // Actualizar la imagen en localStorage y notificar a otros componentes
  const updateProfileImage = async (newImage) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Guardar en localStorage
      localStorage.setItem('profilePic', newImage);
      localStorage.setItem('profilePic_backup', newImage);
      
      // Actualizar el estado local
      setProfileImage(newImage);
      
      // Notificar a otros componentes del cambio mediante un evento personalizado
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: newImage } 
      }));
      
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
    updateProfileImage
  };
};

export default useProfileImage; 