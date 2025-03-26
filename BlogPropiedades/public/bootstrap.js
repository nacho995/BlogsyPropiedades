/**
 * Bootstrap script para acceso directo a la API
 */
(() => {
  console.log('🔄 Inicializando bootstrap...');

  // Función para retrasar la ejecución para evitar problemas de inicialización
  const waitAndExecute = (fn, delay = 50) => {
    return new Promise(resolve => {
      setTimeout(() => {
        try {
          const result = fn();
          resolve(result);
        } catch (error) {
          console.error('Error en ejecución diferida:', error);
          resolve(null);
        }
      }, delay);
    });
  };

  // 1. Configurar sistema de acceso a API seguro
  const setupApiAccess = async () => {
    console.log('🔧 Configurando sistema de acceso a API');
    
    try {
      // Esperar un momento para asegurar que todo está cargado
      await waitAndExecute(() => {}, 100);
      
      // Función para convertir URLs HTTP a HTTPS
      const ensureHttps = (url) => {
        if (!url) return url;
        
        // Convertir explícitamente a HTTPS las URLs de API
        if (url.startsWith('http://')) {
          url = url.replace('http://', 'https://');
        }
        return url;
      };

      // Guardar las funciones originales para no sobrecargar
      if (!window._originalFetch) {
        window._originalFetch = window.fetch;
      }

      // Sobrescribir la función fetch para asegurar HTTPS
      window.fetch = async function(...args) {
        if (args.length > 0 && typeof args[0] === 'string') {
          args[0] = ensureHttps(args[0]);
        }
        return window._originalFetch.apply(this, args);
      };

      // Configurar XMLHttpRequest para HTTPS
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function(method, url, ...rest) {
        const secureUrl = ensureHttps(url);
        return originalOpen.call(this, method, secureUrl, ...rest);
      };
      
      console.log('✅ Sistema de acceso a API configurado');
      return true;
    } catch (error) {
      console.error('❌ Error al configurar sistema de acceso a API:', error);
      return false;
    }
  };

  // Ejecutar la configuración con manejo de errores
  const init = async () => {
    try {
      // Paso 1: Configurar acceso a API
      await setupApiAccess();
      console.log('✅ Bootstrap completado - Acceso directo a API configurado');
    } catch (error) {
      console.error('❌ Error durante bootstrap:', error);
    }
  };

  // Iniciar con un pequeño retraso para evitar problemas de orden de carga
  setTimeout(init, 50);
})(); 