import React, { createContext, useState, useEffect, useContext, useRef } from "react";
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
  // NUEVO: Detector de bucles de inicialización
  const initCountRef = useRef(0);
  const lastInitTime = useRef(Date.now());
  
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastInit = now - lastInitTime.current;
    
    initCountRef.current += 1;
    lastInitTime.current = now;
    
    console.log(`🔄 [LOOP_DETECTOR] UserProvider init #${initCountRef.current}, timeSince: ${timeSinceLastInit}ms`);
    
    // Si hay más de 5 inicializaciones en menos de 3 segundos, hay un bucle
    if (initCountRef.current > 5 && timeSinceLastInit < 3000) {
      console.error(`🚨 [LOOP_DETECTOR] BUCLE DETECTADO! ${initCountRef.current} inicializaciones`);
      
      // Guardar información del bucle
      const loopInfo = {
        count: initCountRef.current,
        timeSinceLastInit,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      localStorage.setItem('loopDetected', JSON.stringify(loopInfo));
      
      // Mostrar en consola con stack trace
      console.trace('🚨 Stack trace del bucle detectado');
      
      // Detener el bucle forzando un estado estable
      console.log('🛑 Forzando estado estable para romper bucle');
    }
  });
  
  // Estados básicos
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recoveryAttempted, setRecoveryAttempted] = useState(false);
  
  // Función para registrar eventos de autenticación para depuración
  const logAuthEvent = (event, details = {}) => {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = {
        event,
        timestamp,
        details,
        url: window.location.href,
        userAgent: navigator.userAgent.substring(0, 100)
      };
      
      // Guardar en eventLog normal
      const eventLog = JSON.parse(localStorage.getItem('authEventLog') || '[]');
      eventLog.unshift(logEntry);
      
      // Limitar a los últimos 10 eventos
      if (eventLog.length > 10) {
        eventLog.length = 10;
      }
      
      localStorage.setItem('authEventLog', JSON.stringify(eventLog));
      
      // NUEVO: También guardar en un log de emergencia que persiste recargas
      const emergencyLog = JSON.parse(localStorage.getItem('emergencyAuthLog') || '[]');
      emergencyLog.unshift(logEntry);
      
      // Limitar a los últimos 20 eventos para emergencias
      if (emergencyLog.length > 20) {
        emergencyLog.length = 20;
      }
      
      localStorage.setItem('emergencyAuthLog', JSON.stringify(emergencyLog));
      
      // Log adicional en consola con trace para ver el stack
      console.log(`🚨 [AUTH_EVENT] ${event}:`, details);
      if (event.includes('error') || event.includes('failed') || event.includes('invalid')) {
        console.trace(`🚨 Stack trace for ${event}`);
      }
      
    } catch (e) {
      console.error("Error al registrar evento de autenticación:", e);
    }
  };
  
  // Función auxiliar para verificar token
  const isValidToken = (token) => {
    console.log("🔍 [isValidToken] Checking token:", token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.log("🔍 [isValidToken] No token provided");
      return false;
    }
    
    // Verificar que tenga formato JWT (3 segmentos separados por puntos)
    if (token.split('.').length !== 3) {
      console.log("🔍 [isValidToken] Invalid JWT format");
      return false;
    }
    
    try {
      // Intentar decodificar la parte del payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Verificar si el token ha expirado
      if (payload.exp && payload.exp < Date.now() / 1000) {
        console.warn("🔍 [isValidToken] Token expired:", new Date(payload.exp * 1000).toLocaleString());
        logAuthEvent('token_expired', { expiry: new Date(payload.exp * 1000).toLocaleString() });
        
        // NO hacer redirección automática aquí - solo limpiar localStorage
        try {
          console.log("🧹 [isValidToken] Cleaning expired token from localStorage");
          localStorage.removeItem("token");
          localStorage.removeItem("userData");
          localStorage.removeItem("userResponse");
          localStorage.removeItem("tempToken");
        } catch (e) {
          console.error("Error cleaning expired token:", e);
        }
        
        return false;
      }
      
      // Verificar si tiene campo de "iat" (issued at)
      if (!payload.iat) {
        console.warn("🔍 [isValidToken] Token without iat field");
        logAuthEvent('token_without_iat');
      }
      
      console.log("✅ [isValidToken] Token is valid");
      return true;
    } catch (error) {
      console.error("🔍 [isValidToken] Error validating token:", error);
      logAuthEvent('token_validation_error', { error: error.message });
      
      // NO hacer redirección automática aquí - solo limpiar localStorage
      try {
        console.log("🧹 [isValidToken] Cleaning invalid token from localStorage");
        localStorage.removeItem("token");
        localStorage.removeItem("userData");
        localStorage.removeItem("userResponse");
        localStorage.removeItem("tempToken");
      } catch (e) {
        console.error("Error cleaning invalid token:", e);
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
                               fallbackImageBase64;
        
        // Actualizar estado con los datos validados del usuario
        setUser({
          ...userData, // Ya contiene id, name, email, role...
          profileImage: finalProfileImage // Usar la imagen determinada
        });
        setIsAuthenticated(true);
        success = true; // Marcar éxito
        
      } catch (error) {
        console.error("[REFRESH_USER_DATA] Error getting/validating profile, calling logout:", error);
        
        // SOLUCIÓN DE EMERGENCIA: Si el error contiene "auth/me" o es un 404, 
        // probablemente es un problema de build/deployment, no cerrar sesión automáticamente
        const errorMessage = error.message || '';
        if (errorMessage.includes('auth/me') || errorMessage.includes('Cannot GET /auth/me') || errorMessage.includes('404')) {
          console.warn("🚨 [EMERGENCY] Detected auth/me error - probably build/deployment issue. Maintaining session with cached data.");
          
          // Intentar usar datos almacenados en localStorage
          const storedEmail = localStorage.getItem('email');
          const storedName = localStorage.getItem('name');
          const storedRole = localStorage.getItem('role');
          const storedImage = localStorage.getItem('profilePic');
          
          if (storedEmail && storedName) {
            console.log("🔄 [EMERGENCY] Using cached user data to maintain session");
            setUser({
              email: storedEmail,
              name: storedName,
              role: storedRole || 'user',
              profileImage: storedImage || fallbackImageBase64,
              _cached: true,
              _emergencyMode: true
            });
            setIsAuthenticated(true);
            success = true;
            
            // Mostrar notificación al usuario sobre el problema temporal
            window.dispatchEvent(new CustomEvent('temporaryError', {
              detail: { 
                message: 'Problema temporal del servidor. Usando datos almacenados.',
                type: 'warning'
              }
            }));
            
            return; // No hacer logout
          }
        }
        
        // Si no es el error específico o no hay datos cached, proceder con logout normal
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
    console.log(`🔒 [LOGOUT] Initiating logout. Reason: ${reason}, shouldRedirect: ${shouldRedirect}`);
    
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
      localStorage.removeItem("profilePic");
      localStorage.removeItem("profilePic_backup");
      localStorage.removeItem("profilePic_temp");
      sessionStorage.clear(); // Limpiar también sessionStorage
      
      console.log(`🔒 [LOGOUT] State cleared for reason: ${reason}`);
    } catch (e) {
      console.error("❌ Error al eliminar datos de sesión:", e);
    }
    
    // Solo redirigir si se solicita explícitamente y NO estamos ya en la página de login
    if (shouldRedirect && !window.location.pathname.includes('/login')) {
      console.log("🔄 Redirecting to login page...");
      
      // Usar timeout para evitar bucles inmediatos
      setTimeout(() => {
        try {
          // Usar window.location.href en lugar de replace para evitar problemas
          window.location.href = window.location.origin;
        } catch (error) {
          console.error("Error during redirect:", error);
          // Como último recurso, recargar la página
          window.location.reload();
        }
      }, 150); // Aumentar el timeout ligeramente
    } else {
      console.log("🔒 [LOGOUT] No redirect requested or already on login page");
    }
    
    console.log(`🔒 [LOGOUT] Finished.`);
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
    let mounted = true;
    
    const initializeUser = async () => {
      console.log("🚀 [INITIALIZE_USER] Starting user initialization..."); 
      
      try {
        const storedToken = localStorage.getItem('token');
        console.log(`[INITIALIZE_USER] Token in localStorage: ${storedToken ? 'Exists' : 'Not available'}`);

        if (storedToken && isValidToken(storedToken)) {
          console.log("[INITIALIZE_USER] Valid token found. Refreshing user data...");
          if (mounted) await refreshUserData();
        } else {
          console.log("[INITIALIZE_USER] No valid token. Setting user to null.");
          if (mounted) {
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error("❌ [INITIALIZE_USER] Error during initialization:", error);
        if (mounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
          console.log("🚀 [INITIALIZE_USER] Finished.");
        }
      }
    };

    // Solo ejecutar una vez
    initializeUser();
    
    return () => {
      mounted = false;
    };
  }, []); // Array de dependencias vacío para ejecutar solo una vez

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

  // Escuchar cambios en localStorage (simplificado para evitar bucles)
  useEffect(() => {
    const handleStorageChange = (e) => {
      console.log(`🔔 [STORAGE_CHANGE] Event detected: key='${e.key}'`);
      
      // Solo manejar cambios de profilePic para evitar bucles
      if (e.key === 'profilePic') {
        console.log("🔔 [STORAGE_CHANGE] Profile pic changed");
        setUser(prevUser => prevUser ? { 
          ...prevUser, 
          profileImage: e.newValue || fallbackImageBase64 
        } : null);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    console.log("🔔 [STORAGE_CHANGE] Event listener added.");

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      console.log("🔔 [STORAGE_CHANGE] Event listener removed.");
    };
  }, []);

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