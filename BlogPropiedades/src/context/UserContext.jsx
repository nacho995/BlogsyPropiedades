import React, { createContext, useState, useEffect, useContext } from "react";
import { getUserProfile, syncProfileImage } from '../services/api';

// Definimos las constantes y funciones que antes estaban en utils/imageUtils
const fallbackImageBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMWUxZTEiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzg4OCI+U2luIEltYWdlbjwvdGV4dD48L3N2Zz4=';

const validateAndProcessImage = (imageFile) => {
  return new Promise((resolve, reject) => {
    if (!imageFile) {
      reject(new Error('No se proporcionó ninguna imagen'));
      return;
    }

    // Verificar el tipo de archivo
    if (!imageFile.type.match('image.*')) {
      reject(new Error('El archivo seleccionado no es una imagen válida'));
      return;
    }

    // Verificar el tamaño (máximo 2MB)
    if (imageFile.size > 2 * 1024 * 1024) {
      reject(new Error('La imagen es demasiado grande. El tamaño máximo es 2MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      resolve(e.target.result);
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo de imagen'));
    };
    reader.readAsDataURL(imageFile);
  });
};

const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

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
        
        // Al detectar token expirado, cerrar sesión automáticamente
        setTimeout(() => {
          logout(true, 'token_expired');
        }, 0);
        
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
      
      // Si hay un error al validar el token, también cerrar sesión
      setTimeout(() => {
        logout(true, 'token_invalid');
      }, 0);
      
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

  // Sincronizar imagen al iniciar sesión o recargar
  useEffect(() => {
    // Sincronizar imagen al iniciar sesión o recargar
    const syncProfileFromLocalStorage = async () => {
      try {
        console.log("🔄 Cargando imagen de perfil desde localStorage...");
        
        // Verificar si hay token válido
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("No hay token disponible");
          return;
        }
        
        // Usar datos de localStorage
        const storedImage = localStorage.getItem('profilePic') || 
                           localStorage.getItem('profilePic_backup');
        
        if (storedImage) {
          // Actualizar la imagen en el estado del usuario
          setUser(prevUser => {
            if (!prevUser) return prevUser;
            return {
              ...prevUser,
              profileImage: storedImage,
              profilePic: storedImage
            };
          });
        }
      } catch (error) {
        console.error("Error al sincronizar imagen:", error);
      }
    };
    
    if (isAuthenticated) {
      syncProfileFromLocalStorage();
    }
  }, [isAuthenticated]);

  // Función de logout
  const logout = (shouldRedirect = true, reason = 'user_action') => {
    // Guardar una copia de la imagen de perfil temporalmente si existe
    try {
      const profileImage = localStorage.getItem('profilePic');
      if (profileImage) {
        localStorage.setItem('profilePic_temp', profileImage);
      }
    } catch (e) {
      console.error("Error al guardar imagen temporal:", e);
    }
    
    // Limpiar y reestablecer después del cierre de sesión
    setUser(null);
    setIsAuthenticated(false);
    
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("userResponse");
      localStorage.removeItem("tempToken");
      
      // No borrar la imagen de perfil para que se mantenga entre sesiones
      // localStorage.removeItem("profilePic");
      
      // Despachar evento de cierre de sesión
      window.dispatchEvent(new CustomEvent('userLoggedOut', {
        detail: { reason }
      }));
      
      console.log(`🔒 Sesión cerrada. Razón: ${reason}`);
    } catch (e) {
      console.error("❌ Error al eliminar token:", e);
    }
    
    // Redireccionar si es necesario
    if (shouldRedirect) {
      console.log("🔄 Redirigiendo a página de login...");
      
      // Pequeño retraso para permitir que otros componentes reaccionen primero
      setTimeout(() => {
        window.location.href = "/login";
      }, 100);
    }
  };
  
  // Función para iniciar sesión
  const login = async (token, userData) => {
    console.log("Iniciando sesión con datos:", userData);
    logAuthEvent('login_attempt', { hasToken: !!token, hasUserData: !!userData });
    
    try {
      // Validar el token proporcionado
      if (!token || !isValidToken(token)) {
        console.error("Token inválido proporcionado para inicio de sesión");
        logAuthEvent('login_failed_invalid_token');
        return false;
      }
      
      // Guardar token en localStorage
      localStorage.setItem("token", token);
      
      // Almacenar datos del usuario si están disponibles
      if (userData) {
        localStorage.setItem("email", userData.email || "");
        localStorage.setItem("name", userData.name || "");
        localStorage.setItem("role", userData.role || "user");
        
        // También guardar todo el objeto para facilitar la recuperación
        localStorage.setItem("userData", JSON.stringify(userData));
        
        // Manejar imagen de perfil
        if (userData.profileImage || userData.profilePic) {
          let profileImageUrl = null;
          
          // Extraer URL de la imagen según el formato disponible
          if (userData.profileImage) {
            if (typeof userData.profileImage === 'string') {
              profileImageUrl = userData.profileImage;
            } else if (userData.profileImage && typeof userData.profileImage === 'object') {
              profileImageUrl = userData.profileImage.src || userData.profileImage.url;
            }
          } else if (userData.profilePic) {
            if (typeof userData.profilePic === 'string') {
              profileImageUrl = userData.profilePic;
            } else if (userData.profilePic && typeof userData.profilePic === 'object') {
              profileImageUrl = userData.profilePic.src || userData.profilePic.url;
            }
          }
          
          // Si se encontró URL de imagen, sincronizarla
          if (profileImageUrl) {
            console.log("🖼️ Imagen de perfil encontrada, sincronizando:", profileImageUrl.substring(0, 30) + "...");
            localStorage.setItem('profilePic', profileImageUrl);
            localStorage.setItem('profilePic_backup', profileImageUrl);
            localStorage.setItem('profilePic_temp', profileImageUrl);
            
            // Actualizar userResponse si existe
            try {
              const userResponse = localStorage.getItem('userResponse');
              if (userResponse) {
                const responseData = JSON.parse(userResponse);
                responseData.profilePic = profileImageUrl;
                responseData.profileImage = profileImageUrl;
                localStorage.setItem('userResponse', JSON.stringify(responseData));
              }
            } catch (e) {
              console.warn("Error al actualizar userResponse:", e);
            }
            
            syncProfileImage(profileImageUrl);
          }
        } else {
          // Si no hay imagen en los datos del usuario, verificar si hay una guardada
          const profilePicTemp = localStorage.getItem('profilePic_temp');
          if (profilePicTemp) {
            console.log("🖼️ Usando imagen de perfil temporal guardada:", profilePicTemp.substring(0, 30) + "...");
            localStorage.setItem('profilePic', profilePicTemp);
            localStorage.setItem('profilePic_backup', profilePicTemp);
            
            // Actualizar userData con la imagen guardada
            userData.profilePic = profilePicTemp;
            userData.profileImage = profilePicTemp;
            localStorage.setItem("userData", JSON.stringify(userData));
            
            syncProfileImage(profilePicTemp);
          }
        }
      }
      
      // Intentar obtener perfil de usuario actualizado
      try {
        const userProfile = await getUserProfile(token);
        console.log("Perfil de usuario obtenido:", userProfile);
        
        // Si tiene imagen, sincronizarla
        if (userProfile && (userProfile.profileImage || userProfile.profilePic)) {
          let profilePicUrl = null;
          
          if (userProfile.profileImage) {
            profilePicUrl = typeof userProfile.profileImage === 'string' ? 
                          userProfile.profileImage : 
                          userProfile.profileImage.src || userProfile.profileImage.url;
          } else if (userProfile.profilePic) {
            profilePicUrl = typeof userProfile.profilePic === 'string' ? 
                          userProfile.profilePic : 
                          userProfile.profilePic.src || userProfile.profilePic.url;
          }
          
          console.log("🖼️ Imagen recibida del perfil del usuario:", profilePicUrl ? profilePicUrl.substring(0, 30) + "..." : "no disponible");
          if (profilePicUrl) {
            localStorage.setItem('profilePic', profilePicUrl);
            localStorage.setItem('profilePic_backup', profilePicUrl);
            localStorage.setItem('profilePic_temp', profilePicUrl);
            
            // Actualizar userData con la imagen recibida
            if (userData) {
              userData.profilePic = profilePicUrl;
              userData.profileImage = profilePicUrl;
              localStorage.setItem("userData", JSON.stringify(userData));
            }
            
            syncProfileImage(profilePicUrl);
          }
        }
      } catch (profileError) {
        console.warn("Error al obtener perfil tras login (no crítico):", profileError);
      }
      
      // Configurar estados
      setIsAuthenticated(true);
      setUser(userData);
      
      // Disparar evento para que otros componentes se enteren
      try {
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { userData }
        }));
        console.log("✅ Evento de login enviado a todos los componentes");
      } catch (e) {
        console.warn("Error al disparar evento userLoggedIn:", e);
      }
      
      logAuthEvent('login_successful');
      return true;
    } catch (error) {
      console.error("Error crítico durante el login:", error);
      logAuthEvent('login_critical_error', { error: error.message });
      return false;
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
      }, 15 * 60 * 1000); // 15 minutos
      
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
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // Valor del contexto
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    refreshUserData,
    safeProfileSync: () => {}
  };
  
  return (
    <UserContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        refreshUserData,
        safeProfileSync: () => {}
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useUser() {
  return useContext(UserContext);
} 