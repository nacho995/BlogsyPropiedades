import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile } from '../services/api';
import { ensureHttps } from "../utils/profileUtils";

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
    
    // Verificar estructura básica de JWT (3 partes separadas por puntos)
    const parts = token.split('.');
    return parts.length === 3;
  };

  // Función para actualizar la información del usuario
  const refreshUserData = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      
      // Verificar si el token tiene formato válido
      if (!isValidToken(storedToken)) {
        console.error("Token con formato inválido:", storedToken);
        logout();
        return;
      }
      
      if (storedToken) {
        console.log("Refrescando datos del usuario con token:", storedToken);
        const userData = await getUserProfile(storedToken);
        console.log("Datos de usuario actualizados:", userData);
        
        // Convertir URLs HTTP a HTTPS
        if (userData.profilePic && typeof userData.profilePic === 'string') {
          userData.profilePic = ensureHttps(userData.profilePic);
        } else if (userData.profilePic && userData.profilePic.src) {
          userData.profilePic.src = ensureHttps(userData.profilePic.src);
        }
        
        // También actualizar el localStorage con los datos más recientes
        if (userData.name) localStorage.setItem("name", userData.name);
        if (userData.profilePic) {
          const profilePicUrl = typeof userData.profilePic === 'string' 
            ? userData.profilePic 
            : (userData.profilePic.src || '');
          localStorage.setItem("profilePic", profilePicUrl);
        }
        
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
    try {
      // Validar datos básicos
      if (!userData || !userData.token) {
        console.error("Datos de login incompletos:", userData);
        throw new Error("Datos de login incompletos");
      }
      
      console.log("Guardando datos de login:", userData);
      
      // Guardar en localStorage
      localStorage.setItem("token", userData.token || "");
      
      // Extraer y guardar la URL de la imagen
      let profilePicUrl = "";
      
      if (userData.profilePic) {
        if (typeof userData.profilePic === 'string') {
          profilePicUrl = userData.profilePic;
        } else if (userData.profilePic.src) {
          profilePicUrl = userData.profilePic.src;
        }
        
        // Convertir a HTTPS
        if (profilePicUrl.startsWith('http:')) {
          profilePicUrl = profilePicUrl.replace('http:', 'https:');
        }
        
        // Guardar en localStorage
        localStorage.setItem("profilePic", profilePicUrl);
      }
      
      // Si userData.user está presente, usamos esa estructura
      if (userData.user) {
        // Actualizar estado
        setUser({
          token: userData.token,
          ...userData.user,
          profilePic: profilePicUrl // Asegurar HTTPS
        });
      } else {
        // Estructura antigua
        // Actualizar estado
        setUser({
          token: userData.token,
          name: userData.name,
          profilePic: profilePicUrl // Asegurar HTTPS
        });
      }
      
      setIsAuthenticated(true);
      
      // Refrescar datos inmediatamente para asegurar tener la info más actualizada
      setTimeout(() => {
        refreshUserData();
      }, 500); // Pequeño retraso para asegurar que localStorage está actualizado
    } catch (error) {
      console.error("Error en login:", error);
    }
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
    refreshUserData,
    login,
    logout
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