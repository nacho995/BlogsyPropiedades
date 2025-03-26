// Variables requeridas para evitar errores TDZ en producción - NO ELIMINAR
window.y = window.y || {};
window.wi = window.wi || {};
window.Fp = window.Fp || {};
window.Nc = window.Nc || {};

// Definir variables localmente también
const y = {};
const wi = {};
const Fp = {};
const Nc = {};

import { useState, useEffect } from 'react';
import { fallbackImageBase64 } from '../utils/imageUtils';

/**
 * Hook simplificado para manejar la imagen de perfil local
 */
const useProfileImage = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Cargar la imagen desde localStorage al iniciar
  useEffect(() => {
    try {
      const storedImage = localStorage.getItem('profilePic');
      if (storedImage) {
        setProfileImage(storedImage);
      } else {
        setProfileImage(fallbackImageBase64);
      }
    } catch (error) {
      console.error('Error al cargar imagen:', error);
      setProfileImage(fallbackImageBase64);
    }
    setIsLoading(false);
  }, []);
  
  // Manejador de errores de carga
  const handleImageError = () => {
    setProfileImage(fallbackImageBase64);
    setError(new Error('Error al cargar imagen'));
  };
  
  // Actualizar imagen de perfil en localStorage
  const updateProfileImage = async (newImage) => {
    try {
      if (!newImage) {
        throw new Error('No se proporcionó imagen');
      }
      
      let imageUrl = newImage;
      if (typeof newImage === 'object' && (newImage.src || newImage.url)) {
        imageUrl = newImage.src || newImage.url;
      }
      
      if (typeof imageUrl === 'string') {
        localStorage.setItem('profilePic', imageUrl);
        setProfileImage(imageUrl);
        setError(null);
        return true;
      } else {
        throw new Error('Formato de imagen no válido');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err);
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