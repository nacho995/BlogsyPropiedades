import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from '../services/api';

// Crear contexto
export const UserContext = createContext();

// Proveedor del contexto
export function UserProvider({ children }) {
  // Estados básicos
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Función para actualizar la información del usuario
  const refreshUserData = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log("Refrescando datos del usuario con token:", storedToken);
        const userData = await getUserProfile(storedToken);
        console.log("Datos de usuario actualizados:", userData);
        
        // También actualizar el localStorage con los datos más recientes
        if (userData.name) localStorage.setItem("name", userData.name);
        if (userData.profilePic) localStorage.setItem("profilePic", userData.profilePic);
        
        setUser({
          ...userData,
          token: storedToken, // Asegurarnos de mantener el token
        });
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error al refrescar los datos del usuario:", error);
      // Si hay un error de autenticación, limpiamos todo
      if (error.message.includes("inválido") || error.message.includes("expirado")) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // Inicializar autenticación desde localStorage al cargar
  useEffect(() => {
    const initAuth = async () => {
      await refreshUserData();
    };
    
    initAuth();
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
  
  // Función de login
  const login = (userData) => {
    // Guardar en localStorage
    localStorage.setItem("token", userData.token || "");
    localStorage.setItem("name", userData.name || "");
    localStorage.setItem("profilePic", userData.profilePic || "");
    
    // Actualizar estado
    setUser({
      token: userData.token,
      name: userData.name,
      profilePic: userData.profilePic
    });
    setIsAuthenticated(true);
    
    // Refrescar datos inmediatamente para asegurar tener la info más actualizada
    refreshUserData();
  };
  
  // Función de logout
  const logout = () => {
    // Limpiar localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    localStorage.removeItem("profilePic");
    
    // Resetear estado
    setUser(null);
    setIsAuthenticated(false);
    navigate("/");
  };
  
  // Valores del contexto
  const value = {
    user,
    setUser,
    isAuthenticated,
    setIsAuthenticated,
    loading,
    refreshUserData
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