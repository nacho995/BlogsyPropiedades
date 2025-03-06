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
  
  // Mejorar la verificación inicial para obtener siempre la imagen más reciente
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      try {
        // Siempre consultar al servidor para obtener datos actualizados
        const response = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          
          // Actualizar todos los datos, incluida la imagen de perfil
          setUser({
            token,
            ...userData
          });
          
          // Guardar también en localStorage para tener respaldo
          localStorage.setItem("profilePic", userData.profilePic || "");
          localStorage.setItem("name", userData.name || "");
          
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Error al verificar datos de usuario:", error);
        // En caso de error, usar datos de respaldo del localStorage
        setUser({
          token,
          name: localStorage.getItem("name") || "",
          profilePic: localStorage.getItem("profilePic") || ""
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
    
    localStorage.setItem("user", JSON.stringify({
      ...userData,
      profilePic // Asegurar que siempre tenemos profilePic consistente
    }));
    
    // Actualizar estado
    setUser({
      token: userData.token,
      name: userData.name,
      profilePic: profilePic,
      profileImage: userData.profileImage, // Mantener ambas propiedades
      isAdmin: userData.isAdmin || false,
      email: userData.email || "",
      _updatedAt: new Date().toISOString()
    });
    setIsAuthenticated(true);
  };
  
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