import React, { createContext, useState, useEffect, useContext } from "react";
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
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  
  // Función para registrar eventos de autenticación para depuración
  const logAuthEvent = (event, details = {}) => {
    try {
      const eventLog = JSON.parse(localStorage.getItem('authEventLog') || '[]');
      eventLog.unshift({
        event,
        timestamp: new Date().toISOString(),
        details
      });
      
      // Limitar a los últimos 10 eventos
      if (eventLog.length > 10) {
        eventLog.length = 10;
      }
      
      localStorage.setItem('authEventLog', JSON.stringify(eventLog));
    } catch (e) {
      console.error("Error al registrar evento de autenticación:", e);
    }
  };
  
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
        logAuthEvent('token_expired', { expiry: new Date(payload.exp * 1000).toLocaleString() });
        return false;
      }
      
      // Verificar si tiene campo de "iat" (issued at)
      if (!payload.iat) {
        console.warn("Token sin fecha de emisión (iat)");
        logAuthEvent('token_without_iat');
      }
      
      return true;
    } catch (error) {
      console.error("Error al validar token:", error);
      logAuthEvent('token_validation_error', { error: error.message });
      return false;
    }
  };

  // Función para intentar recuperar la sesión cuando hay problemas
  const recuperateSession = async () => {
    if (recoveryAttempted) {
      console.log("🛑 Ya se intentó recuperar la sesión anteriormente, evitando bucle");
      return false;
    }
    
    console.log("🔄 Intentando recuperar sesión...");
    logAuthEvent('session_recovery_attempt');
    setRecoveryAttempted(true);
    
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
        
        // Verificar si el token es válido antes de limpiarlo
        if (!isValidToken(storedToken)) {
          // Limpiar el token inválido
          try {
            localStorage.removeItem('token');
            logAuthEvent('invalid_token_removed');
            console.log("🧹 Token inválido eliminado de localStorage");
          } catch (e) {
            console.error("❌ Error al eliminar token:", e);
          }
        } else {
          // Si el token es válido pero aún así no se cargó el usuario, intentar usarlo directamente
          console.log("🔑 Token válido encontrado, intentando usarlo directamente");
          
          try {
            // Intentar obtener perfil del usuario con este token
            const profileResponse = await getUserProfile(storedToken);
            
            if (profileResponse && profileResponse.user) {
              console.log("✅ Perfil recuperado exitosamente con token existente");
              logAuthEvent('profile_recovered_with_token');
              
              // Configurar el usuario y la autenticación
              setUser(profileResponse.user);
              setIsAuthenticated(true);
              setLoading(false);
              
              return true;
            }
          } catch (profileError) {
            console.error("Error al obtener perfil con token existente:", profileError);
            logAuthEvent('profile_recovery_failed', { error: profileError.message });
          }
        }
      }
      
      // Si tenemos email y nombre, podemos reconstruir un usuario básico
      if (storedEmail && storedName) {
        console.log("✅ Datos mínimos encontrados, recuperando sesión básica");
        logAuthEvent('session_recovered_with_basic_data');
        
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
            logAuthEvent('temp_token_created');
            console.log("🔑 Token temporal creado y almacenado");
          } catch (e) {
            console.error("❌ Error al almacenar token temporal:", e);
          }
        }
        
        setUser(recoveredUser);
        setIsAuthenticated(true);
        setLoading(false);
        
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
        logAuthEvent('partial_recovery_with_email');
        
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
        setLoading(false);
        
        // Notificar de la recuperación parcial
        window.dispatchEvent(new CustomEvent('sessionPartiallyRecovered', { 
          detail: { minimalUser } 
        }));
        
        return false;
      }
      
      console.log("❌ No hay suficientes datos para recuperar la sesión");
      logAuthEvent('recovery_failed_no_data');
      setLoading(false);
      return false;
    } catch (error) {
      console.error("❌ Error crítico al recuperar sesión:", error);
      logAuthEvent('critical_recovery_error', { error: error.message });
      
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
  
  // Función para iniciar sesión
  const login = async (token, userData) => {
    console.log("🔐 Iniciando sesión con token y datos de usuario");
    logAuthEvent('login_attempt');
    
    try {
      if (!token) {
        console.error("❌ Error de login: No se proporcionó token");
        logAuthEvent('login_failed_no_token');
        return false;
      }
      
      // Verificar si el token es válido
      if (!isValidToken(token) && !token.startsWith('temp_')) {
        console.error("❌ Error de login: Token inválido");
        logAuthEvent('login_failed_invalid_token');
        return false;
      }
      
      // Verificar datos de usuario
      if (!userData || !userData.email) {
        console.error("❌ Error de login: Datos de usuario incompletos");
        logAuthEvent('login_failed_incomplete_user_data');
        
        // Si el token es válido pero faltan datos, intentar obtener el perfil
        if (isValidToken(token)) {
          try {
            console.log("🔍 Intentando obtener perfil con token válido pero sin datos de usuario");
            const profileResponse = await getUserProfile();
            
            if (profileResponse && profileResponse.user) {
              userData = profileResponse.user;
              console.log("✅ Perfil obtenido exitosamente");
              logAuthEvent('profile_obtained_during_login');
            }
          } catch (profileError) {
            console.error("❌ Error al obtener perfil durante login:", profileError);
            logAuthEvent('profile_fetch_failed_during_login', { error: profileError.message });
          }
        }
        
        // Si todavía no tenemos datos suficientes
        if (!userData || !userData.email) {
          return false;
        }
      }
      
      // Almacenar token en localStorage
      try {
        localStorage.setItem('token', token);
        console.log("🔑 Token almacenado en localStorage");
      } catch (e) {
        console.error("❌ Error al guardar token:", e);
        logAuthEvent('token_storage_failed', { error: e.message });
        // Continuar de todos modos, aunque podría haber problemas después
      }
      
      // Almacenar datos básicos del usuario
      try {
        localStorage.setItem('email', userData.email);
        
        if (userData.name) {
          localStorage.setItem('name', userData.name);
        }
        
        if (userData.role) {
          localStorage.setItem('role', userData.role);
        }
        
        if (userData._id) {
          localStorage.setItem('userId', userData._id);
        }
        
        // Intentar almacenar el objeto de usuario completo
        try {
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (userStorageError) {
          console.warn("⚠️ No se pudo almacenar objeto de usuario completo:", userStorageError);
          logAuthEvent('user_object_storage_failed', { error: userStorageError.message });
        }
        
        console.log("👤 Datos de usuario almacenados en localStorage");
      } catch (e) {
        console.error("❌ Error al guardar datos de usuario:", e);
        logAuthEvent('user_data_storage_failed', { error: e.message });
        // Continuar de todos modos
      }
      
      // Actualizar el estado
      setUser(userData);
      setIsAuthenticated(true);
      console.log("✅ Sesión iniciada correctamente");
      logAuthEvent('login_successful');
      
      // Sincronizar imagen de perfil si es necesario
      if (userData.profileImage) {
        try {
          localStorage.setItem('profilePic', userData.profileImage);
        } catch (e) {
          console.error("❌ Error al guardar imagen de perfil:", e);
        }
      } else {
        syncProfileImage().catch(e => {
          console.error("Error al sincronizar imagen de perfil:", e);
        });
      }
      
      return true;
    } catch (error) {
      console.error("❌ Error crítico durante login:", error);
      logAuthEvent('critical_login_error', { error: error.message });
      return false;
    }
  };
  
  // Sincronización segura de imagen de perfil
  const safeProfileSync = async () => {
    try {
      // Solo intentar sincronizar si hay un token
      if (localStorage.getItem('token')) {
        await syncProfileImage();
      } else {
        console.log("No se intentó sincronizar la imagen de perfil: no hay token");
      }
    } catch (error) {
      console.warn("Error al sincronizar imagen de perfil (ignorado):", error);
      // Ignorar errores de sincronización de imagen para evitar bloquear la app
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
      
      // Redirigir a la página de login utilizando window.location
      if (shouldRedirect) {
        // Usar window.location.href en lugar de navigate para evitar problemas con hooks
        window.location.href = "/login";
      }
      
      return true;
    } catch (error) {
      console.error("Error en logout:", error);
      
      // Asegurar que el usuario se desconecte incluso si hay un error
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      
      if (shouldRedirect) {
        window.location.href = "/login";
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
    refreshUserData,
    safeProfileSync
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