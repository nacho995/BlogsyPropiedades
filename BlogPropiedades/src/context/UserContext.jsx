import React, { createContext, useState, useEffect, useContext } from "react";
import { getUserProfile, uploadProfileImageAndUpdate } from '../services/api';

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

    // Verificar el tamaño (máximo 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      reject(new Error('La imagen es demasiado grande. El tamaño máximo es 10MB'));
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
        
        // Al detectar token expirado, cerrar sesión inmediatamente
        try {
          // Guardar una copia de la imagen de perfil temporalmente si existe
          const profileImage = localStorage.getItem('profilePic');
          if (profileImage) {
            localStorage.setItem('profilePic_temp', profileImage);
          }
          
          // Limpiar todos los datos relacionados con la sesión
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          localStorage.removeItem("userResponse");
          localStorage.removeItem("tempToken");
          localStorage.removeItem("email");
          localStorage.removeItem("name");
          localStorage.removeItem("role");
          
          // También limpiar banderas y estados de recuperación
          localStorage.removeItem("authRedirects");
          localStorage.removeItem("redirectLoop");
          localStorage.removeItem("appRestarted");
          
          // Despachar evento de cierre de sesión
          window.dispatchEvent(new CustomEvent('userLoggedOut', {
            detail: { reason: 'token_expired' }
          }));
          
          console.log("🔒 Sesión cerrada por token expirado");
          
          // Redirigir inmediatamente a la página de login
          window.location.replace("/login");
        } catch (e) {
          console.error("Error al cerrar sesión por token expirado:", e);
          // Si falla, intentar redirección directa como última opción
          window.location.href = "/login";
        }
        
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
      
      // Si hay un error al validar el token, también cerrar sesión inmediatamente
      try {
        // Limpiar todos los datos relacionados con la sesión
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        localStorage.removeItem("userResponse");
        localStorage.removeItem("tempToken");
        localStorage.removeItem("email");
        localStorage.removeItem("name");
        localStorage.removeItem("role");
        
        // También limpiar banderas y estados de recuperación
        localStorage.removeItem("authRedirects");
        localStorage.removeItem("redirectLoop");
        localStorage.removeItem("appRestarted");
        
        // Despachar evento de cierre de sesión
        window.dispatchEvent(new CustomEvent('userLoggedOut', {
          detail: { reason: 'token_invalid' }
        }));
        
        console.log("🔒 Sesión cerrada por token inválido");
        
        // Redirigir inmediatamente a la página de login
        window.location.replace("/login");
      } catch (e) {
        console.error("Error al cerrar sesión por token inválido:", e);
        // Si falla, intentar redirección directa como última opción
        window.location.href = "/login";
      }
      
      return false;
    }
  };

  // Función para intentar recuperar la sesión cuando hay problemas
  const recuperateSession = async () => {
    console.log("🌀 [RECUPERATE_SESSION] Attempting session recovery..."); // LOG INICIO
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
      console.error("❌ [RECUPERATE_SESSION] Critical error:", error);
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
      } finally {
        console.log("🌀 [RECUPERATE_SESSION] Finished."); // LOG FIN
      }
    }
  };

  // Función para actualizar la información del usuario
  const refreshUserData = async () => {
    console.log("🔄 [REFRESH_USER_DATA] Starting user data refresh..."); // LOG INICIO
    let success = false;
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
        console.warn("[REFRESH_USER_DATA] Invalid/Expired token. Attempting recovery...");
        const recovered = await recuperateSession(); // Esperar recuperación
        if (!recovered) {
          console.log("[REFRESH_USER_DATA] Recovery failed, setting user to null.");
          setUser(null);
          setIsAuthenticated(false);
        } else {
          console.log("[REFRESH_USER_DATA] Recovery successful.");
          success = true; // Marcar éxito si se recuperó
        }
        return; // Salir si el token era inválido
      }
      
      try {
        const userData = await getUserProfile(storedToken);
        
        // Verificar que los datos del usuario son válidos y tienen id
        if (!userData || !userData.id) {
          console.error("⚠️ refreshUserData: getUserProfile falló o devolvió datos inválidos (sin id).", userData);
          logout(true, 'profile_fetch_invalid'); // Cerrar sesión si falla
          setLoading(false); // Asegurar que loading se ponga a false
          return; // Detener ejecución
        }
        
        // Log éxito obtención de datos
        console.log("✅ refreshUserData: Datos de usuario obtenidos correctamente:", {
           id: userData.id, 
           name: userData.name, 
           email: userData.email, 
           role: userData.role, 
           profileImageExists: !!userData.profileImage 
        });
        
        // Actualizar localStorage con datos básicos (opcional pero puede ser útil)
        if (userData.name) localStorage.setItem("name", userData.name);
        if (userData.email) localStorage.setItem("email", userData.email);
        if (userData.role) localStorage.setItem("role", userData.role);
        
        // Determinar la imagen final a usar: Priorizar la del userData si existe
        const finalProfileImage = userData.profileImage || 
                               localStorage.getItem("profilePic") || // Fallback a localStorage si no hay en user
                               fallbackImageBase4;
        
        // Actualizar estado con los datos validados del usuario
        setUser({
          ...userData, // Ya contiene id, name, email, role...
          profileImage: finalProfileImage // Usar la imagen determinada
        });
        setIsAuthenticated(true);
        success = true; // Marcar éxito
        
      } catch (error) {
        console.error("[REFRESH_USER_DATA] Error getting/validating profile, calling logout:", error);
        await logout(true, 'profile_refresh_error'); // Asegurarse de esperar logout
      }
    } catch (outerError) {
      console.error("[REFRESH_USER_DATA] Initial critical error, calling logout:", outerError);
      await logout(true, 'critical_refresh_error'); // Asegurarse de esperar logout
    } finally {
      setLoading(false); // Asegurar que setLoading siempre se ponga a false
      console.log(`🔄 [REFRESH_USER_DATA] Finished. Success: ${success}`); // LOG FIN
    }
  };

  // Función de logout
  const logout = (shouldRedirect = true, reason = 'user_action') => {
    console.log(`🔒 [LOGOUT] Initiating logout. Reason: ${reason}`); // LOG INICIO
    // Guardar una copia de la imagen de perfil temporalmente si existe
    try {
      const profileImage = localStorage.getItem('profilePic') || 
                          localStorage.getItem('profilePic_local') || 
                          localStorage.getItem('profilePic_base64');
                          
      if (profileImage) {
        // Guardar en múltiples ubicaciones para redundancia
        localStorage.setItem('profilePic_temp', profileImage);
        localStorage.setItem('profilePic_backup', profileImage);
        localStorage.setItem('profilePic_last', profileImage);
        
        // También guardar en sessionStorage para persistencia durante la sesión
        sessionStorage.setItem('profilePic_temp', profileImage);
        
        console.log("✅ Imagen de perfil guardada para futura recuperación");
      }
    } catch (e) {
      console.error("Error al guardar imagen temporal:", e);
    }
    
    // Limpiar y reestablecer después del cierre de sesión
    setUser(null);
    setIsAuthenticated(false);
    
    try {
      // Limpiar todos los datos relacionados con la sesión
      localStorage.removeItem("token");
      localStorage.removeItem("userData");
      localStorage.removeItem("userResponse");
      localStorage.removeItem("tempToken");
      localStorage.removeItem("email");
      localStorage.removeItem("name");
      localStorage.removeItem("role");
      
      // También limpiar banderas y estados de recuperación
      localStorage.removeItem("authRedirects");
      localStorage.removeItem("redirectLoop");
      localStorage.removeItem("appRestarted");
      
      // NO borrar las imágenes guardadas
      // localStorage.removeItem("profilePic");
      // localStorage.removeItem("profilePic_temp");
      // localStorage.removeItem("profilePic_backup");
      
      // Despachar evento de cierre de sesión
      window.dispatchEvent(new CustomEvent('userLoggedOut', {
        detail: { reason }
      }));
      
      console.log(`🔒 [LOGOUT] State cleared. Dispatching event...`);
    } catch (e) {
      console.error("❌ Error al eliminar token:", e);
    }
    
    // Siempre redirigir a la página de login, ignorando el parámetro shouldRedirect
    console.log("🔄 Redirigiendo a página de login...");
    
    // Asegurar que la redirección funcione correctamente
    try {
      // Retrasar la redirección para permitir que otros componentes reaccionen primero
      setTimeout(() => {
        // Usar replace para evitar problemas con el historial
        window.location.replace("/login");
      }, 100);
    } catch (error) {
      console.error("Error durante la redirección:", error);
      // Plan B: usar href directo
      window.location.href = "/login";
    }
    console.log(`🔒 [LOGOUT] Finished.`); // LOG FIN
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
        let profileImageUrl = null;
        
        // Primero intentar obtener la imagen del servidor
        if (userData.profileImage) {
          profileImageUrl = typeof userData.profileImage === 'string' ? 
                          userData.profileImage : 
                          (userData.profileImage.url || userData.profileImage.src);
        } else if (userData.profilePic) {
          profileImageUrl = typeof userData.profilePic === 'string' ? 
                          userData.profilePic : 
                          (userData.profilePic.src || userData.profilePic.url);
        }
        
        // Si se encontró URL de imagen del servidor, usarla
        if (profileImageUrl) {
          console.log("🖼️ Imagen de perfil encontrada en datos del servidor:", profileImageUrl.substring(0, 30) + "...");
          
          // Guardar la imagen en localStorage
          localStorage.setItem('profilePic', profileImageUrl);
          localStorage.setItem('profilePic_backup', profileImageUrl);
          localStorage.setItem('profilePic_temp', profileImageUrl);
          sessionStorage.setItem('profilePic_temp', profileImageUrl);
          
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
        } else {
          // Si no hay imagen en el servidor, usar la imagen local como respaldo
          const localImage = localStorage.getItem('profilePic_temp') || 
                           localStorage.getItem('profilePic_backup') || 
                           localStorage.getItem('profilePic_last') ||
                           sessionStorage.getItem('profilePic_temp') ||
                           localStorage.getItem('profilePic');
                           
          if (localImage) {
            console.log("🖼️ Usando imagen local como respaldo:", localImage.substring(0, 30) + "...");
            profileImageUrl = localImage;
            
            // Guardar la imagen local en todas las ubicaciones
            localStorage.setItem('profilePic', localImage);
            localStorage.setItem('profilePic_backup', localImage);
            localStorage.setItem('profilePic_temp', localImage);
            sessionStorage.setItem('profilePic_temp', localImage);
          } else {
            // Si no hay imagen local, usar la imagen por defecto
            console.log("🖼️ No hay imagen disponible, usando imagen por defecto");
            profileImageUrl = fallbackImageBase64;
          }
        }
        
        // Configurar estados
        setIsAuthenticated(true);
        setUser({
          ...userData,
          profileImage: profileImageUrl,
          profilePic: profileImageUrl
        });
        
        // Disparar evento para que otros componentes se enteren
        try {
          window.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: { 
              userData: {
                ...userData,
                profileImage: profileImageUrl,
                profilePic: profileImageUrl
              }
            }
          }));
          console.log("✅ Evento de login enviado a todos los componentes");
        } catch (e) {
          console.warn("Error al disparar evento userLoggedIn:", e);
        }
      }
      
      logAuthEvent('login_successful');
      return true;
    } catch (error) {
      console.error("Error crítico durante el login:", error);
      logAuthEvent('login_critical_error', { error: error.message });
      return false;
    }
  };
  
  // Función segura para sincronizar la imagen de perfil
  const safeProfileSync = async (imageFile) => {
    console.log("🛡️ Iniciando safeProfileSync...");
    logAuthEvent('profile_sync_started');

    if (!user || !user.id) {
      console.error("safeProfileSync: No hay usuario o ID de usuario disponible.");
      logAuthEvent('profile_sync_failed', { reason: 'no_user_id' });
      return { success: false, error: "No se pudo identificar al usuario." };
    }
    
    if (!imageFile) {
      console.error("safeProfileSync: No se proporcionó archivo de imagen.");
      logAuthEvent('profile_sync_failed', { reason: 'no_image_file' });
      return { success: false, error: "No se seleccionó ninguna imagen." };
    }

    setLoading(true); // Indicar carga

    try {
      // 1. Validar la imagen (tamaño, tipo)
      console.log("Validando imagen...");
      try {
        // Usar validateAndProcessImage que está definido arriba o importado
        await validateAndProcessImage(imageFile); 
        console.log("Imagen validada correctamente.");
        logAuthEvent('image_validation_success');
      } catch (validationError) {
        console.error("Error de validación de imagen:", validationError);
        logAuthEvent('image_validation_failed', { error: validationError.message });
        throw validationError; // Relanzar para que lo capture el catch principal
      }

      // 2. Llamar a la API para subir y actualizar
      console.log(`Subiendo imagen para usuario ${user.id}...`);
      logAuthEvent('image_upload_attempt', { userId: user.id });
      
      // Llamar a la función correcta importada de api.js
      const response = await uploadProfileImageAndUpdate(user.id, imageFile); 

      console.log("Respuesta de la API de subida:", response);

      // Verificar la nueva estructura de respuesta del backend
      if (response && response.success && response.user && response.user.profileImage && response.user.profileImage.url) {
        console.log("✅ Imagen subida y perfil actualizado exitosamente en backend");
        // Extraer la URL correcta de la respuesta
        const newImageUrl = ensureHttps(response.user.profileImage.url); 
        logAuthEvent('image_upload_success', { newUrl: newImageUrl });
        
        // 3. Actualizar el estado del usuario en el contexto
        setUser(prevUser => ({
          ...prevUser,
          // Usar la nueva URL para actualizar el estado
          profileImage: newImageUrl, 
          hasProfileImage: true,
          hasProfilePic: true, // Asumir que si tiene URL, tiene imagen
        }));
        
        // 4. Actualizar localStorage si es necesario
        localStorage.setItem('profilePic', newImageUrl);
        // Actualizar también el objeto userData guardado si existe
        try {
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) {
            const parsedUserData = JSON.parse(storedUserData);
            // Asegurarse de actualizar la estructura correcta si userData guarda profileImage como objeto
            parsedUserData.profileImage = { url: newImageUrl, publicId: response.user.profileImage.publicId }; 
            localStorage.setItem('userData', JSON.stringify(parsedUserData));
          }
        } catch(e) { console.warn("Error actualizando userData en localStorage tras subir imagen:", e); }

        console.log("Contexto y localStorage actualizados con nueva imagen.");
        
        // Devolver la URL correcta
        return { success: true, imageUrl: newImageUrl }; 

      } else {
        // Si la respuesta no es exitosa o no tiene la estructura esperada
        console.error("Error en la respuesta de la API al subir imagen (estructura inesperada o fallo):");
        console.error("Respuesta recibida:", response); // Log más detallado de la respuesta
        // Intentar obtener un mensaje de error más específico
        const errorMessage = response?.message || (response?.error ? JSON.stringify(response.error) : 'Error desconocido del servidor al procesar la respuesta.');
        logAuthEvent('image_upload_failed', { error: errorMessage, responseData: response });
        throw new Error(errorMessage);
      }

    } catch (error) {
      console.error("❌ Fallo al sincronizar imagen:", error);
      logAuthEvent('profile_sync_failed', { error: error.message });
      
      // Devolver un objeto de error claro para que CambiarPerfil.jsx lo muestre
      return { success: false, error: error.message || "Error desconocido al subir imagen" }; 
      
    } finally {
      setLoading(false); // Finalizar carga
      console.log("safeProfileSync finalizado.");
    }
  };

  // Inicializar datos de usuario al cargar la aplicación
  useEffect(() => {
    const initializeUser = async () => {
      console.log("🚀 [INITIALIZE_USER] Starting user initialization..."); // LOG INICIO
      try {
        setLoading(true);
        const storedToken = localStorage.getItem('token');
        console.log(`[INITIALIZE_USER] Token in localStorage: ${storedToken ? 'Exists' : 'Not available'}`);

        if (storedToken) {
          if (!isValidToken(storedToken)) {
            console.warn("[INITIALIZE_USER] Invalid/Expired token. Attempting recovery...");
            await recuperateSession(); // Esperar recuperación
          } else {
            console.log("[INITIALIZE_USER] Valid token found. Refreshing user data...");
            await refreshUserData(); // Esperar refresh
          }
        } else {
          console.log("[INITIALIZE_USER] No token found. Checking for minimal data...");
          const hasMinimalData = localStorage.getItem('email');
          if (hasMinimalData) {
            console.log("[INITIALIZE_USER] Minimal data found. Attempting partial recovery...");
            await recuperateSession(); // Esperar recuperación parcial
          } else {
            console.log("[INITIALIZE_USER] No data for recovery. Setting user to null.");
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("❌ [INITIALIZE_USER] Critical error during initialization. Attempting emergency recovery:", error);
        try {
          await recuperateSession(); // Esperar recuperación de emergencia
        } catch (e) {
          console.error("❌ [INITIALIZE_USER] Fatal error during emergency recovery:", e);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false); // Asegurar setLoading false
        console.log("🚀 [INITIALIZE_USER] Finished."); // LOG FIN
      }
    };

    // Sistema de reintento
    let initAttempts = 0;
    const maxAttempts = 3;
    const attemptInitialization = () => {
      initAttempts++;
      console.log(`[INITIALIZE_USER] Attempt #${initAttempts}`);
      initializeUser().catch(error => {
        console.error(`[INITIALIZE_USER] Error in attempt #${initAttempts}:`, error);
        if (initAttempts < maxAttempts) {
          const delay = initAttempts * 1000;
          console.log(`[INITIALIZE_USER] Retrying in ${delay}ms...`);
          setTimeout(attemptInitialization, delay);
        } else {
          console.error("[INITIALIZE_USER] Max initialization attempts reached. Stopping.");
          setLoading(false); // Asegurar loading false si se agotan reintentos
        }
      });
    };

    attemptInitialization();
  }, []); // Dependencias vacías, se ejecuta solo al montar

  // Refrescar datos del usuario cada 15 minutos (Asegurar que refreshUserData sea estable)
  useEffect(() => {
    let intervalId = null;
    if (isAuthenticated) {
      console.log("⏰ [PERIODIC_REFRESH] Setting up periodic refresh (15 min).");
      intervalId = setInterval(() => {
        console.log("⏰ [PERIODIC_REFRESH] Triggering periodic refresh...");
        refreshUserData().catch(error => {
          console.error("⏰ [PERIODIC_REFRESH] Error during periodic refresh:", error);
        });
      }, 15 * 60 * 1000); 
    }
    return () => {
      if (intervalId) {
        console.log("⏰ [PERIODIC_REFRESH] Clearing periodic refresh interval.");
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated]); // Dependencia de isAuthenticated es correcta

  // Escuchar cambios en localStorage (Revisar dependencias y lógica)
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log(`🔔 [STORAGE_CHANGE] Event detected: key='${e.key}'`); // LOG EVENTO

      if (e.key === 'token') {
        const newToken = e.newValue;
        if (newToken && isValidToken(newToken)) {
          console.log("🔔 [STORAGE_CHANGE] Token changed/added. Calling refreshUserData...");
          refreshUserData().catch(err => console.error("🔔 [STORAGE_CHANGE] Error refreshing after token change:", err));
        } else {
          console.log("🔔 [STORAGE_CHANGE] Token removed or invalid. Calling logout...");
          logout(false, 'token_removed_or_invalid_external');
        }
      } else if (e.key === 'profilePic') {
        console.log("🔔 [STORAGE_CHANGE] Profile pic changed. Calling refreshUserData (if authenticated)...");
        if (isAuthenticated) {
          refreshUserData().catch(err => {
            console.error("🔔 [STORAGE_CHANGE] Error refreshing after pic change:", err);
            // Fallback: actualizar directamente
            setUser(prevUser => prevUser ? { ...prevUser, profileImage: e.newValue || fallbackImageBase64 } : null);
          });
        } else {
             // Actualizar si hay usuario temporal
             setUser(prevUser => {
               if (!prevUser || !(prevUser._recovered || prevUser._anonymous || prevUser._minimal)) return prevUser;
               return { ...prevUser, profileImage: e.newValue || fallbackImageBase64 };
             });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    console.log("🔔 [STORAGE_CHANGE] Event listener added.");

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      console.log("🔔 [STORAGE_CHANGE] Event listener removed.");
    };
    // Asegurarse de que las dependencias sean estables. isValidToken, refreshUserData, logout podrían necesitar useCallback si no lo usan ya.
  }, [isAuthenticated, logout, refreshUserData]); // Dependencias OK si las funciones son estables (useCallback)

  // Valor del contexto
  const contextValue = {
    user,
    setUser,
    isAuthenticated,
    loading,
    recoveryAttempted,
    logAuthEvent,
    isValidToken,
    recuperateSession,
    refreshUserData,
    logout,
    login,
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
