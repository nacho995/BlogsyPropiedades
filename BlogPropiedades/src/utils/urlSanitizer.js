/**
 * Utilidades para sanitizar y validar URLs
 * Este archivo proporciona funciones para asegurar que las URLs
 * siempre tengan el formato correcto, incluso cuando las variables
 * de entorno están mal configuradas.
 */

/**
 * Sanitiza una URL asegurando que tenga el protocolo correcto
 * @param {string} url - URL a sanitizar
 * @param {boolean} forceHttp - Forzar el uso de HTTP en lugar de HTTPS
 * @returns {string} - URL sanitizada
 */
export const sanitizeUrl = (url, forceHttp = true) => {
  if (!url) return '';
  
  // Eliminar espacios en blanco
  let sanitized = url.trim();
  
  // Eliminar comillas si las hay
  sanitized = sanitized.replace(/^["']|["']$/g, '');
  
  // Si es una API de GozaMadrid, asegurar que use HTTP
  const isApiUrl = sanitized.includes('gozamadrid-api') || 
                  sanitized.includes('api.realestategozamadrid.com') ||
                  sanitized.includes('goza-madrid.onrender.com');
  
  // Si ya tiene protocolo, verificar que sea válido
  if (sanitized.includes('://')) {
    if (isApiUrl || forceHttp) {
      // Para APIs de GozaMadrid, usar siempre HTTP ya que el servidor no soporta HTTPS
      sanitized = sanitized.replace(/^https:\/\//, 'http://');
      if (!sanitized.startsWith('http://')) {
        sanitized = sanitized.replace(/^.*:\/\//, 'http://');
      }
    } else {
      // Para otros URLs, preferir HTTPS
      if (sanitized.startsWith('http://') && !forceHttp) {
        sanitized = sanitized.replace('http://', 'https://');
      } else if (!sanitized.startsWith('https://') && !sanitized.startsWith('http://')) {
        // Si tiene otro protocolo, corregirlo
        sanitized = sanitized.replace(/^.*:\/\//, forceHttp ? 'http://' : 'https://');
      }
    }
  } else {
    // Si no tiene protocolo, añadir el protocolo según corresponda
    sanitized = `${isApiUrl || forceHttp ? 'http' : 'https'}://${sanitized}`;
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
    // Sanitizar la URL base
    let sanitizedBase = sanitizeUrl(baseUrl);
    
    // Convertir HTTPS a HTTP para Elastic Beanstalk
    if (sanitizedBase.startsWith('https:') && sanitizedBase.includes('elasticbeanstalk.com')) {
      console.warn('⚠️ Convirtiendo URL de Elastic Beanstalk de HTTPS a HTTP:', sanitizedBase);
      sanitizedBase = sanitizedBase.replace('https:', 'http:');
    }
    
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
 * @returns {string} - URL predeterminada
 */
export const getDefaultApiUrl = () => {
  // Siempre usar HTTP para la API de Elastic Beanstalk
  return 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
};

// Exportar todas las funciones
export default {
  sanitizeUrl,
  validateUrlAccessibility,
  extractDomain,
  combineUrls,
  getDefaultApiUrl
}; 