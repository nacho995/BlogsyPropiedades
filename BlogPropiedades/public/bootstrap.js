/**
 * Bootstrap script para acceso directo a la API
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // Configurar variables de entorno
  if (window.ENV_VARS) {
    window.ENV_VARS.VITE_BACKEND_URL = API_URL;
    window.ENV_VARS.VITE_API_URL = API_URL;
    window.ENV_VARS.VITE_API_PUBLIC_API_URL = API_URL;
    window.ENV_VARS.VITE_FALLBACK_API = API_URL;
  }
  
  // Configurar el sistema de acceso a API
  function setupApiAccess() {
    console.log('🔧 Configurando sistema de acceso a API');
    
    // Definir la URL base de la API
    const API_DOMAIN = 'api.realestategozamadrid.com';
    const API_URL = `https://${API_DOMAIN}`;
    
    // Interceptar todas las solicitudes fetch
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      // Verificar si es una solicitud a la API
      if (url.includes(API_DOMAIN)) {
        console.log('🔄 Convirtiendo URL API a HTTPS:', url);
        
        // Asegurar que la URL use HTTPS
        if (url.startsWith('http://')) {
          url = url.replace('http://', 'https://');
        }
        
        console.log('🔄 Intentando acceso a API:', url);
        
        // Si es una solicitud de login, validar los datos
        if (url.includes('/user/login')) {
          try {
            const body = JSON.parse(options.body || '{}');
            console.log('📝 Datos de login:', {
              email: body.email,
              password: '***'
            });
            
            if (!body.email || !body.password) {
              throw new Error('Faltan credenciales');
            }
          } catch (error) {
            console.error('❌ Error procesando datos de login:', error);
            throw error;
          }
        }
      }
      
      // Realizar la solicitud original
      return originalFetch(url, options);
    };
    
    console.log('✅ Sistema de acceso a API configurado');
  }
  
  // Llamar a la función para configurar el sistema de acceso a API
  setupApiAccess();
  
  console.log('✅ Bootstrap completado - Acceso directo a API configurado');
})(); 