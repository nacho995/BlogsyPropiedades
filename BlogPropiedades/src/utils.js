/**
 * Archivo de utilidades generales para la aplicación
 */

// Función para detectar errores repetitivos
export const detectAndPreventLoopError = (errorKey, timeout = 5000, maxCount = 5) => {
  try {
    const now = Date.now();
    const recentErrors = JSON.parse(localStorage.getItem(`recentErrors_${errorKey}`) || '[]');
    
    // Filtrar para mantener solo errores recientes
    const veryRecentErrors = recentErrors.filter(time => (now - time) < timeout);
    
    // Guardar el registro del nuevo error
    veryRecentErrors.push(now);
    
    // Mantener solo los últimos 20 errores
    if (veryRecentErrors.length > 20) {
      veryRecentErrors.splice(0, veryRecentErrors.length - 20);
    }
    
    // Guardar la lista actualizada
    localStorage.setItem(`recentErrors_${errorKey}`, JSON.stringify(veryRecentErrors));
    
    // Detectar si hay demasiados errores en poco tiempo
    if (veryRecentErrors.length >= maxCount) {
      console.error(`Bucle de errores detectado para: ${errorKey}`);
      localStorage.removeItem(`recentErrors_${errorKey}`);
      return true; // Bucle detectado
    }
    
    return false; // No hay bucle
  } catch (error) {
    console.error('Error en detectAndPreventLoopError:', error);
    return false;
  }
};

// Función para combinar URLs
export const combineUrls = (baseUrl, relativeUrl) => {
  if (!baseUrl) return relativeUrl;
  if (!relativeUrl) return baseUrl;
  
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const relative = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  
  return `${base}${relative}`;
};

// Para usar en lugar de ErrorHandler en los componentes
export default {
  detectAndPreventLoopError,
  combineUrls
}; 