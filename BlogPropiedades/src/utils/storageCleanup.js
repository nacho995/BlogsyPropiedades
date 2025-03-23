/**
 * Utilidades para limpiar localStorage y resolver problemas de almacenamiento
 * que podrían causar ciclos infinitos o errores en la aplicación
 */

/**
 * Busca y limpia datos potencialmente corruptos en localStorage
 * @returns {Object} Informe de limpieza
 */
export const cleanupStorage = () => {
  console.log("🧹 Iniciando limpieza de localStorage...");
  const report = {
    cleanedItems: [],
    errors: [],
    timestamp: new Date().toISOString()
  };
  
  try {
    // Lista de claves a verificar
    const keysToCheck = [
      'profilePic',
      'profilePic_local',
      'profilePic_base64',
      'profilePic_url',
      'token',
      'tempToken',
      'user',
      'lastRenderCycle',
      'errorsHistory'
    ];
    
    // Verificar cada clave
    keysToCheck.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        
        // Verificar si hay datos
        if (value) {
          // Verificar si es una URL corrupta o string vacío
          if (key.includes('profilePic') && 
              (value === '""' || value === '"' || value === "'" || 
               value === "''" || value.includes('undefined'))) {
            localStorage.removeItem(key);
            report.cleanedItems.push({ key, reason: 'URL corrupta o vacía' });
          }
          
          // Verificar si es un objeto JSON inválido en claves que deberían tener JSON
          if (key === 'user' || key === 'lastRenderCycle' || key === 'errorsHistory') {
            try {
              JSON.parse(value);
            } catch (e) {
              localStorage.removeItem(key);
              report.cleanedItems.push({ key, reason: 'JSON inválido' });
            }
          }
        }
      } catch (error) {
        report.errors.push({ key, error: error.message });
      }
    });
    
    // Registrar resultado
    if (report.cleanedItems.length > 0) {
      console.log(`✅ Se limpiaron ${report.cleanedItems.length} elementos potencialmente problemáticos`);
    } else {
      console.log("✅ No se encontraron problemas en localStorage");
    }
    
    // Guardar reporte en localStorage para diagnóstico
    localStorage.setItem('lastCleanupReport', JSON.stringify(report));
    
    return report;
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    report.errors.push({ global: true, error: error.message });
    return report;
  }
};

/**
 * Limpieza de emergencia - resetea completamente el localStorage
 * Solo usar cuando hay problemas serios
 */
export const emergencyReset = () => {
  try {
    // Guardar información crítica temporalmente
    const email = localStorage.getItem('email');
    const name = localStorage.getItem('name');
    
    // Limpiar todo el localStorage
    localStorage.clear();
    console.log("🧨 Reset de emergencia ejecutado: localStorage completamente limpio");
    
    // Restaurar información mínima
    if (email) localStorage.setItem('email', email);
    if (name) localStorage.setItem('name', name);
    
    // Registrar el reset
    localStorage.setItem('emergencyResetExecuted', new Date().toISOString());
    
    return { success: true, timestamp: new Date().toISOString() };
  } catch (error) {
    console.error("❌ Error durante el reset de emergencia:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Detecta y corrige problemas de ciclos de renderizado
 * @returns {boolean} true si se detectaron y corrigieron problemas
 */
export const fixRenderCycleIssues = () => {
  try {
    // Verificar ciclos de renderizado
    const cycleData = localStorage.getItem('lastRenderCycle');
    
    if (cycleData) {
      try {
        const cycle = JSON.parse(cycleData);
        const now = Date.now();
        const timestamp = new Date(cycle.timestamp).getTime();
        
        // Si el ciclo es reciente (menos de 30 segundos)
        if (now - timestamp < 30000 && cycle.count > 10) {
          console.warn("🔄 Detectados ciclos de renderizado recientes, limpiando datos problemáticos");
          
          // Limpiar datos de autenticación que podrían estar corruptos
          localStorage.removeItem('token');
          localStorage.removeItem('tempToken');
          localStorage.removeItem('profilePic');
          localStorage.removeItem('lastRenderCycle');
          
          return true;
        }
      } catch (e) {
        // Si hay error al parsear, eliminar el dato corrupto
        localStorage.removeItem('lastRenderCycle');
      }
    }
    
    return false;
  } catch (error) {
    console.error("❌ Error al verificar ciclos de renderizado:", error);
    return false;
  }
};

export default {
  cleanupStorage,
  emergencyReset,
  fixRenderCycleIssues
}; 