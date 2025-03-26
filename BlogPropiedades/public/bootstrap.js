/**
 * Bootstrap script para acceso directo a la API
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // Definir la URL base de la API (siempre HTTPS)
  const API_DOMAIN = 'api.realestategozamadrid.com';
  const API_URL = `https://${API_DOMAIN}`;
  
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
    
    // Interceptar todas las solicitudes fetch
    const originalFetch = window.fetch;
    window.fetch = async function(url, options = {}) {
      try {
        // Verificar si es una solicitud a la API
        if (typeof url === 'string' && url.includes(API_DOMAIN)) {
          console.log('🔄 Convirtiendo URL API a HTTPS:', url);
          
          // Asegurar que la URL use HTTPS
          if (url.startsWith('http://')) {
            url = url.replace('http://', 'https://');
          }
          
          console.log('🔄 Intentando acceso a API:', url);
          
          // Si es una solicitud de login, validar los datos
          if (url.includes('/user/login') && options.method === 'POST' && options.body) {
            try {
              const body = JSON.parse(options.body || '{}');
              
              // Mostrar información de debug pero ocultar la contraseña
              console.log('📝 Datos de login:', {
                email: body.email,
                password: body.password ? '***' : 'no proporcionada'
              });
              
              if (!body.email || !body.password) {
                console.error('❌ Error en los datos de login: Faltan credenciales');
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
      } catch (error) {
        console.error('❌ Error durante el procesamiento de fetch:', error);
        throw error;
      }
    };
    
    console.log('✅ Sistema de acceso a API configurado');
  }
  
  // Función principal
  function main() {
    try {
      // Llamar a la función para configurar el sistema de acceso a API
      setupApiAccess();
    } catch (error) {
      console.error('❌ Error al configurar sistema de acceso a API:', error);
      // Continuar con la ejecución
    }
    
    console.log('✅ Bootstrap completado - Acceso directo a API configurado');
  }

  // Ejecutar la función principal
  main();
})(); 