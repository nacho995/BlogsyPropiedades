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