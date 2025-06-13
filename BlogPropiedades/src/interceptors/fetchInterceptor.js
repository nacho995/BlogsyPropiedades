// fetchInterceptor.js - Intercepta y corrige todas las llamadas fetch incorrectas
import { BASE_URL } from '../services/api';

// Guarda la implementación original de fetch
const originalFetch = window.fetch;

// Función para determinar si una URL está usando el dominio antiguo
const isUsingOldDomain = (url) => {
  return url.includes('nextjs-gozamadrid-qrfk.onrender.com');
};

// Función para corregir URLs incorrectas
const correctUrl = (url) => {
  try {
    // Si es una cadena que representa la URL
    if (typeof url !== 'string') {
      return url;
    }
    
    // Detectar si la URL es una URL hardcoded en el código compilado
    const isCompleteFetchUrl = url.includes('http') && (
      url.includes('/auth/me') || 
      url.includes('/api/auth/') ||
      url.includes('gozamadrid')
    );
    
    if (isCompleteFetchUrl) {
      console.warn('⚠️ [fetchInterceptor] Detectada URL hardcoded:', url);
    }
    // Si la URL incluye el dominio antiguo, reemplazarlo con el nuevo dominio
    if (isUsingOldDomain(url)) {
      // Construir la URL original como objeto para manipularla
      const originalUrl = new URL(url);
      
      // Obtener la ruta relativa eliminando el dominio antiguo
      let pathName = originalUrl.pathname;
      
      // Corregir la ruta de autenticación si es necesaria
      if (pathName === '/auth/me') {
        console.warn('🛠️ [fetchInterceptor] Corrigiendo ruta de autenticación de /auth/me a /api/user/me');
        pathName = '/api/user/me';
      } else if (pathName.startsWith('/auth/')) {
        console.warn(`🛠️ [fetchInterceptor] Corrigiendo ruta de autenticación de ${pathName} a /api${pathName}`);
        pathName = `/api${pathName}`;
      } else if (!pathName.startsWith('/api/')) {
        // Asegurar que todas las rutas tengan el prefijo /api/
        console.warn(`🛠️ [fetchInterceptor] Añadiendo prefijo /api a ${pathName}`);
        pathName = `/api${pathName}`;
      }
      
      // Construir la nueva URL usando BASE_URL
      const correctedBaseUrl = BASE_URL.endsWith('/api') 
        ? BASE_URL.substring(0, BASE_URL.length - 4) // Eliminar '/api' final si existe
        : BASE_URL;
        
      const correctedUrl = `${correctedBaseUrl}${pathName}`;
      
      console.log(`🔄 [fetchInterceptor] URL corregida: ${url} -> ${correctedUrl}`);
      return correctedUrl;
    }
    
    // Si la URL incluye la ruta incorrecta auth/me pero con dominio correcto
    if (url.includes('blogs.realestategozamadrid.com/auth/me')) {
      const correctedUrl = `${BASE_URL}/user/me`;
      console.log(`🔄 [fetchInterceptor] URL corregida: ${url} -> ${correctedUrl}`);
      return correctedUrl;
    }
    
    // Si es una URL relativa que comienza con /auth/me
    if (url === '/auth/me') {
      const correctedUrl = `${BASE_URL}/user/me`;
      console.log(`🔄 [fetchInterceptor] URL relativa corregida: ${url} -> ${correctedUrl}`);
      return correctedUrl;
    }
  } catch (error) {
    console.error('Error al intentar corregir URL:', error);
  }
  
  // Si no se necesita corrección o hay error, devolver la URL original
  return url;
};

// Reemplazar la implementación global de fetch con nuestra versión interceptada
window.fetch = function(url, options = {}) {
  // Corregir la URL si es necesario
  const correctedUrl = correctUrl(url);
  
  // Llamar al fetch original con la URL corregida
  return originalFetch.call(this, correctedUrl, options);
};

console.log('🛡️ Interceptor global de fetch instalado para corregir URLs incorrectas');

export default {
  install: () => {
    console.log('🛡️ fetchInterceptor ya está activo globalmente');
  }
};
