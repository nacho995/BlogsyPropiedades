/**
 * Utilidades para sanitizar y validar URLs
 * Este archivo proporciona funciones para asegurar que las URLs de API
 * siempre sean HTTP, incluso cuando el frontend está en HTTPS.
 */

/**
 * Sanitiza una URL asegurando que las APIs siempre usen HTTPS
 * @param {string} url - URL a sanitizar
 * @returns {string} - URL sanitizada (HTTPS para APIs y recursos externos)
 */
export const sanitizeUrl = (url) => {
  if (!url) return '';
  
  // Eliminar espacios en blanco
  let sanitized = url.trim();
  
  // Eliminar comillas si las hay
  sanitized = sanitized.replace(/^["']|["']$/g, '');
  
  // Determinar si es una URL de API
  const isApiUrl = sanitized.includes('api.realestategozamadrid.com');
  
  // Si ya tiene protocolo, ajustar según tipo de URL
  if (sanitized.includes('://')) {
    if (isApiUrl) {
      // Para APIs, SIEMPRE usar HTTPS
      sanitized = sanitized.replace(/^http:\/\//, 'https://');
      if (!sanitized.startsWith('https://')) {
        sanitized = sanitized.replace(/^.*:\/\//, 'https://');
      }
    } else {
      // Para recursos externos, preferir HTTPS
      if (!sanitized.startsWith('https://') && !sanitized.startsWith('http://')) {
        sanitized = sanitized.replace(/^.*:\/\//, 'https://');
      }
    }
  } else {
    // Si no tiene protocolo, añadir HTTPS
    sanitized = `https://${sanitized}`;
  }
  
  return sanitized;
};

/**
 * Valida si una URL es realmente accesible
 * @param {string} url - URL a validar
 * @returns {Promise<boolean>} - true si la URL es accesible
 */
export const validateUrlAccessibility = async (url) => {
  try {
    // Si no hay URL, no es accesible
    if (!url) return false;
    
    // Si es una URL de datos, es accesible
    if (url.startsWith('data:')) return true;
    
    // Sanitizar la URL antes de validarla
    const sanitizedUrl = sanitizeUrl(url);
    
    // Verificar si la URL es accesible
    const response = await fetch(sanitizedUrl, { 
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      timeout: 5000
    });
    
    return true; // Si llega aquí, la URL es accesible
  } catch (error) {
    console.warn(`URL no accesible: ${url}`);
    return false;
  }
};

/**
 * Obtiene un dominio seguro a partir de una URL
 * @param {string} url - URL de la que extraer el dominio
 * @returns {string} - Dominio extraído
 */
export const extractDomain = (url) => {
  try {
    // Sanitizar la URL
    const sanitizedUrl = sanitizeUrl(url);
    
    // Extraer el dominio
    const urlObj = new URL(sanitizedUrl);
    return urlObj.hostname;
  } catch (error) {
    // Si falla, intentar extraer el dominio de forma manual
    const sanitized = sanitizeUrl(url);
    const match = sanitized.match(/^https?:\/\/([^\/]+)/i);
    return match ? match[1] : '';
  }
};

/**
 * Combina una URL base con un endpoint
 * @param {string} baseUrl - URL base
 * @param {string} endpoint - Endpoint a añadir
 * @returns {string} - URL combinada
 */
export const combineUrls = (baseUrl, endpoint = '') => {
  try {
    // Sanitizar la URL base (HTTP para APIs)
    let sanitizedBase = sanitizeUrl(baseUrl);
    
    // Eliminar slash final de la base si existe
    const base = sanitizedBase.endsWith('/') 
      ? sanitizedBase.slice(0, -1) 
      : sanitizedBase;
    
    // Eliminar slash inicial del endpoint si existe
    const path = endpoint.startsWith('/') 
      ? endpoint.slice(1) 
      : endpoint;
    
    // Combinar
    return path ? `${base}/${path}` : base;
  } catch (error) {
    console.error('Error al combinar URLs:', error);
    return sanitizeUrl(baseUrl);
  }
};

/**
 * Devuelve una URL predeterminada segura para casos de error
 * @returns {string} - URL predeterminada con HTTPS
 */
export const getDefaultApiUrl = () => {
  return 'https://api.realestategozamadrid.com';
};

// Exportar todas las funciones
export default {
  sanitizeUrl,
  validateUrlAccessibility,
  extractDomain,
  combineUrls,
  getDefaultApiUrl
}; 