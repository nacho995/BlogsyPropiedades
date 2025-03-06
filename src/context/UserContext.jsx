import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// Crear contexto
export const UserContext = createContext();

// Proveedor del contexto
export function UserProvider({ children }) {
  // Estados básicos
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  
  // Cargar usuario al iniciar
  useEffect(() => {
    // Verificar si hay token en localStorage
    const token = localStorage.getItem("token");
    
    if (token) {
      // Si hay token, cargar datos del usuario
      setUser({
        token,
        name: localStorage.getItem("name") || "",
        profilePic: localStorage.getItem("profilePic") || ""
      });
      setIsAuthenticated(true);
    }
  }, []);
  
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('logout', handleLogout);
    
    return () => {
      window.removeEventListener('logout', handleLogout);
    };
  }, []);
  
  // Mejora en verificarToken para manejar error 500
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        // Si hay respuesta correcta del servidor
        if (response.ok) {
          const userData = await response.json();
          
          setUser({
            token,
            ...userData
          });
          
          localStorage.setItem("profilePic", userData.profilePic || "");
          localStorage.setItem("name", userData.name || "");
          
          setIsAuthenticated(true);
          return;
        }
        
        // Si hay error 500 u otro error, no cerrar sesión, usar datos locales
        if (response.status === 500) {
          console.warn("Error 500 del servidor, usando datos locales");
          
          // Usar los datos de respaldo 
          setUser({
            token,
            name: localStorage.getItem("name") || "",
            profilePic: localStorage.getItem("profilePic") || localStorage.getItem("profilePic_local") || "",
            _fromLocalStorage: true
          });
          setIsAuthenticated(true);
          return;
        }
        
        // Solo para error 401 (no autorizado) cerrar sesión
        if (response.status === 401) {
          console.log("Token inválido, cerrando sesión");
          logout();
          return;
        }
      } catch (error) {
        console.error("Error de red al verificar usuario:", error);
        
        // Si falla la conexión, usar datos de localStorage pero no cerrar sesión
        setUser({
          token,
          name: localStorage.getItem("name") || "",
          profilePic: localStorage.getItem("profilePic") || localStorage.getItem("profilePic_local") || "",
          _fromLocalStorage: true
        });
        setIsAuthenticated(true);
      }
    };
    
    verificarToken();
  }, []);
  
  // Función de logout
  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("profilePic");
    localStorage.removeItem("user");
    
    // Resetear estado
    setUser(null);
    setIsAuthenticated(false);
    navigate("/");
  };
  
  // Escuchar el evento session-expired para manejar el cierre de sesión
  useEffect(() => {
    const handleSessionExpired = (event) => {
      logout();
    };
    
    window.addEventListener('session-expired', handleSessionExpired);
    
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, [logout]); // Ahora logout ya existe
  
  // Función de login
  const login = async (credentials) => {
    try {
      const result = await fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      });
      
      if (result.token) {
        // Guardar como JSON para objetos complejos
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        // Si hay profilePic como objeto, guardar serializado
        if (result.user.profilePic) {
          localStorage.setItem('profilePic', JSON.stringify(result.user.profilePic));
        }
        
        setUser({
          token: result.token,
          ...result.user
        });
        
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  };
  
  // Comprobar si hay imágenes nuevas cada cierto tiempo
  useEffect(() => {
    // Solo verificar si el usuario está conectado
    if (!user || !isAuthenticated) {
      console.log("👤 No hay usuario autenticado, no se verificarán actualizaciones");
      return;
    }
    
    console.log("🔄 Configurando verificación periódica de actualizaciones de perfil");
    
    // Función para buscar actualizaciones del perfil
    const buscarActualizaciones = async () => {
      console.log("🔍 Verificando actualizaciones de perfil...");
      
      try {
        const datos = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/me`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        
        if (datos.ok) {
          const datosUsuario = await datos.json();
          
          // Comparar URLs de imágenes, no los objetos completos
          const urlImagenActual = typeof user.profilePic === 'object' ? 
                                 (user.profilePic?.src || '') : 
                                 (user.profilePic || '');
                               
          const urlImagenNueva = typeof datosUsuario.profilePic === 'object' ? 
                                (datosUsuario.profilePic?.src || '') : 
                                (datosUsuario.profilePic || '');
          
          console.log("🔍 Comparando URLs de imágenes:");
          console.log("  - Actual:", urlImagenActual);
          console.log("  - Nueva:", urlImagenNueva);
          
          // Solo actualizar si las URLs son diferentes
          if (datosUsuario.profilePic && urlImagenActual !== urlImagenNueva) {
            console.log("🔄 ¡Nueva imagen de perfil detectada!");
            
            setUser(prevUser => ({
              ...prevUser,
              profilePic: datosUsuario.profilePic
            }));
            
            // Guardar como JSON en localStorage
            localStorage.setItem('profilePic', JSON.stringify(datosUsuario.profilePic));
            
            // Actualizar también el objeto usuario completo en localStorage
            if (localStorage.getItem('user')) {
              const userStored = JSON.parse(localStorage.getItem('user'));
              userStored.profilePic = datosUsuario.profilePic;
              localStorage.setItem('user', JSON.stringify(userStored));
            }
            
            console.log("📦 Actualizado localStorage con nueva imagen");
          } else {
            console.log("✓ No hay cambios en la imagen de perfil");
          }
        } else {
          console.log("⚠️ Respuesta no exitosa al verificar actualizaciones:", datos.status);
        }
      } catch (error) {
        console.log("❌ Error al comprobar actualizaciones:", error);
      }
    };
    
    // Verificar cambios cada 2 minutos
    console.log("⏰ Programando verificación cada 2 minutos");
    const intervalo = setInterval(buscarActualizaciones, 2 * 60 * 1000);
    
    // También verificar al inicio
    console.log("🚀 Verificando actualizaciones al inicio");
    buscarActualizaciones();
    
    // Limpiar intervalo al desmontar
    return () => {
      console.log("🧹 Limpiando intervalo de verificación");
      clearInterval(intervalo);
    };
  }, [user, isAuthenticated]);
  
  // Función para actualizar solo la imagen de perfil
  const updateProfileImage = (imageUrl) => {
    setUser(prev => prev ? {
      ...prev,
      profilePic: imageUrl
    } : null);
    
    // Si es un objeto, guardar como JSON
    if (typeof imageUrl === 'object') {
      localStorage.setItem("profilePic", JSON.stringify(imageUrl));
    } else {
      localStorage.setItem("profilePic", imageUrl);
    }
    
    // Actualizar usuario completo
    if (localStorage.getItem('user')) {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      storedUser.profilePic = imageUrl;
      localStorage.setItem('user', JSON.stringify(storedUser));
    }
  };
  
  // Valores del contexto
  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    updateProfileImage
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

// Hook para usar el contexto
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser debe usarse dentro de un UserProvider");
  }
  return context;
} 