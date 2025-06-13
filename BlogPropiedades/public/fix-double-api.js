// Script para corregir el problema de doble prefijo /api/api/
(function() {
  console.log('🚫 [DOUBLE-API-FIX] Iniciando corrección para doble prefijo api');
  
  // Verificar si una cadena ya tiene el prefijo /api/
  function hasApiPrefix(url) {
    return url.includes('/api/');
  }
  
  // Limpiar cualquier doble prefijo /api/api/
  function cleanupDoubleApiPrefix(url) {
    if (typeof url !== 'string') return url;
    
    try {
      // Reemplazar /api/api/ por /api/ en cualquier parte de la URL
      if (url.includes('/api/api/')) {
        const newUrl = url.replace(/\/api\/api\//g, '/api/');
        console.log(`🔄 [DOUBLE-API-FIX] Corrigiendo doble prefijo: ${url} → ${newUrl}`);
        return newUrl;
      }
      return url;
    } catch (e) {
      console.error('❌ [DOUBLE-API-FIX] Error:', e);
      return url;
    }
  }
  
  // Interceptar fetch para evitar doble prefijo
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string') {
      input = cleanupDoubleApiPrefix(input);
    } else if (input instanceof Request) {
      input = new Request(cleanupDoubleApiPrefix(input.url), input);
    }
    
    return originalFetch.apply(this, [input, init]);
  };
  
  // Interceptar XMLHttpRequest para evitar doble prefijo
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string') {
      url = cleanupDoubleApiPrefix(url);
    }
    
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  // Parche para los scripts compilados - inspeccionar URLs hardcodeadas
  function fixDoubleApiInScripts() {
    setTimeout(() => {
      console.log('🔍 [DOUBLE-API-FIX] Buscando referencias a /api/api/ en código...');
      
      // Crear un proxy global para objetos con URL para corregir en tiempo real
      if (typeof Proxy !== 'undefined') {
        const originalURL = window.URL;
        
        // Redefinir el comportamiento de URL para limpiar doble prefijo
        window.URL = new Proxy(originalURL, {
          construct(target, args) {
            if (args.length > 0 && typeof args[0] === 'string') {
              args[0] = cleanupDoubleApiPrefix(args[0]);
            }
            return Reflect.construct(target, args);
          }
        });
      }
      
      // Añadir listener para mensajes de error y limpiar URLs
      window.addEventListener('error', function(event) {
        if (event.message && event.message.includes('/api/api/')) {
          console.warn('⚠️ [DOUBLE-API-FIX] Error con URL de doble prefijo detectado');
        }
      });
      
      console.log('✅ [DOUBLE-API-FIX] Protección contra doble prefijo activada');
    }, 1000);
  }
  
  // Ejecutar cuando la página esté lista
  if (document.readyState === 'complete') {
    fixDoubleApiInScripts();
  } else {
    window.addEventListener('load', fixDoubleApiInScripts);
  }
  
  console.log('✅ [DOUBLE-API-FIX] Interceptores para doble prefijo instalados');
})();
