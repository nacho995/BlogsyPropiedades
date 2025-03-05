import { useContext, useEffect } from 'react';
import { UserContext } from '../components/UserContext';

/**
 * Hook personalizado para interceptar respuestas de API y manejar errores comunes
 * como tokens expirados o problemas de autenticación
 */
export const useApiInterceptor = () => {
  const { logout } = useContext(UserContext);
  
  useEffect(() => {
    // Guardar la función fetch original
    const originalFetch = window.fetch;
    
    // Reemplazar la función fetch con nuestra versión interceptada
    window.fetch = async (...args) => {
      try {
        // Realizar la petición original
        const response = await originalFetch(...args);
        
        // Si la respuesta es 401 (Unauthorized), cerrar sesión
        if (response.status === 401) {
          try {
            const responseData = await response.clone().json();
            
            // Si el mensaje indica que el token ha expirado, cerrar sesión
            if (responseData.message === 'Invalid token' || 
                responseData.error?.includes('jwt expired')) {
              console.log('Token expirado o inválido detectado en respuesta API, cerrando sesión...');
              logout();
            }
          } catch (parseError) {
            // Si no podemos parsear la respuesta como JSON, continuamos
            console.error('Error al parsear respuesta 401:', parseError);
          }
        }
        
        return response;
      } catch (error) {
        console.error('Error en fetch interceptado:', error);
        throw error;
      }
    };
    
    // Limpiar al desmontar
    return () => {
      window.fetch = originalFetch;
    };
  }, [logout]);
}; 