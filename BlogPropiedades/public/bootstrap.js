/**
 * Bootstrap script para la inicialización segura de la aplicación
 * Este script se ejecuta antes del bundle principal y establece
 * valores por defecto para las variables de entorno críticas
 */
(function() {
  // Detectar y corregir URLs sin protocolo en localStorage
  const ENV_VARS = [
    'VITE_BACKEND_URL',
    'VITE_API_URL',
    'VITE_API_PUBLIC_API_URL',
    'VITE_FALLBACK_API'
  ];
  
  // Valores por defecto para casos de error
  const DEFAULT_API = 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
  
  // Función para sanitizar URLs
  function sanitizeUrl(url) {
    if (!url) return '';
    
    // Eliminar espacios en blanco
    let sanitized = url.trim();
    
    // Eliminar comillas si las hay
    sanitized = sanitized.replace(/^["']|["']$/g, '');
    
    // Si ya tiene protocolo, verificar que sea válido
    if (sanitized.includes('://')) {
      // Asegurarse de que sea http o https, preferiblemente https
      if (sanitized.startsWith('http://')) {
        sanitized = sanitized.replace('http://', 'https://');
      } else if (!sanitized.startsWith('https://')) {
        // Si tiene otro protocolo, corregirlo
        sanitized = sanitized.replace(/^.*:\/\//, 'https://');
      }
    } else {
      // Si no tiene protocolo, añadir https://
      sanitized = `https://${sanitized}`;
    }
    
    return sanitized;
  }
  
  // Función para verificar si hay errores en localStorage
  function checkForErrorState() {
    try {
      // Verificar si hay errores almacenados
      const storedErrors = localStorage.getItem('env_validation');
      if (storedErrors) {
        try {
          const data = JSON.parse(storedErrors);
          // Si hay más de 5 recargas en menos de 1 minuto, limpiar localStorage
          if (data.reloadCount && data.reloadCount > 5 && data.timestamp) {
            const timestamp = new Date(data.timestamp);
            const now = new Date();
            const diff = now - timestamp;
            
            if (diff < 60000) { // 1 minuto
              console.warn('🔄 Detectado posible bucle de recargas, limpiando localStorage');
              
              // Guardar token y datos importantes
              const token = localStorage.getItem('token');
              const profilePic = localStorage.getItem('profilePic');
              
              // Limpiar localStorage
              localStorage.clear();
              
              // Restaurar datos importantes
              if (token) localStorage.setItem('token', token);
              if (profilePic) localStorage.setItem('profilePic', profilePic);
              
              return true;
            }
          }
        } catch (e) {
          // Ignorar errores
        }
      }
    } catch (e) {
      // Ignorar errores
    }
    
    return false;
  }
  
  // Función principal de inicialización
  function init() {
    try {
      console.log('🔄 Inicializando bootstrap...');
      
      // Verificar si hay errores almacenados
      const isErrorState = checkForErrorState();
      
      // Si estamos en un estado de error, no continuar con más correcciones
      if (isErrorState) {
        console.log('⚠️ Detectado estado de error, omitiendo correcciones adicionales');
        return;
      }
      
      // Recorremos el localStorage buscando claves que puedan contener URLs
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Si la clave contiene alguna de las palabras clave de URL
        if (key && (key.includes('URL') || key.includes('API') || key.includes('BACKEND'))) {
          try {
            const value = localStorage.getItem(key);
            
            // Si el valor parece ser una URL sin protocolo
            if (value && !value.includes('://') && !value.startsWith('{') && !value.startsWith('[')) {
              console.log(`🔄 Corrigiendo URL en localStorage: ${key}`);
              localStorage.setItem(key, sanitizeUrl(value));
            }
          } catch (e) {
            // Ignorar errores
          }
        }
      }
      
      // Verificar si hay errores de URL y establecer valores por defecto
      if (window.ENV_VARS) {
        ENV_VARS.forEach(key => {
          const value = window.ENV_VARS[key];
          if (!value || (typeof value === 'string' && !value.includes('://'))) {
            console.log(`🔄 Corrigiendo variable de entorno: ${key}`);
            window.ENV_VARS[key] = sanitizeUrl(value || DEFAULT_API);
          }
        });
      }
      
      console.log('✅ Bootstrap completado');
    } catch (e) {
      console.error('❌ Error en bootstrap:', e);
    }
  }
  
  // Ejecutar init cuando el DOM esté cargado
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Capturar errores no manejados
  window.addEventListener('error', function(e) {
    if (document.body && document.body.innerHTML === '') {
      document.body.innerHTML = '<div style="padding: 20px; text-align: center;">'+
        '<h1 style="color: #e53e3e;">Error en la aplicación</h1>'+
        '<p>Ha ocurrido un error inesperado. Por favor, intente recargar la página.</p>'+
        '<button onclick="window.location.reload()" style="background: #3182ce; color: white; '+
        'padding: 8px 16px; border: none; border-radius: 4px; margin-top: 16px; cursor: pointer;">'+
        'Recargar página</button>'+
        '<button onclick="localStorage.clear(); window.location.reload()" style="background: #718096; color: white; '+
        'padding: 8px 16px; border: none; border-radius: 4px; margin-top: 16px; margin-left: 8px; cursor: pointer;">'+
        'Limpiar caché y recargar</button></div>';
    }
  });
})(); 