/**
 * Bootstrap script para acceso directo a la API
 */
(() => {
  console.log('🔄 Inicializando bootstrap...');

  // SOLUCIÓN ESPECÍFICA PARA ERRORES DE INICIALIZACIÓN EN CÓDIGO MINIFICADO
  try {
    // Verificar si Nc ya está definido
    if (typeof window.Nc === 'undefined') {
      console.log('🔧 Aplicando parche para evitar error de Nc');
      window.Nc = {};
      window.__ncPatched = true;
    } else {
      console.log('✅ Nc ya está definido');
    }
    
    // Otros nombres de variables minificadas comunes que podrían causar problemas similares
    // Esto crea un proxy global que captura intentos de acceder a propiedades indefinidas
    if (!window.__safeInitProxy) {
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
    }
    
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

  // Configurar el sistema de acceso a API
  try {
    console.log('🔧 Configurando sistema de acceso a API');
    
    // Asegurar que Nc esté disponible antes de continuar
    if (typeof window.Nc === 'undefined') {
      window.Nc = {};
    }
    
    // Configurar el sistema de acceso a API
    window.__apiConfig = {
      baseUrl: 'https://api.realestategozamadrid.com',
      timeout: 10000,
      retries: 3,
      retryDelay: 1000
    };
    
    console.log('✅ Sistema de acceso a API configurado');
  } catch (error) {
    console.error('Error al configurar sistema de acceso a API:', error);
  }

  console.log('✅ Bootstrap completado - Acceso directo a API configurado');
})(); 