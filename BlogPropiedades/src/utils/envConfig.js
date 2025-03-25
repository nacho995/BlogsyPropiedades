/**
 * Configuración centralizada de variables de entorno
 * Este archivo proporciona acceso seguro a las variables de entorno
 * con valores predeterminados en caso de error
 */

import { getSafeEnvValue } from './validateEnv';
import { sanitizeUrl, combineUrls, getDefaultApiUrl } from './urlSanitizer';

// URL correcta para la API - siempre HTTP
const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
const PRODUCTION_API_URL = `http://${API_DOMAIN}`;

// Variables de backend con sanitización de URLs
export const API_URL = PRODUCTION_API_URL;

export const PUBLIC_API_URL = PRODUCTION_API_URL;

// URL de respaldo para casos de error
export const FALLBACK_API = PRODUCTION_API_URL;

// URL segura (HTTPS) para recursos públicos
export const SECURE_ASSET_URL = 'https://api.realestategozamadrid.com';

// URL para el API Gateway de AWS (si está configurado)
export const API_GATEWAY_URL = 'https://api.realestategozamadrid.com';

// URL para el CDN de archivos estáticos (si está configurado)
export const STATIC_FILES_URL = 'https://api.realestategozamadrid.com';

// Nivel de depuración para la aplicación
export const DEBUG_LEVEL = getSafeEnvValue('VITE_DEBUG_LEVEL') || 'error';

// Modo de la aplicación (development, production, etc.)
export const APP_MODE = getSafeEnvValue('VITE_APP_MODE') || 'production';

// Dominio principal para cookies
export const MAIN_DOMAIN = getSafeEnvValue('VITE_MAIN_DOMAIN') || 'realestategozamadrid.com';

// Función para determinar si estamos en producción
export const isProduction = () => {
  return true; // Siempre asumir que estamos en producción
};

// Función para determinar si estamos en modo de depuración
export const isDebug = () => {
  return false; // Desactivar el modo de depuración para evitar problemas
};

// Función para obtener la URL completa de un endpoint
export const getApiEndpoint = (path) => {
  return combineUrls(PRODUCTION_API_URL, path);
};

/**
 * Obtiene la URL correcta del backend según el entorno
 * @param {string} endpoint - Endpoint de la API
 * @returns {string} URL completa
 */
export const getBackendUrl = (endpoint = '') => {
  try {
    return combineUrls(PRODUCTION_API_URL, endpoint);
  } catch (error) {
    console.error('Error al obtener URL del backend:', error);
    // Valor de respaldo en caso de error
    return combineUrls(PRODUCTION_API_URL, endpoint);
  }
};

/**
 * Datos básicos del entorno
 */
export const ENV_DATA = {
  // Información básica del entorno
  environment: 'production',
  apiUrl: PRODUCTION_API_URL,
  backendUrl: PRODUCTION_API_URL,
  publicApiUrl: PRODUCTION_API_URL,
  fallbackApi: PRODUCTION_API_URL,
  appMode: APP_MODE,
  domain: MAIN_DOMAIN,
  debugLevel: DEBUG_LEVEL,
  
  // Métodos útiles
  isProduction: true,
  isDebug: false
};

// Registrar en consola información sobre el entorno
if (DEBUG_LEVEL === 'info') {
  console.log('Configuración de entorno:', ENV_DATA);
}

export default ENV_DATA; 