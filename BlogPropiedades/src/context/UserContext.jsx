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
    
    // Verificar que tenga formato JWT (3 segmentos separados por puntos)
    if (token.split('.').length !== 3) return false;
    
    try {
      // Intentar decodificar la parte del payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si el token ha expirado
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.warn("Token expirado:", new Date(payload.exp * 1000).toLocaleString());
        return false;
      }
      
      // Verificar si tiene campo de "iat" (issued at)
      if (!payload.iat) {
        console.warn("Token sin fecha de emisión (iat)");
      }
      
      return true;
    } catch (error) {
      console.error("Error al validar token:", error);
      return false;
    }
  };

  // Función para intentar recuperar la sesión cuando hay problemas
  const recuperateSession = async () => {
    console.log("🔄 Intentando recuperar sesión...");
    
    try {
      // Verificar si hay datos del usuario en localStorage
      const storedEmail = localStorage.getItem('email');
      const storedName = localStorage.getItem('name');
      const storedRole = localStorage.getItem('role');
      const storedImage = localStorage.getItem("profilePic") || 
                         localStorage.getItem("profilePic_local") || 
                         localStorage.getItem("profilePic_base64") || 
                         fallbackImageBase64;
      
      console.log("🔍 Datos de recuperación disponibles:", {
        email: storedEmail ? "Disponible" : "No disponible", 
        name: storedName ? "Disponible" : "No disponible",
        role: storedRole ? "Disponible" : "No disponible", 
        imagen: storedImage ? "Disponible" : "No disponible" 
      });
      
      // Si tenemos un token, pero era inválido, intentar generar uno temporal
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log("🔑 Encontrado token probablemente inválido o expirado en localStorage");
        
        // Limpiar el token inválido
        try {
          localStorage.removeItem('token');
          console.log("🧹 Token inválido eliminado de localStorage");
        } catch (e) {
          console.error("❌ Error al eliminar token:", e);
        }
      }
      
      // Si tenemos email y nombre, podemos reconstruir un usuario básico
      if (storedEmail && storedName) {
        console.log("✅ Datos mínimos encontrados, recuperando sesión básica");
        
        // Crear un objeto de usuario básico
        const recoveredUser = {
          email: storedEmail,
          name: storedName,
          role: storedRole || 'user',
          profileImage: storedImage,
          _recovered: true,
          _recoveryTime: new Date().toISOString()
        };
        
        // Si tenemos credenciales almacenadas, podemos usar un token temporal
        const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        if (storedEmail) {
          try {
            localStorage.setItem('tempToken', tempToken);
            console.log("🔑 Token temporal creado y almacenado");
          } catch (e) {
            console.error("❌ Error al almacenar token temporal:", e);
          }
        }
        
        setUser(recoveredUser);
        setIsAuthenticated(true);
        
        console.log("✅ Sesión básica recuperada con datos locales");
        
        // Notificar de la recuperación
        window.dispatchEvent(new CustomEvent('sessionRecovered', { 
          detail: { recoveredUser } 
        }));
        
        return true;
      }
      
      // Si no tenemos datos suficientes pero hay al menos un correo
      if (storedEmail) {
        console.log("⚠️ Solo tenemos email, no podemos recuperar una sesión completa");
        
        // Crear un objeto de usuario muy básico solo para mostrar algo
        const minimalUser = {
          email: storedEmail,
          name: storedEmail.split('@')[0] || "Usuario recuperado",
          profileImage: fallbackImageBase64,
          _recovered: true,
          _minimal: true,
          _recoveryTime: new Date().toISOString()
        };
        
        // No marcamos como autenticado
        setUser(minimalUser);
        setIsAuthenticated(false);
        
        // Notificar de la recuperación parcial
        window.dispatchEvent(new CustomEvent('sessionPartiallyRecovered', { 
          detail: { minimalUser } 
        }));
        
        return false;
      }
      
      console.log("❌ No hay suficientes datos para recuperar la sesión");
      return false;
    } catch (error) {
      console.error("❌ Error crítico al recuperar sesión:", error);
      
      // Último intento - crear un usuario anónimo
      try {
        console.log("🔄 Último intento - creando usuario anónimo temporal");
        const anonymousUser = {
          name: "Usuario temporal",
          profileImage: fallbackImageBase64,
          _anonymous: true,
          _recoveryTime: new Date().toISOString()
        };
        
        setUser(anonymousUser);
        setIsAuthenticated(false);
        
        return false;
      } catch (e) {
        console.error("❌ Error fatal durante la creación de usuario anónimo:", e);
        return false;
      }
    }
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
      
      // Validación extra del token antes de usarlo
      if (!isValidToken(storedToken)) {
        console.warn("Token inválido o expirado. Intentando recuperar sesión.");
        
        // Intentar recuperar sesión con datos almacenados
        const recovered = await recuperateSession();
        
        if (!recovered) {
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setLoading(false);
        return;
      }
      
      try {
        const userData = await getUserProfile(storedToken);
        
        // Verificar que los datos del usuario son válidos
        if (!userData || !userData.email) {
          console.error("⚠️ API devolvió datos de usuario inválidos:", userData);
          
          // Intentar recuperar con datos locales
          await recuperateSession();
          setLoading(false);
          return;
        }
        
        // Actualizar localStorage con datos básicos
        if (userData.name) localStorage.setItem("name", userData.name);
        if (userData.email) localStorage.setItem("email", userData.email);
        if (userData.role) localStorage.setItem("role", userData.role);
        
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
        setLoading(false);
      } catch (error) {
        console.error("Error al obtener perfil de usuario:", error);
        
        // Si falla la petición al servidor pero tenemos un token, intentar recuperar 
        // la sesión con los datos almacenados en localStorage
        if (storedToken) {
          console.log("Intentando recuperar sesión desde localStorage tras fallo de API");
          const recovered = await recuperateSession();
          
          if (!recovered) {
            // Si no podemos recuperar la sesión, redirigir al login
            console.error("No se pudo recuperar sesión, redirigiendo a login");
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        
        setLoading(false);
      }
    } catch (outerError) {
      console.error("Error crítico en refreshUserData:", outerError);
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Inicializar datos de usuario al cargar la aplicación
  useEffect(() => {
    const initializeUser = async () => {
      try {
        setLoading(true);
        console.log("🔄 Iniciando carga de usuario...");
        
        const storedToken = localStorage.getItem('token');
        console.log("🔑 Token en localStorage:", storedToken ? `${storedToken.substring(0, 10)}...` : 'No disponible');
        
        if (storedToken) {
          console.log("🔍 Token encontrado, intentando obtener datos de usuario...");
          
          // Validar el token antes de usarlo
          if (!isValidToken(storedToken)) {
            console.warn("⚠️ Token inválido o expirado en localStorage");
            
            // Intentar recuperar la sesión con datos locales
            const recovered = await recuperateSession();
            
            if (recovered) {
              console.log("✅ Sesión recuperada con datos locales");
            } else {
              console.log("❌ No se pudo recuperar la sesión, redirigiendo a login");
              setUser(null);
              setIsAuthenticated(false);
            }
            
            setLoading(false);
            return;
          }
          
          // Intentar refrescar los datos del usuario
          try {
            console.log("🔄 Intentando refrescar datos del usuario...");
            await refreshUserData();
            console.log("✅ Datos de usuario actualizados correctamente");
          } catch (refreshError) {
            console.error("❌ Error al refrescar datos:", refreshError);
            
            // Intentar recuperar la sesión como último recurso
            const recovered = await recuperateSession();
            
            if (!recovered) {
              setUser(null);
              setIsAuthenticated(false);
              console.log("❌ No se pudo recuperar la sesión, usuario desconectado");
            }
          }
        } else {
          console.log("ℹ️ No hay token guardado, estableciendo estado como no autenticado");
          
          // Aún así, comprobamos si hay datos en localStorage para ofrecer una experiencia mejorada
          const hasMinimalData = localStorage.getItem('email');
          if (hasMinimalData) {
            console.log("ℹ️ Se encontró email en localStorage, intentando recuperación parcial");
            await recuperateSession();
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("❌ Error crítico al inicializar usuario:", error);
        
        // Intentar recuperar la sesión como último recurso
        try {
          const recovered = await recuperateSession();
          
          if (!recovered) {
            console.log("❌ No se pudo recuperar la sesión después del error crítico");
            setUser(null);
            setIsAuthenticated(false);
          } else {
            console.log("✅ Sesión recuperada después del error crítico");
          }
        } catch (e) {
          console.error("❌ Error fatal durante la recuperación de emergencia:", e);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        // Garantizar que loading se desactive siempre
        setLoading(false);
        console.log("🏁 Inicialización de usuario completada, estado:", { 
          autenticado: isAuthenticated, 
          usuario: user ? "Disponible" : "No disponible", 
          cargando: false 
        });
      }
    };
    
    // Sistema de reintento en caso de errores de red
    let initAttempts = 0;
    const maxAttempts = 3;
    
    const attemptInitialization = () => {
      initAttempts++;
      console.log(`🔄 Intento de inicialización #${initAttempts}`);
      
      initializeUser().catch(error => {
        console.error(`❌ Error en intento #${initAttempts}:`, error);
        
        if (initAttempts < maxAttempts) {
          console.log(`⏱️ Reintentando en ${initAttempts * 1000}ms...`);
          setTimeout(attemptInitialization, initAttempts * 1000);
        } else {
          console.error("❌ Se agotaron los intentos de inicialización");
          setLoading(false);
          setUser(null);
          setIsAuthenticated(false);
          
          // Intento final de recuperación con datos locales
          recuperateSession().catch(() => {
            console.error("❌ Falló el intento final de recuperación");
          });
        }
      });
    };
    
    // Iniciar el proceso
    attemptInitialization();
  }, []);

  // Refrescar datos del usuario cada 5 minutos
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        refreshUserData().catch(error => {
          console.error("Error al refrescar datos periódicamente:", error);
        });
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
      console.log("Token recibido:", userData.token);
      console.log("Datos de usuario:", userData.user || "No hay objeto user específico");
      
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
      } else if (userData.profilePic) {
        if (typeof userData.profilePic === 'string') {
          currentProfileImage = userData.profilePic;
          console.log("Imagen encontrada en userData.profilePic (string):", currentProfileImage.substring(0, 30) + "...");
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