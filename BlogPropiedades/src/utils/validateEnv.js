/**
 * Utilidad para validar las variables de entorno al inicio de la aplicación
 * Esto ayuda a detectar configuraciones incorrectas que podrían causar pantallas en blanco
 */

import { sanitizeUrl, extractDomain } from './urlSanitizer';

// Definir valores por defecto para las variables de entorno críticas
const DEFAULTS = {
  VITE_BACKEND_URL: 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com',
  VITE_API_URL: 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com',
  VITE_API_PUBLIC_API_URL: 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com',
  VITE_FALLBACK_API: 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com',
  VITE_APP_MODE: 'production',
  VITE_MAIN_DOMAIN: 'realestategozamadrid.com',
  VITE_DEBUG_LEVEL: 'error'
};

/**
 * Obtiene un valor de entorno seguro, usando un valor predeterminado si es necesario
 * @param {string} key - Clave de la variable de entorno
 * @returns {string} - Valor de la variable o su valor predeterminado
 */
export const getSafeEnvValue = (key) => {
  try {
    // Intentar obtener el valor de las variables de entorno
    const value = import.meta.env[key];
    
    // Si no hay valor o es inválido, usar valor predeterminado
    if (!value && DEFAULTS[key]) {
      console.warn(`⚠️ Variable ${key} no disponible, usando valor predeterminado`);
      return DEFAULTS[key];
    }
    
    // Si es una URL, asegurarse de que tenga protocolo y formato correcto
    if (value && (
      key.includes('URL') || 
      key.includes('API') ||
      key.includes('BACKEND')
    )) {
      // Sanitizar la URL si es necesario
      return sanitizeUrl(value);
    }
    
    return value || '';
  } catch (error) {
    // En caso de error al acceder a import.meta.env, usar valor predeterminado
    console.error(`Error al acceder a variable ${key}:`, error);
    return DEFAULTS[key] || '';
  }
};

/**
 * Verifica que las variables de entorno necesarias estén definidas y sean válidas
 * @returns {Object} Resultado de la validación con información de errores
 */
export const validateEnvironment = () => {
  const issues = [];
  const warnings = [];
  
  try {
    // Variables requeridas
    const requiredVars = [
      'VITE_BACKEND_URL',
      'VITE_API_URL',
      'VITE_API_PUBLIC_API_URL'
    ];
    
    // Variables opcionales pero recomendadas
    const recommendedVars = [
      'VITE_APP_MODE',
      'VITE_MAIN_DOMAIN',
      'VITE_DEBUG_LEVEL',
      'VITE_FALLBACK_API'
    ];
    
    // Verificar variables requeridas
    requiredVars.forEach(varName => {
      try {
        const value = getSafeEnvValue(varName);
        if (!value) {
          issues.push(`La variable de entorno ${varName} no está definida`);
        } else if (
          (varName.includes('URL') || varName.includes('API')) && 
          !isValidUrl(value)
        ) {
          // Intentar sanitizar antes de reportar como error
          const sanitized = sanitizeUrl(value);
          if (!isValidUrl(sanitized)) {
            issues.push(`La variable de entorno ${varName} no contiene una URL válida: ${value}`);
          } else {
            // Si se pudo sanitizar, solo advertir
            warnings.push(`La variable de entorno ${varName} fue corregida a: ${sanitized}`);
          }
        }
      } catch (err) {
        issues.push(`Error al validar ${varName}: ${err.message}`);
      }
    });
    
    // Verificar variables recomendadas
    recommendedVars.forEach(varName => {
      try {
        const value = getSafeEnvValue(varName);
        if (!value) {
          warnings.push(`La variable de entorno recomendada ${varName} no está definida`);
        }
      } catch (err) {
        warnings.push(`Error al validar ${varName}: ${err.message}`);
      }
    });
    
    // Verificar si todas las URLs apuntan al mismo backend
    const apiUrls = [
      getSafeEnvValue('VITE_BACKEND_URL'),
      getSafeEnvValue('VITE_API_URL'), 
      getSafeEnvValue('VITE_API_PUBLIC_API_URL')
    ].filter(Boolean);
    
    if (apiUrls.length > 1) {
      const domains = apiUrls.map(extractDomain);
      const uniqueDomains = [...new Set(domains)];
      
      if (uniqueDomains.length > 1) {
        warnings.push(`Las variables de API apuntan a diferentes dominios: ${uniqueDomains.join(', ')}`);
      }
    }
  } catch (generalError) {
    issues.push(`Error general de validación: ${generalError.message}`);
    console.error("Error durante la validación de entorno:", generalError);
  }
  
  // Registrar resultados
  if (issues.length > 0) {
    console.error('❌ Problemas de configuración detectados:');
    issues.forEach(issue => console.error(`- ${issue}`));
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ Advertencias de configuración:');
    warnings.forEach(warning => console.warn(`- ${warning}`));
  }
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('✅ Variables de entorno validadas correctamente');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    environment: getSafeEnvValue('MODE') || 'production'
  };
};

/**
 * Verifica si una cadena es una URL válida
 * @param {string} urlString - URL a validar
 * @returns {boolean} - True si es válida
 */
function isValidUrl(urlString) {
  try {
    // Usar la función sanitizeUrl para asegurar formato correcto
    const sanitized = sanitizeUrl(urlString);
    
    // Verificar que sea una URL válida
    const url = new URL(sanitized);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Inicializa la validación de variables de entorno y configura valores por defecto
 * @returns {Object} Resultado de la validación
 */
export const initEnvValidation = () => {
  try {
    // Verificar si ya hay una variable guardada para evitar bucles de recarga
    try {
      const lastValidation = localStorage.getItem('env_validation');
      if (lastValidation) {
        const data = JSON.parse(lastValidation);
        const now = new Date();
        const timestamp = new Date(data.timestamp);
        const diff = now - timestamp;
        
        // Si la última validación fue hace menos de 10 segundos y hubo recargas
        if (diff < 10000 && data.reloadCount && data.reloadCount > 2) {
          console.warn('⚠️ Múltiples recargas detectadas, omitiendo validación para evitar bucle');
          return {
            isValid: true,
            issues: [],
            warnings: ['Validación omitida para evitar bucle de recargas'],
            environment: 'production'
          };
        }
      }
    } catch (e) {
      // Ignorar errores al leer localStorage
    }
    
    // Ejecutar validación inmediatamente
    const result = validateEnvironment();
    
    // Almacenar resultado para diagnóstico
    if (result.issues.length > 0 || result.warnings.length > 0) {
      try {
        // Obtener el conteo de recargas previo
        let reloadCount = 0;
        try {
          const lastValidation = localStorage.getItem('env_validation');
          if (lastValidation) {
            const data = JSON.parse(lastValidation);
            reloadCount = data.reloadCount || 0;
          }
        } catch (e) {
          // Ignorar errores
        }
        
        localStorage.setItem('env_validation', JSON.stringify({
          timestamp: new Date().toISOString(),
          reloadCount: reloadCount + 1,
          ...result
        }));
      } catch (e) {
        console.error('Error al guardar validación:', e);
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error fatal durante la inicialización de validación:", error);
    return {
      isValid: false,
      issues: [`Error fatal: ${error.message}`],
      warnings: [],
      environment: 'unknown'
    };
  }
}; 