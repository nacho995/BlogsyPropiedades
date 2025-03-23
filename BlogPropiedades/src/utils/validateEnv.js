/**
 * Utilidad para validar las variables de entorno al inicio de la aplicación
 * Esto ayuda a detectar configuraciones incorrectas que podrían causar pantallas en blanco
 */

/**
 * Verifica que las variables de entorno necesarias estén definidas y sean válidas
 * @returns {Object} Resultado de la validación con información de errores
 */
export const validateEnvironment = () => {
  const issues = [];
  const warnings = [];
  
  // Variables requeridas
  const requiredVars = [
    'VITE_BACKEND_URL',
    'VITE_API_URL',
    'VITE_API_PUBLIC_API_URL'
  ];
  
  // Variables opcionales pero recomendadas
  const recommendedVars = [
    'VITE_APP_MODE',
    'VITE_MAIN_DOMAIN'
  ];
  
  // Verificar variables requeridas
  requiredVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      issues.push(`La variable de entorno ${varName} no está definida`);
    } else if (
      (varName.includes('URL') || varName.includes('API')) && 
      !isValidUrl(value)
    ) {
      issues.push(`La variable de entorno ${varName} no contiene una URL válida: ${value}`);
    }
  });
  
  // Verificar variables recomendadas
  recommendedVars.forEach(varName => {
    const value = import.meta.env[varName];
    if (!value) {
      warnings.push(`La variable de entorno recomendada ${varName} no está definida`);
    }
  });
  
  // Verificar si todas las URLs apuntan al mismo backend
  const apiUrls = [
    import.meta.env.VITE_BACKEND_URL,
    import.meta.env.VITE_API_URL, 
    import.meta.env.VITE_API_PUBLIC_API_URL
  ].filter(Boolean);
  
  if (apiUrls.length > 1) {
    const domains = apiUrls.map(extractDomain);
    const uniqueDomains = [...new Set(domains)];
    
    if (uniqueDomains.length > 1) {
      warnings.push(`Las variables de API apuntan a diferentes dominios: ${uniqueDomains.join(', ')}`);
    }
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
    environment: import.meta.env.MODE || 'unknown'
  };
};

/**
 * Verifica si una cadena es una URL válida
 * @param {string} urlString - URL a validar
 * @returns {boolean} - True si es válida
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extrae el dominio base de una URL
 * @param {string} urlString - URL de la que extraer el dominio
 * @returns {string} - Dominio base
 */
function extractDomain(urlString) {
  try {
    const url = new URL(urlString);
    return url.hostname;
  } catch {
    return urlString;
  }
}

// Exportamos una función para inicializar la validación
export const initEnvValidation = () => {
  // Ejecutar validación inmediatamente
  const result = validateEnvironment();
  
  // Almacenar resultado para diagnóstico
  if (result.issues.length > 0 || result.warnings.length > 0) {
    try {
      localStorage.setItem('env_validation', JSON.stringify({
        timestamp: new Date().toISOString(),
        ...result
      }));
    } catch (e) {
      console.error('Error al guardar validación:', e);
    }
  }
  
  return result;
}; 