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
  const login = (userData) => {
    // Guardar en localStorage
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("name", userData.name || "");
    
    // Guardar la imagen de perfil (considerar ambas propiedades)
    const profilePic = userData.profileImage || userData.profilePic || "";
    localStorage.setItem("profilePic", profilePic);
    
    // Guardar timestamp para control de sincronización
    const timestamp = new Date().toISOString();
    
    // Guardar usuario completo con datos actualizados
    localStorage.setItem("user", JSON.stringify({
      ...userData,
      profilePic, // Asegurar consistencia
      lastUpdated: timestamp
    }));
    
    // Actualizar estado
    setUser({
      token: userData.token,
      name: userData.name,
      profilePic: profilePic,
      profileImage: userData.profileImage, // Mantener ambas propiedades
      isAdmin: userData.isAdmin || false,
      email: userData.email || "",
      lastUpdated: timestamp
    });
    setIsAuthenticated(true);
  };
  
  // Verificación periódica de actualizaciones
  useEffect(() => {
    // Solo verificar si el usuario está autenticado
    if (!isAuthenticated || !user?.token) return;
    
    const checkForUpdates = async () => {
      try {
        const userData = await getCurrentUser();
        
        // Comprobar si hay cambios
        if (userData.profilePic !== user.profilePic || userData.name !== user.name) {
          console.log("Detectados cambios en el perfil desde otro dispositivo");
          
          // Actualizar estado con datos nuevos
          setUser(prev => ({
            ...prev,
            name: userData.name || prev.name,
            profilePic: userData.profilePic || prev.profilePic,
            lastChecked: new Date().toISOString()
          }));
        }
      } catch (error) {
        console.warn("Error al verificar actualizaciones de perfil:", error);
      }
    };
    
    // Verificar cada 5 minutos (ajustar según necesidades)
    const intervalId = setInterval(checkForUpdates, 5 * 60 * 1000);
    
    // Verificar una vez al inicio
    checkForUpdates();
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, user?.token]);
  
  // Función para actualizar solo la imagen de perfil
  const updateProfileImage = (imageUrl) => {
    setUser(prev => prev ? {
      ...prev,
      profilePic: imageUrl
    } : null);
    
    // Actualizar también en localStorage
    localStorage.setItem("profilePic", imageUrl);
    
    // Si guardas el usuario completo en localStorage, actualízalo también
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