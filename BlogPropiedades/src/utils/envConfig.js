/**
 * Configuración centralizada de variables de entorno
 * Este archivo proporciona acceso seguro a las variables de entorno
 * con valores predeterminados en caso de error
 */

import { getSafeEnvValue } from './validateEnv';
import { sanitizeUrl, combineUrls, getDefaultApiUrl } from './urlSanitizer';

// Variables de backend con sanitización de URLs
export const API_URL = sanitizeUrl(getSafeEnvValue('VITE_API_PUBLIC_API_URL') || getDefaultApiUrl());
export const BACKEND_URL = sanitizeUrl(getSafeEnvValue('VITE_BACKEND_URL') || getDefaultApiUrl());
export const PUBLIC_API_URL = sanitizeUrl(getSafeEnvValue('VITE_API_PUBLIC_API_URL') || getDefaultApiUrl());

// URL de respaldo para casos de error
export const FALLBACK_API = sanitizeUrl(getSafeEnvValue('VITE_FALLBACK_API') || getDefaultApiUrl());

// Variables de configuración
export const APP_MODE = getSafeEnvValue('VITE_APP_MODE') || 'production';
export const MAIN_DOMAIN = getSafeEnvValue('VITE_MAIN_DOMAIN') || 'realestategozamadrid.com';
export const DEBUG_LEVEL = getSafeEnvValue('VITE_DEBUG_LEVEL') || 'error';

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
  return combineUrls(API_URL, path);
};

/**
 * Obtiene la URL correcta del backend según el entorno
 * @param {string} endpoint - Endpoint de la API
 * @returns {string} URL completa
 */
export const getBackendUrl = (endpoint = '') => {
  try {
    return combineUrls(BACKEND_URL, endpoint);
  } catch (error) {
    console.error('Error al obtener URL del backend:', error);
    // Valor de respaldo en caso de error
    return combineUrls(getDefaultApiUrl(), endpoint);
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
  publicApiUrl: PUBLIC_API_URL,
  fallbackApi: FALLBACK_API,
  appMode: APP_MODE,
  domain: MAIN_DOMAIN,
  debugLevel: DEBUG_LEVEL,
  
  // Métodos útiles
  isProduction: isProduction(),
  isDebug: isDebug()
};

// Registrar en consola información sobre el entorno
if (isDebug() || DEBUG_LEVEL === 'info') {
  console.log('Configuración de entorno:', ENV_DATA);
}

export default ENV_DATA; 