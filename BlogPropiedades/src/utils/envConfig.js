/**
 * Configuración centralizada de variables de entorno
 * Este archivo proporciona acceso seguro a las variables de entorno
 * con valores predeterminados en caso de error
 */

import { getSafeEnvValue } from './validateEnv';

// Variables de backend
export const API_URL = getSafeEnvValue('VITE_API_PUBLIC_API_URL');
export const BACKEND_URL = getSafeEnvValue('VITE_BACKEND_URL');
export const PUBLIC_API_URL = getSafeEnvValue('VITE_API_PUBLIC_API_URL');

// Variables de configuración
export const APP_MODE = getSafeEnvValue('VITE_APP_MODE');
export const MAIN_DOMAIN = getSafeEnvValue('VITE_MAIN_DOMAIN');
export const DEBUG_LEVEL = getSafeEnvValue('VITE_DEBUG_LEVEL');

// Función para determinar si estamos en producción
export const isProduction = () => {
  const mode = getSafeEnvValue('MODE') || 'production';
  return mode === 'production';
};

// Función para determinar si estamos en modo de depuración
export const isDebug = () => {
  return DEBUG_LEVEL === 'debug';
};

// Función para obtener la URL completa de un endpoint
export const getApiEndpoint = (path) => {
  // Asegurarse de que la URL base no termina en / y el path no comienza con /
  const basePath = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${basePath}/${cleanPath}`;
};

/**
 * Obtiene la URL correcta del backend según el entorno
 * @param {string} endpoint - Endpoint de la API
 * @returns {string} URL completa
 */
export const getBackendUrl = (endpoint = '') => {
  try {
    const url = BACKEND_URL || 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return path ? `${baseUrl}/${path}` : baseUrl;
  } catch (error) {
    console.error('Error al obtener URL del backend:', error);
    // Valor de respaldo en caso de error
    return 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
  }
};

/**
 * Datos básicos del entorno
 */
export const ENV_DATA = {
  // Información básica del entorno
  environment: getSafeEnvValue('MODE') || 'production',
  apiUrl: API_URL,
  backendUrl: BACKEND_URL,
  appMode: APP_MODE,
  domain: MAIN_DOMAIN,
  debugLevel: DEBUG_LEVEL,
  
  // Métodos útiles
  isProduction: isProduction(),
  isDebug: isDebug()
};

// Registrar en consola información sobre el entorno
if (isDebug()) {
  console.log('Configuración de entorno:', ENV_DATA);
}

export default ENV_DATA; 