import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { loginUser, getAuthenticatedUser } from '../services/api';
import { jwtDecode } from 'jwt-decode';

// Contexto de autenticación
const AuthContext = createContext();

// Proveedor de autenticación
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [error, setError] = useState(null);
  
  // Al montar, verificar si hay un token válido
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }
        
        try {
          // Verificar si el token es válido y no ha expirado
          const decoded = jwtDecode(token);
          const currentTime = Date.now() / 1000;
          
          if (decoded.exp < currentTime) {
            // Token expirado
            console.log('Token expirado en useAuth, cerrando sesión');
            
            // Limpiar estado
            localStorage.removeItem('token');
            setIsAuthenticated(false);
            setUser(null);
            
            // Enviar evento de cierre de sesión por token expirado
            window.dispatchEvent(new CustomEvent('userLoggedOut', {
              detail: { reason: 'token_expired' }
            }));
            
            // Redirigir a página de login
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            
            return;
          }
          
          console.log('Contenido del token en useAuth:', decoded);
          
          // Token válido
          setIsAuthenticated(true);
          
          // Cargar datos del usuario
          await fetchUserData();
        } catch (decodeError) {
          console.error('Error al decodificar token en useAuth:', decodeError);
          
          // Token inválido
          setIsAuthenticated(false);
          setUser(null);
          localStorage.removeItem('token');
          
          // Enviar evento de error de autenticación
          window.dispatchEvent(new CustomEvent('authError', {
            detail: { error: decodeError.message }
          }));
          
          // Enviar evento de cierre de sesión por token inválido
          window.dispatchEvent(new CustomEvent('userLoggedOut', {
            detail: { reason: 'token_invalid' }
          }));
        }
      } catch (error) {
        console.error('Error al verificar autenticación en useAuth:', error);
        setIsAuthenticated(false);
        setUser(null);
        
        // Enviar evento de error de autenticación
        window.dispatchEvent(new CustomEvent('authError', {
          detail: { error: error.message }
        }));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);
  
  // Función para iniciar sesión
  const login = async (credentials) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await loginUser(credentials);
      
      if (result.success) {
        setIsAuthenticated(true);
        
        // Guardar token en localStorage se hace en loginUser
        
        // Obtener datos completos del usuario
        await fetchUserData();
        
        return { success: true };
      } else {
        setError(result.message || 'Error en la autenticación');
        setIsAuthenticated(false);
        setUser(null);
        return { success: false, message: result.message };
      }
    } catch (error) {
      console.error('Error en login:', error);
      setError(error.message || 'Error en el servidor');
      setIsAuthenticated(false);
      setUser(null);
      return { success: false, message: error.message };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cerrar sesión
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    // No eliminamos profilePic para evitar parpadeos
    setIsAuthenticated(false);
    setUser(null);
  };
  
  // Función para obtener información del usuario
  const fetchUserData = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      
      // Intentar obtener los datos del usuario
      const userData = await getAuthenticatedUser();
      
      // Almacenar la respuesta completa para acceso posterior
      localStorage.setItem('userResponse', JSON.stringify(userData));
      
      if (userData && !userData.error) {
        // Guardar la información básica del usuario
        const userInfo = {
          id: userData._id,
          name: userData.name || 'Usuario',
          email: userData.email,
          role: userData.role || 'user',
        };
        
        // Almacenar información en el estado
        setUser(userInfo);
        
        // Comprobar y manejar la imagen de perfil
        if (userData.profileImage) {
          let profileImageUrl = null;
          
          if (typeof userData.profileImage === 'string') {
            profileImageUrl = userData.profileImage;
          } else if (userData.profileImage && typeof userData.profileImage === 'object') {
            profileImageUrl = userData.profileImage.src || userData.profileImage.url;
          }
          
          if (profileImageUrl) {
            localStorage.setItem('profilePic', profileImageUrl);
            localStorage.setItem('profilePic_backup', profileImageUrl);
          }
        }
        
        if (userData.profilePic) {
          let profilePicUrl = null;
          
          if (typeof userData.profilePic === 'string') {
            profilePicUrl = userData.profilePic;
          } else if (userData.profilePic && typeof userData.profilePic === 'object') {
            profilePicUrl = userData.profilePic.src || userData.profilePic.url;
          }
          
          if (profilePicUrl) {
            localStorage.setItem('profilePic', profilePicUrl);
            localStorage.setItem('profilePic_backup', profilePicUrl);
            
            // Actualizar userData con la imagen
            if (userData) {
              userData.profilePic = profilePicUrl;
              userData.profileImage = profilePicUrl;
              localStorage.setItem('userData', JSON.stringify(userData));
            }
          }
        }
        
        // Almacenar datos del usuario para acceso offline
        localStorage.setItem('userData', JSON.stringify({
          ...userInfo,
          profileImage: userData.profileImage || null,
          profilePic: userData.profilePic || null
        }));
        
        console.log('Información del usuario:', userInfo);
        if (userInfo.role === 'ADMIN' || userInfo.role === 'admin') {
          console.log('Usuario es admin, añadiendo rutas de administrador');
        }
        
        return true;
      } else {
        console.error('Respuesta al obtener datos de usuario:', userData);
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error('Error en fetchUserData:', error);
      setUser(null);
      return false;
    } finally {
      setIsLoadingUser(false);
    }
  }, []);
  
  // Recuperar información del token
  const getTokenInfo = useCallback(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      
      const decoded = jwtDecode(token);
      return decoded;
    } catch (error) {
      console.error('Error al decodificar token:', error);
      return null;
    }
  }, []);
  
  // Valor del contexto
  const contextValue = {
    isAuthenticated,
    user,
    isLoading,
    isLoadingUser,
    error,
    login,
    logout,
    fetchUserData,
    getTokenInfo
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder al contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  
  return context;
};

export default useAuth; 