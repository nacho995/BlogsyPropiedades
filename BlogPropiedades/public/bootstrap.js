/**
 * Bootstrap script para acceso directo a la API
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // API URL siempre en HTTPS
  const API_DOMAIN = 'api.realestategozamadrid.com';
  const API_URL = `https://${API_DOMAIN}`;
  
  // Configurar variables de entorno
  if (window.ENV_VARS) {
    window.ENV_VARS.VITE_BACKEND_URL = API_URL;
    window.ENV_VARS.VITE_API_URL = API_URL;
    window.ENV_VARS.VITE_API_PUBLIC_API_URL = API_URL;
    window.ENV_VARS.VITE_FALLBACK_API = API_URL;
  }
  
  console.log('🔧 Configurando sistema de acceso a API');
  
  // IMPORTANTE: Reemplazar fetch para asegurar HTTPS
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    // Si es una URL de la API, asegurar HTTPS
    if (typeof url === 'string') {
      // Reemplazar cualquier URL de la API antigua
      if (url.includes('gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com')) {
        url = url.replace('http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com', API_URL);
        console.log('🔄 Reemplazando URL antigua de API:', url);
      }
      
      // Asegurar HTTPS para la API
      if (url.includes(API_DOMAIN)) {
        url = url.replace('http://', 'https://');
        console.log('🔄 Convirtiendo URL API a HTTPS:', url);
      }
      
      console.log('🔄 Intentando acceso a API:', url);
      
      // Si es una solicitud de login, asegurar el formato correcto
      if (url.includes('/user/login') && options.method === 'POST') {
        try {
          const body = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
          console.log('📝 Datos de login:', { email: body.email, password: '***' });
          
          // Asegurar que el body es un objeto válido
          if (!body || typeof body !== 'object') {
            throw new Error('Body inválido');
          }
          
          // Asegurar que email y password están presentes
          if (!body.email || !body.password) {
            throw new Error('Faltan credenciales');
          }
          
          // Actualizar el body con el formato correcto
          options.body = JSON.stringify({
            email: body.email,
            password: body.password
          });
        } catch (error) {
          console.error('❌ Error procesando datos de login:', error);
          throw error;
        }
      }
    }
    
    // Usar el fetch original con la URL modificada
    return originalFetch(url, {
      ...options,
      mode: 'cors',
      credentials: 'include',
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).catch(error => {
      console.error('❌ Error en la solicitud:', error);
      throw error;
    });
  };
  
  console.log('✅ Bootstrap completado - Acceso directo a API configurado');
})(); 