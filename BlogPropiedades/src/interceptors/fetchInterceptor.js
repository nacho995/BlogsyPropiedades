// fetchInterceptor.js - Intercepta y corrige todas las llamadas fetch incorrectas
import { BASE_URL } from '../services/api';

// Guarda la implementación original de fetch
const originalFetch = window.fetch;

// Obtener el dominio principal de la aplicación
const APP_DOMAIN = "blogs.realestategozamadrid.com";

// Lista de rutas que requieren el prefijo /api
const apiRoutes = [
  // Rutas principales
  "/blogs", "/properties", 
  // Rutas de autenticación
  "/auth/", "/user/", "/login", "/register", "/profile", 
  // Otras rutas de API
  "/upload", "/images", "/videos", "/contact", "/search"
];

// Función para determinar si una URL está usando el dominio antiguo
const isUsingOldDomain = (url) => {
  return url.includes('nextjs-gozamadrid-qrfk.onrender.com');
};

// Función para determinar si una ruta necesita el prefijo /api
const requiresApiPrefix = (pathName) => {
  // Si ya tiene el prefijo /api, no necesita corrección
  if (pathName.startsWith('/api/')) return false;
  
  // Verificar si la ruta coincide con alguna de las rutas API conocidas
  return apiRoutes.some(route => pathName.startsWith(route));
};

// Función central para corregir rutas (pathName) de acuerdo a reglas específicas
const fixPathName = (pathName) => {
  // Caso especial: auth/me se cambia a /api/user/me (regla especial)
  if (pathName === '/auth/me') {
    console.warn('🛠️ [fixPathName] Corrigiendo /auth/me a /api/user/me');
    return '/api/user/me';
  }
  
  // Rutas principales que necesitan el prefijo /api
  if (pathName === '/blogs' || pathName === '/properties' || pathName === '/user/profile-image') {
    console.warn(`🛠️ [fixPathName] Añadiendo prefijo /api a ${pathName}`);
    return `/api${pathName}`;
  }
  
  // Rutas de autenticación que comienzan con /auth/
  if (pathName.startsWith('/auth/')) {
    console.warn(`🛠️ [fixPathName] Cambiando prefijo de ${pathName} a /api${pathName}`);
    return `/api${pathName}`;
  }
  
  // Verificar si es una ruta que requiere prefijo /api según la lista
  if (requiresApiPrefix(pathName)) {
    console.warn(`🛠️ [fixPathName] Añadiendo prefijo /api a ${pathName} (regla general)`);
    return `/api${pathName}`;
  }
  
  // Si no corresponde a ninguna regla especial, mantener la ruta como está
  return pathName;
};

// Función para corregir URLs incorrectas
const correctUrl = (url) => {
  try {
    // Si no es una cadena, no podemos procesarla
    if (typeof url !== 'string') {
      return url;
    }
    
    // Ignorar llamadas a otros dominios que no son nuestras APIs
    if (url.includes('http') && 
        !url.includes('gozamadrid') && 
        !url.includes('localhost')) {
      return url; // No es una URL relacionada con nuestra API
    }
    // === CASO 1: URL ABSOLUTA CON DOMINIO ANTIGUO ===
    if (isUsingOldDomain(url)) {
      try {
        // Construir la URL original como objeto para manipularla
        const originalUrl = new URL(url);
        
        // Obtener la ruta relativa eliminando el dominio antiguo
        let pathName = originalUrl.pathname;
        
        // Corregir el pathName según las reglas generales
        const newPathName = fixPathName(pathName);
        
        // Construir la nueva URL completa con el dominio correcto
        const correctedUrl = `https://${APP_DOMAIN}${newPathName}${originalUrl.search}`;
        
        console.log(`🔄 [fetchInterceptor] Dominio antiguo corregido: ${url} -> ${correctedUrl}`);
        return correctedUrl;
      } catch (error) {
        console.error('❌ [fetchInterceptor] Error al procesar URL con dominio antiguo:', error);
      }
    }
    
    // === CASO 2: URL ABSOLUTA CON DOMINIO CORRECTO PERO RUTA INCORRECTA ===
    if (url.includes('blogs.realestategozamadrid.com')) {
      try {
        const urlObj = new URL(url);
        const currentPath = urlObj.pathname;
        
        // Aplicar reglas de corrección de ruta
        const newPath = fixPathName(currentPath);
        
        // Solo realizar la corrección si la ruta ha cambiado
        if (newPath !== currentPath) {
          const correctedUrl = `${urlObj.protocol}//${urlObj.host}${newPath}${urlObj.search}`;
          console.log(`🔄 [fetchInterceptor] Dominio correcto, ruta corregida: ${url} -> ${correctedUrl}`);
          return correctedUrl;
        }
      } catch(e) {
        console.error('❌ [fetchInterceptor] Error al procesar URL con dominio correcto:', e);
      }
    }
    
    // === CASO 3: URL RELATIVA QUE NECESITA CORRECCIÓN ===
    if (url.startsWith('/') && !url.startsWith('http')) {
      try {
        // Aplicar reglas de corrección de ruta
        const newPath = fixPathName(url);
        
        // Solo realizar la corrección si la ruta ha cambiado
        if (newPath !== url) {
          console.log(`🔄 [fetchInterceptor] URL relativa corregida: ${url} -> ${newPath}`);
          return newPath;
        }
      } catch(e) {
        console.error('❌ [fetchInterceptor] Error al procesar URL relativa:', e);
      }
    }
  } catch (error) {
    console.error('Error al intentar corregir URL:', error);
  }
  
  // Si no se necesita corrección o hay error, devolver la URL original
  return url;
};

// Función para registrar información sobre la petición para debug
const logRequest = (originalUrl, correctedUrl, options) => {
  if (originalUrl !== correctedUrl) {
    console.log(`💬 [fetchInterceptor] Request interceptado:`);
    console.log(`  - URL Original: ${originalUrl}`);
    console.log(`  - URL Corregida: ${correctedUrl}`);
    console.log(`  - Método: ${options.method || 'GET'}`);
  }
};

// Reemplazar la implementación global de fetch con nuestra versión interceptada
window.fetch = function(url, options = {}) {
  // Aplicar corrección de URL
  const correctedUrl = correctUrl(url);
  
  // Si la URL fue corregida, registrar para debugging
  logRequest(url, correctedUrl, options);
  
  // Llamar al fetch original con la URL corregida
  return originalFetch.call(this, correctedUrl, options)
    .then(response => {
      // Si la respuesta no es exitosa, registrar para ayudar en debug
      if (!response.ok) {
        console.warn(`⚠️ [fetchInterceptor] Respuesta fallida para ${correctedUrl}: ${response.status}`);
      }
      return response;
    })
    .catch(error => {
      console.error(`❌ [fetchInterceptor] Error en petición a ${correctedUrl}:`, error);
      throw error; // Reenviar el error para que sea manejado por el código de la app
    });
};

console.log('🛡️ Interceptor global de fetch instalado para corregir URLs incorrectas');

export default {
  install: () => {
    console.log('🛡️ fetchInterceptor ya está activo globalmente');
  }
};
