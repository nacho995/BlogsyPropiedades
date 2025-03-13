import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, syncProfileImage } from '../services/api';
import { fallbackImageBase64, validateAndProcessImage, ensureHttps } from "../utils/profileUtils";

// Crear contexto
export const UserContext = createContext();

// Proveedor del contexto
export function UserProvider({ children }) {
  // Estados básicos
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Función auxiliar para verificar token
  const isValidToken = (token) => {
    if (!token) return false;
    return token.split('.').length === 3;
  };

  // Función para actualizar la información del usuario
  const refreshUserData = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        const userData = await getUserProfile(storedToken);
        
        // Actualizar localStorage con datos básicos
        if (userData.name) localStorage.setItem("name", userData.name);
        
        // Sincronizar la imagen de perfil con el servidor
        try {
          console.log("Sincronizando imagen de perfil durante refreshUserData");
          await syncProfileImage();
        } catch (imageError) {
          console.error("Error al sincronizar imagen de perfil:", imageError);
          // Continuar con el proceso a pesar del error
        }
        
        // Obtener la imagen actualizada de localStorage
        const updatedImage = localStorage.getItem("profilePic") || 
                            localStorage.getItem("profilePic_local") || 
                            localStorage.getItem("profilePic_base64") || 
                            fallbackImageBase64;
        
        // Actualizar estado con los datos del usuario
        setUser({
          ...userData,
          profileImage: updatedImage
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        // Solo marcar como no autenticado si el error es 401 (no autorizado)
        if (error.response && error.response.status === 401) {
          setUser(null);
          setIsAuthenticated(false);
        } else {
          // Para otros errores, mantener el estado actual pero actualizar la imagen
          const storedImage = localStorage.getItem("profilePic") || 
                             localStorage.getItem("profilePic_local") || 
                             localStorage.getItem("profilePic_base64") || 
                             fallbackImageBase64;
          if (user) {
            setUser({
              ...user,
              profileImage: storedImage
            });
          }
        }
      }
    } catch (error) {
      console.error("Error al actualizar datos de usuario:", error);
      // No cerrar sesión automáticamente por errores generales
      // Solo actualizar la imagen si es necesario
      const storedImage = localStorage.getItem("profilePic") || 
                         localStorage.getItem("profilePic_local") || 
                         localStorage.getItem("profilePic_base64") || 
                         fallbackImageBase64;
      if (user) {
        setUser({
          ...user,
          profileImage: storedImage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Inicializar datos de usuario al cargar la aplicación
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setLoading(true);
        const storedToken = localStorage.getItem('token');
        
        if (storedToken) {
          await refreshUserData();
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error al inicializar usuario:", error);
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    };
    
    initializeUser();
  }, []);

  // Refrescar datos del usuario cada 5 minutos
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        refreshUserData();
      }, 5 * 60 * 1000); // 5 minutos
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);
  
  // Escuchar cambios en localStorage (por ejemplo, cuando se actualiza el token en otra pestaña)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'token') {
        const newToken = e.newValue;
        if (newToken) {
          refreshUserData();
        } else {
          // Si se eliminó el token, cerrar sesión
          setUser(null);
          setIsAuthenticated(false);
        }
      } else if (e.key === 'profilePic' || e.key === 'profilePic_local' || e.key === 'profilePic_base64') {
        // Si cambia la imagen de perfil, actualizar el estado
        const newProfilePic = e.newValue || 
                             localStorage.getItem("profilePic") || 
                             localStorage.getItem("profilePic_local") || 
                             localStorage.getItem("profilePic_base64") || 
                             fallbackImageBase64;
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            profileImage: newProfilePic
          };
        });
      }
    };
    
    // Escuchar el evento personalizado para actualización de imagen
    const handleProfileImageUpdate = (e) => {
      if (e.detail && e.detail.imageUrl) {
        setUser(prevUser => {
          if (!prevUser) return null;
          return {
            ...prevUser,
            profileImage: e.detail.imageUrl
          };
        });
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);
  
  // Función de login
  const login = async (userData) => {
    try {
      // Validar datos básicos
      if (!userData || !userData.token) {
        console.error("Datos de login incompletos");
        throw new Error("Datos de login incompletos");
      }
      
      console.log("Iniciando sesión con datos:", userData);
      
      // Guardar token y nombre en localStorage
      localStorage.setItem("token", userData.token);
      if (userData.name) localStorage.setItem("name", userData.name);
      
      // Extraer datos del usuario
      const userObj = userData.user || {};
      
      // Actualizar el estado del usuario
      setUser({
        token: userData.token,
        name: userData.name || userObj.name || "",
        ...userObj
      });
      
      setIsAuthenticated(true);
      
      // Guardar la imagen de perfil actual si existe
      let currentProfileImage = null;
      
      // Verificar si hay una imagen en los datos del usuario
      if (userObj.profilePic) {
        if (typeof userObj.profilePic === 'string') {
          currentProfileImage = userObj.profilePic;
          console.log("Imagen encontrada en userData.user.profilePic (string):", currentProfileImage.substring(0, 30) + "...");
        } else if (userObj.profilePic && userObj.profilePic.src) {
          currentProfileImage = userObj.profilePic.src;
          console.log("Imagen encontrada en userData.user.profilePic.src:", currentProfileImage.substring(0, 30) + "...");
        }
      } else if (userObj.profileImage) {
        if (typeof userObj.profileImage === 'string') {
          currentProfileImage = userObj.profileImage;
          console.log("Imagen encontrada en userData.user.profileImage (string):", currentProfileImage.substring(0, 30) + "...");
        } else if (userObj.profileImage && userObj.profileImage.url) {
          currentProfileImage = userObj.profileImage.url;
          console.log("Imagen encontrada en userData.user.profileImage.url:", currentProfileImage.substring(0, 30) + "...");
        }
      }
      
      // Si encontramos una imagen, procesarla y guardarla en localStorage
      if (currentProfileImage) {
        try {
          // Procesar la imagen (convertir a base64 si es necesario)
          const processedImage = await validateAndProcessImage(currentProfileImage);
          
          // Guardar en localStorage
          localStorage.setItem('profilePic', processedImage);
          localStorage.setItem('profilePic_local', processedImage);
          localStorage.setItem('profilePic_base64', processedImage);
          
          console.log("Imagen procesada y guardada en localStorage durante login");
          
          // Notificar a otros componentes
          window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
            detail: { imageUrl: processedImage } 
          }));
          
          // Actualizar el estado del usuario con la imagen procesada
          setUser(prevUser => ({
            ...prevUser,
            profileImage: processedImage
          }));
        } catch (imageError) {
          console.error("Error al procesar imagen durante login:", imageError);
          
          // Si falla el procesamiento, intentar usar la URL directamente
          const secureUrl = ensureHttps(currentProfileImage);
          localStorage.setItem('profilePic', secureUrl);
          localStorage.setItem('profilePic_local', secureUrl);
          
          // Notificar a otros componentes
          window.dispatchEvent(new CustomEvent('profileImageUpdated', { 
            detail: { imageUrl: secureUrl } 
          }));
          
          // Actualizar el estado del usuario con la URL segura
          setUser(prevUser => ({
            ...prevUser,
            profileImage: secureUrl
          }));
        }
      } else {
        // Si no hay imagen, intentar sincronizar con el servidor
        try {
          console.log("No se encontró imagen en los datos de usuario, sincronizando con el servidor...");
          await syncProfileImage();
          
          // Obtener la imagen sincronizada
          const syncedImage = localStorage.getItem('profilePic') || 
                             localStorage.getItem('profilePic_local') || 
                             localStorage.getItem('profilePic_base64') || 
                             fallbackImageBase64;
          
          // Actualizar el estado del usuario con la imagen sincronizada
          setUser(prevUser => ({
            ...prevUser,
            profileImage: syncedImage
          }));
        } catch (syncError) {
          console.error("Error al sincronizar imagen durante login:", syncError);
          // Usar imagen por defecto
          setUser(prevUser => ({
            ...prevUser,
            profileImage: fallbackImageBase64
          }));
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  };
  
  // Función de logout
  const logout = (shouldRedirect = true) => {
    try {
      console.log("Cerrando sesión...");
      
      // Guardar las imágenes actuales antes de limpiar localStorage
      const currentProfilePic = localStorage.getItem('profilePic');
      const localProfilePic = localStorage.getItem('profilePic_local');
      const base64ProfilePic = localStorage.getItem('profilePic_base64');
      
      // Crear un objeto con las imágenes a preservar
      const imagesToPreserve = {
        profilePic: currentProfilePic || localProfilePic || base64ProfilePic || fallbackImageBase64,
        profilePic_local: localProfilePic || currentProfilePic || base64ProfilePic || fallbackImageBase64,
        profilePic_base64: base64ProfilePic || localProfilePic || currentProfilePic || fallbackImageBase64
      };
      
      console.log("Imágenes guardadas antes de logout:", {
        profilePic: imagesToPreserve.profilePic.substring(0, 30) + "...",
        profilePic_local: imagesToPreserve.profilePic_local.substring(0, 30) + "...",
        profilePic_base64: imagesToPreserve.profilePic_base64.substring(0, 30) + "..."
      });
      
      // Limpiar localStorage
      localStorage.clear();
      
      // Restaurar las imágenes
      localStorage.setItem('profilePic', imagesToPreserve.profilePic);
      localStorage.setItem('profilePic_local', imagesToPreserve.profilePic_local);
      localStorage.setItem('profilePic_base64', imagesToPreserve.profilePic_base64);
      
      console.log("Imágenes restauradas después de logout");
      
      // Actualizar estado
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirigir a la página de login si se solicita
      if (shouldRedirect) {
        navigate("/login");
      }
      
      return true;
    } catch (error) {
      console.error("Error en logout:", error);
      
      // Asegurar que el usuario se desconecte incluso si hay un error
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      
      if (shouldRedirect) {
        navigate("/login");
      }
      
      return false;
    }
  };
  
  // Valor del contexto
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUserData
  };
  
  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useUser() {
  return useContext(UserContext);
} 