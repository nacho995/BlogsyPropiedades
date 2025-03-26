/**
 * Bootstrap script para acceso directo a la API
 */
(() => {
  console.log('🔄 Inicializando bootstrap...');

  // SOLUCIÓN ESPECÍFICA PARA ERRORES DE INICIALIZACIÓN EN CÓDIGO MINIFICADO
  try {
    // Definir Nc globalmente para evitar el error "Cannot access 'Nc' before initialization"
    // Esta es una solución para evitar errores en código minificado
    if (typeof window.Nc === 'undefined') {
      console.log('🔧 Aplicando parche para evitar error de Nc');
      window.Nc = {};
      window.__ncPatched = true;
    }
    
    // Otros nombres de variables minificadas comunes que podrían causar problemas similares
    // Esto crea un proxy global que captura intentos de acceder a propiedades indefinidas
    window.__safeInitProxy = new Proxy({}, {
      get: function(target, name) {
        // Si la propiedad no existe, crearla como un objeto vacío
        if (!(name in target)) {
          console.log(`🔧 Interceptando acceso a variable indefinida: ${String(name)}`);
          target[name] = {};
        }
        return target[name];
      }
    });
    
    // Asignar las variables más comunes que causan problemas
    ['qe', 'Qe', 'ec', 'En', 'In', 'Ht', 'Gt', 'wa', 'qa', 'Na', 'Ma', 'Sa', 'Se'].forEach(varName => {
      if (typeof window[varName] === 'undefined') {
        window[varName] = window.__safeInitProxy;
      }
    });
    
    console.log('✅ Parche de variables aplicado');
  } catch (e) {
    console.error('Error al aplicar parche de variables:', e);
  }

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