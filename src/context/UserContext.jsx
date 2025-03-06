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
  
  // Verificar token al iniciar
  useEffect(() => {
    const verificarToken = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          // Hacer una petición simple al backend
          const response = await fetch(`${import.meta.env.VITE_API_PUBLIC_API_URL}/user/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          // Si da error 401, cerrar sesión
          if (response.status === 401) {
            console.log("Token inválido al iniciar");
            logout();
            return;
          }
          
          // Si está bien, mantener la sesión
          if (response.ok) {
            const userData = await response.json();
            setUser({
              token,
              ...userData
            });
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error("Error al verificar token:", error);
          logout();
        }
      }
    };
    
    verificarToken();
  }, []);
  
  // Función de login
  const login = (userData) => {
    // Guardar en localStorage
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("name", userData.name || "");
    localStorage.setItem("profilePic", userData.profilePic || "");
    localStorage.setItem("user", JSON.stringify(userData)); // Guardar todo el objeto
    
    // Actualizar estado
    setUser({
      token: userData.token,
      name: userData.name,
      profilePic: userData.profilePic,
      isAdmin: userData.isAdmin || false,
      email: userData.email || ""
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