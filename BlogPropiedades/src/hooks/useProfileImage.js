import { useState, useEffect } from 'react';
// Definimos la imagen fallback como una constante en este archivo
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

/**
 * Hook simplificado para manejar la imagen de perfil
 * Versión robusta y a prueba de errores
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(fallbackImageBase64);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Función para prevenir bucles en carga de imagen
  const safeSetImage = (imageData) => {
    // Si la imagen es inválida, usar el fallback
    if (!imageData || imageData === 'undefined' || imageData === 'null' || 
        typeof imageData !== 'string' || imageData.trim() === '') {
      console.log("⚠️ Imagen inválida detectada, usando fallback");
      setProfileImage(fallbackImageBase64);
      return false;
    }
    
    try {
      // Solo actualizar si es diferente a la actual
      if (profileImage !== imageData) {
        setProfileImage(imageData);
      }
      return true;
    } catch (err) {
      console.error("Error al establecer imagen:", err);
      setProfileImage(fallbackImageBase64);
      return false;
    }
  };
  
  // Inicializar: cargar imagen de localStorage si existe
  useEffect(() => {
    try {
      // Asegurar que solo se ejecuta una vez
      if (profileImage !== fallbackImageBase64) return;
      
      const storedImage = localStorage.getItem('profilePic');
      
      if (storedImage && storedImage !== 'undefined' && storedImage !== 'null') {
        safeSetImage(storedImage);
      } else {
        // Sin imagen, asegurar que el fallback esté guardado
        localStorage.setItem('profilePic', fallbackImageBase64);
      }
    } catch (err) {
      console.error("Error al inicializar imagen:", err);
    }
  }, [profileImage]);
  
  // Función para manejar errores de carga de imágenes
  const handleImageError = () => {
    console.log("❌ Error al cargar imagen, usando fallback");
    
    // Actualizar estado
    setProfileImage(fallbackImageBase64);
    
    // Guardar el fallback en localStorage
    try {
      localStorage.setItem('profilePic', fallbackImageBase64);
    } catch (err) {
      console.error("Error al guardar fallback:", err);
    }
    
    // Notificar a otros componentes
    try {
      window.dispatchEvent(new CustomEvent('profileImageError', { 
        detail: { timestamp: Date.now() } 
      }));
    } catch (err) {
      console.error("Error al emitir evento de error:", err);
    }
  };
  
  // Función para actualizar imagen
  const updateProfileImage = async (newImage) => {
    setIsLoading(true);
    setError(null);
    
    if (!newImage || typeof newImage !== 'string' || newImage.trim() === '') {
      console.error("Imagen inválida proporcionada para actualización");
      setError("Imagen inválida");
      setIsLoading(false);
      return false;
    }
    
    try {
      // 1. Actualizar el estado local
      safeSetImage(newImage);
      
      // 2. Guardar en localStorage
      localStorage.setItem('profilePic', newImage);
      localStorage.setItem('profilePic_backup', newImage);
      
      // 3. Notificar a los demás componentes
      window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
        detail: { profileImage: newImage, timestamp: Date.now() } 
      }));
      
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error("Error al actualizar imagen:", err);
      setError("Error al guardar la imagen");
      setIsLoading(false);
      return false;
    }
  };
  
  return {
    profileImage: profileImage || fallbackImageBase64, // Siempre devolver una imagen válida
    isLoading,
    error,
    handleImageError,
    updateProfileImage,
    fallbackImageBase64 // Exportar para uso en componentes
  };
};

export default useProfileImage; 