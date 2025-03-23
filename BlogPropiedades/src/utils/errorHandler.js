import React from 'react';

/**
 * Utilidades para manejo de errores en la aplicación
 */

// Función para registrar errores en consola con formato mejorado
export const logError = (error, componentName = "Desconocido", extraInfo = {}) => {
  console.group(`Error en ${componentName}`);
  console.error(error.message || error);
  if (error.stack) {
    console.error("Stack:", error.stack);
  }
  console.log("Información adicional:", extraInfo);
  console.groupEnd();

  // En producción, podríamos enviar el error a un servicio de monitoreo
  if (process.env.NODE_ENV === 'production') {
    try {
      // Si hay algún servicio de telemetría, podrías usarlo aquí
      const errorData = {
        message: error.message || String(error),
        stack: error.stack,
        component: componentName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        ...extraInfo
      };
      
      // Almacenar en localStorage para diagnóstico
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorData);
      // Mantener solo los últimos 10 errores
      if (errors.length > 10) errors.shift();
      localStorage.setItem('app_errors', JSON.stringify(errors));
      
      console.log("Error registrado en localStorage para diagnóstico");
    } catch (e) {
      console.error("Error al registrar error:", e);
    }
  }
};

// Función para crear un componente de error
export const createErrorComponent = () => {
  return React.createElement('div', 
    { className: 'p-4 bg-red-50 border border-red-200 rounded-md' },
    React.createElement('h3', 
      { className: 'text-red-700 font-semibold' }, 
      'Error de renderizado'
    ),
    React.createElement('p', 
      { className: 'text-red-600' }, 
      'Lo sentimos, ha ocurrido un error al mostrar este componente.'
    )
  );
};

// Función para recuperarse de errores de renderizado
export const recoverFromRenderError = (error, info) => {
  logError(error, "Render", info);
  return {
    shouldRender: true,
    fallbackUI: createErrorComponent()
  };
};

// Función para recuperar datos locales en caso de fallo de API
export const recoverFromAPIError = (endpoint, fallbackData = null) => {
  try {
    // Intentar obtener datos en caché
    const cachedData = localStorage.getItem(`cache_${endpoint}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
    return fallbackData;
  } catch (e) {
    logError(e, "API Recovery");
    return fallbackData;
  }
};

// Función para inicializar capturas de errores globales
export const initializeErrorHandlers = () => {
  // Capturar errores no manejados de promesas
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason || new Error('Promesa rechazada sin razón específica'),
      'Promesa no manejada'
    );
  });

  // Capturar excepciones no manejadas
  window.addEventListener('error', (event) => {
    logError(
      event.error || new Error(event.message || 'Error desconocido'),
      'Error global',
      { 
        filename: event.filename,
        lineNo: event.lineno,
        colNo: event.colno
      }
    );
  });

  // Interceptar console.error para mejorar el registro
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Llamar a la función original
    originalConsoleError.apply(console, args);
    
    // Si estamos en producción, registrar el error
    if (process.env.NODE_ENV === 'production') {
      // Guardar solo errores reales, no mensajes de consola normales
      const errorObj = args.find(arg => arg instanceof Error) || 
                      (typeof args[0] === 'string' ? new Error(args[0]) : null);
      
      if (errorObj) {
        logError(errorObj, 'Console.error');
      }
    }
  };
};

// Función para recuperarse de errores específicos de URL
export const handleUrlErrors = (urlErrors) => {
  const isUrlError = Array.isArray(urlErrors) && 
                     urlErrors.length > 0 && 
                     urlErrors.some(error => error.includes('URL') && error.includes('válida'));
  
  if (isUrlError) {
    console.warn('⚠️ Detectados errores de formato de URL, aplicando corrección automática...');
    
    try {
      // Registrar el error para diagnóstico
      const errorData = {
        type: 'url_validation',
        errors: urlErrors,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      
      localStorage.setItem('url_errors', JSON.stringify(errorData));
      
      // Esperar un momento para que los logs se registren y luego recargar
      setTimeout(() => {
        console.log('🔄 Recargando para aplicar corrección de URLs...');
        window.location.reload();
      }, 2000);
      
      return true; // Error manejado
    } catch (e) {
      console.error("Error al manejar errores de URL:", e);
      return false; // Error no manejado
    }
  }
  
  return false; // No hay errores de URL
};

/**
 * Utilidades para el manejo centralizado de errores en la aplicación
 */

// Contador de errores de API para detectar fallos recurrentes
let apiErrorCounter = 0;
let apiErrorTimestamp = Date.now();
const API_ERROR_THRESHOLD = 5; // Número máximo de errores antes de considerar un fallo general
const API_ERROR_WINDOW = 60000; // Ventana de tiempo para contar errores (60 segundos)

/**
 * Registra un error de API y determina si debemos mostrar un mensaje de error general
 * @param {Error} error - Error capturado
 * @returns {boolean} - true si debemos mostrar un error general
 */
export const trackApiError = (error) => {
  const now = Date.now();
  
  // Reiniciar el contador si ha pasado la ventana de tiempo
  if (now - apiErrorTimestamp > API_ERROR_WINDOW) {
    apiErrorCounter = 0;
    apiErrorTimestamp = now;
  }
  
  // Incrementar el contador de errores
  apiErrorCounter++;
  
  // Guardar información del error en localStorage para diagnóstico
  try {
    // Obtener errores previos o inicializar array
    const storedErrors = JSON.parse(localStorage.getItem('api_errors') || '[]');
    
    // Añadir nuevo error al array, limitando a los 10 más recientes
    const newErrors = [
      {
        message: error.message,
        timestamp: new Date().toISOString(),
        url: error.config?.url || 'desconocida',
        status: error.response?.status || 'desconocido'
      },
      ...storedErrors
    ].slice(0, 10);
    
    localStorage.setItem('api_errors', JSON.stringify(newErrors));
  } catch (e) {
    console.warn('No se pudo guardar el error en localStorage');
  }
  
  // Determinar si hemos alcanzado el umbral de errores
  return apiErrorCounter >= API_ERROR_THRESHOLD;
};

/**
 * Reinicia el contador de errores de API
 */
export const resetApiErrorCounter = () => {
  apiErrorCounter = 0;
  apiErrorTimestamp = Date.now();
};

/**
 * Analiza un error y determina un mensaje amigable para mostrar al usuario
 * @param {Error} error - Error capturado
 * @returns {string} - Mensaje de error amigable
 */
export const getFriendlyErrorMessage = (error) => {
  // Error de red
  if (error.message && (
      error.message.includes('Network Error') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('network request failed')
    )) {
    return 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.';
  }
  
  // Error 401 - No autorizado
  if (error.response?.status === 401) {
    return 'Tu sesión ha expirado o no tienes autorización. Por favor, inicia sesión nuevamente.';
  }
  
  // Error 403 - Prohibido
  if (error.response?.status === 403) {
    return 'No tienes permisos para realizar esta acción.';
  }
  
  // Error 404 - No encontrado
  if (error.response?.status === 404) {
    return 'El recurso solicitado no existe o ha sido movido.';
  }
  
  // Error 500 - Error de servidor
  if (error.response?.status >= 500) {
    return 'Ocurrió un error en el servidor. Por favor, intenta nuevamente más tarde.';
  }
  
  // Mensaje por defecto
  return error.message || 'Ha ocurrido un error inesperado.';
};

/**
 * Objeto global para manejo de errores
 */
const ErrorHandler = {
  trackApiError,
  resetApiErrorCounter,
  getFriendlyErrorMessage
};

export default ErrorHandler; 