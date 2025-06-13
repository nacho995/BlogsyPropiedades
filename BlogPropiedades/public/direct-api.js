// DIRECT-API.js - Forzar conexión directa a la API correcta
(function() {
  console.log('🔍 [DIRECT-API] Iniciando diagnóstico y conexión directa a la API');
  
  // Configuración básica
  const BACKEND_URL = 'https://blogs.realestategozamadrid.com';
  const API_PREFIX = '/api';
  
  // Función para realizar una petición directa a la API
  async function directApiCall(endpoint) {
    const fullUrl = `${BACKEND_URL}${API_PREFIX}${endpoint}`;
    console.log(`🔄 [DIRECT-API] Realizando llamada directa a: ${fullUrl}`);
    
    try {
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Direct-Api-Call': 'true', // Header personalizado para identificar estas llamadas
          'Cache-Control': 'no-cache, no-store'
        },
        // Importantes para evitar problemas de cache
        cache: 'no-store',
        credentials: 'same-origin',
      });
      
      // Leer respuesta como texto para inspección
      const responseText = await response.text();
      
      // Verificar si es JSON o HTML
      let isJson = false;
      let jsonData = null;
      
      try {
        jsonData = JSON.parse(responseText);
        isJson = true;
        console.log(`✅ [DIRECT-API] La respuesta es JSON válido:`, jsonData);
      } catch (e) {
        console.error(`❌ [DIRECT-API] La respuesta NO es JSON válido:`, responseText.substring(0, 200));
      }
      
      // Devolver información completa para diagnóstico
      return { 
        success: response.ok,
        isJson, 
        status: response.status, 
        data: jsonData, 
        html: !isJson ? responseText : null,
        headers: Array.from(response.headers.entries())
      };
    } catch (error) {
      console.error(`❌ [DIRECT-API] Error en petición directa:`, error);
      return { success: false, error: error.message };
    }
  }
  
  // Diagnóstico completo
  async function runApiDiagnostic() {
    console.log(`🩺 [DIRECT-API] Ejecutando diagnóstico completo de API...`);
    
    // Probar endpoints críticos
    const endpoints = [
      '/properties',
      '/blogs',
      '/user/me'
    ];
    
    // Resultados del diagnóstico
    const results = {};
    
    // Probar cada endpoint
    for (const endpoint of endpoints) {
      results[endpoint] = await directApiCall(endpoint);
    }
    
    // Mostrar resultados en consola
    console.log(`📊 [DIRECT-API] Resultados del diagnóstico:`, results);
    
    // Guardar en localStorage para futura referencia
    localStorage.setItem('api_diagnostic_results', JSON.stringify({
      timestamp: new Date().toISOString(),
      results
    }));
    
    return results;
  }
  
  // Registrar en el objeto window para acceso desde la consola
  window.__directApiCall = directApiCall;
  window.__runApiDiagnostic = runApiDiagnostic;
  
  // Ejecutar diagnóstico automáticamente
  setTimeout(() => {
    console.log(`🏁 [DIRECT-API] Iniciando diagnóstico automático...`);
    runApiDiagnostic().then(results => {
      // Mostrar un resumen de resultados en consola
      for (const [endpoint, result] of Object.entries(results)) {
        if (result.success && result.isJson) {
          console.log(`✅ [DIRECT-API] ${endpoint}: OK - JSON válido recibido`);
        } else if (result.success && !result.isJson) {
          console.error(`❌ [DIRECT-API] ${endpoint}: ERROR - Respuesta es HTML, no JSON`);
        } else {
          console.error(`❌ [DIRECT-API] ${endpoint}: ERROR - ${result.error || `HTTP ${result.status}`}`);
        }
      }
    });
  }, 2000);
  
  // Función para añadir un botón de diagnóstico en la pantalla
  function addDiagnosticButton() {
    const button = document.createElement('button');
    button.textContent = '🔍 Diagnosticar API';
    button.style.position = 'fixed';
    button.style.bottom = '10px';
    button.style.right = '10px';
    button.style.zIndex = '9999';
    button.style.padding = '8px 16px';
    button.style.backgroundColor = '#007bff';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    
    button.onclick = function() {
      runApiDiagnostic().then(() => {
        alert('Diagnóstico completado. Revisa la consola para ver los resultados.');
      });
    };
    
    document.body.appendChild(button);
  }
  
  // Añadir botón cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addDiagnosticButton);
  } else {
    setTimeout(addDiagnosticButton, 1000);
  }
  
  console.log('✅ [DIRECT-API] Herramientas de diagnóstico API instaladas');
})();
