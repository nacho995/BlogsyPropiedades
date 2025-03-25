/**
 * Bootstrap script para la inicialización segura de la aplicación
 * Este script se ejecuta antes del bundle principal y establece
 * valores por defecto para las variables de entorno críticas
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // API URL correcta - siempre usar HTTP ya que la API no soporta HTTPS
  const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
  const API_URL = `http://${API_DOMAIN}`;
  
  // Lista de proxies CORS que podemos usar
  const CORS_PROXIES = [
    'https://corsproxy.io/?',
    'https://api.allorigins.win/raw?url=',
    'https://cors.sh/?'
  ];
  
  if (isHttps) {
    // Si estamos en HTTPS, necesitamos manejar las solicitudes a HTTP adecuadamente
    console.log('🔒 Detectado HTTPS - Configurando protección de contenido mixto');
    
    // Crear un proxy local para solicitudes HTTP desde HTTPS
    const originalFetch = window.fetch;
    
    // Sobrescribir fetch para interceptar solicitudes HTTP desde HTTPS
    window.fetch = function(url, options = {}) {
      // Solo interceptar URLs que comienzan con http:// (no https://)
      if (typeof url === 'string' && url.toLowerCase().startsWith('http:')) {
        console.log(`🔄 Interceptada solicitud HTTP: ${url}`);
        
        // Elegir un proxy aleatorio para distribuir la carga
        const proxyUrl = CORS_PROXIES[Math.floor(Math.random() * CORS_PROXIES.length)];
        const proxiedUrl = proxyUrl + encodeURIComponent(url);
        
        console.log(`🔄 Redirigiendo a través de proxy CORS: ${proxiedUrl}`);
        
        // Modificar opciones para solicitudes con proxy
        const newOptions = { ...options };
        
        // No incluir credenciales con el proxy CORS (causaría errores)
        if (newOptions.credentials === 'include') {
          delete newOptions.credentials;
        }
        
        // Realizar la solicitud a través del proxy
        return originalFetch(proxiedUrl, newOptions)
          .catch(error => {
            console.error(`❌ Error con proxy ${proxyUrl}:`, error);
            
            // Si falla, intentar con otro proxy
            const alternativeProxy = CORS_PROXIES.find(p => p !== proxyUrl);
            if (alternativeProxy) {
              console.log(`🔄 Reintentando con proxy alternativo: ${alternativeProxy}`);
              const altProxiedUrl = alternativeProxy + encodeURIComponent(url);
              return originalFetch(altProxiedUrl, newOptions);
            }
            
            // Si todos los proxies fallan, intentar directamente (aunque probablemente falle por contenido mixto)
            console.log('⚠️ Todos los proxies fallaron, intentando solicitud directa (puede fallar)');
            return originalFetch(url, options);
          });
      }
      
      // Interceptar también las URLs que han sido convertidas a HTTPS pero deberían ser HTTP
      if (typeof url === 'string' && 
          (url.includes('https://api.realestategozamadrid.com') || 
           url.includes('https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'))) {
        
        // Convertir a la URL HTTP correcta
        const correctedUrl = url
          .replace('https://api.realestategozamadrid.com', API_URL)
          .replace('https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com', API_URL);
        
        console.log(`🔄 Corrigiendo URL HTTPS incorrecta: ${url} -> ${correctedUrl}`);
        
        // Usar el proxy con la URL corregida
        const proxyUrl = CORS_PROXIES[Math.floor(Math.random() * CORS_PROXIES.length)];
        const proxiedUrl = proxyUrl + encodeURIComponent(correctedUrl);
        
        // Modificar opciones para solicitudes con proxy
        const newOptions = { ...options };
        if (newOptions.credentials === 'include') {
          delete newOptions.credentials;
        }
        
        console.log(`🔄 Redirigiendo a través de proxy CORS: ${proxiedUrl}`);
        return originalFetch(proxiedUrl, newOptions);
      }
      
      // Para otras URLs, usar el fetch original
      return originalFetch(url, options);
    };
    
    // También interceptar XMLHttpRequest para casos donde se use en lugar de fetch
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      // Solo interceptar URLs que comienzan con http:// (no https://)
      if (typeof url === 'string' && url.toLowerCase().startsWith('http:')) {
        console.log(`🔄 XMLHttpRequest interceptado: ${url}`);
        
        // Usar proxy CORS - no podemos hacerlo directamente con XHR
        // En su lugar, convertimos la URL para que pase por nuestro manejador fetch
        const proxyUrl = CORS_PROXIES[0] + encodeURIComponent(url);
        console.log(`⚠️ XHR con URL HTTP: ${url} - redirigiendo a ${proxyUrl}`);
        
        return originalXHROpen.call(this, method, proxyUrl, async, user, password);
      }
      
      // Interceptar también las URLs que han sido convertidas a HTTPS pero deberían ser HTTP
      if (typeof url === 'string' && 
          (url.includes('https://api.realestategozamadrid.com') || 
           url.includes('https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'))) {
        
        // Convertir a la URL HTTP correcta
        const correctedUrl = url
          .replace('https://api.realestategozamadrid.com', API_URL)
          .replace('https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com', API_URL);
        
        console.log(`🔄 XHR - Corrigiendo URL HTTPS incorrecta: ${url} -> ${correctedUrl}`);
        
        // Usar el proxy con la URL corregida
        const proxyUrl = CORS_PROXIES[0] + encodeURIComponent(correctedUrl);
        console.log(`🔄 XHR - Redirigiendo a través de proxy CORS: ${proxyUrl}`);
        
        return originalXHROpen.call(this, method, proxyUrl, async, user, password);
      }
      
      // Para otras URLs, usar el open original
      return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    // Definir fallbacks para URLs de API
    window.API_FALLBACKS = {
      HTTP_URL: API_URL,
      HTTPS_URL: null, // La API no tiene HTTPS
      CORS_PROXIES: CORS_PROXIES
    };
    
    // Establecer variables de entorno correctas - SIEMPRE HTTP
    if (window.ENV_VARS) {
      // Usar siempre HTTP ya que la API no soporta HTTPS
      window.ENV_VARS.VITE_BACKEND_URL = API_URL;
      window.ENV_VARS.VITE_API_URL = API_URL;
      window.ENV_VARS.VITE_API_PUBLIC_API_URL = API_URL;
      window.ENV_VARS.VITE_FALLBACK_API = API_URL;
    }
  }
  
  // Limpiar localStorage para evitar problemas persistentes
  try {
    // Eliminar solo datos relacionados con errores para no afectar sesión
    localStorage.removeItem('mixedContentWarning');
    localStorage.removeItem('apiRequestLoop');
    localStorage.removeItem('api_errors');
    localStorage.removeItem('app_errors');
    localStorage.removeItem('loginApiAttempts');
    localStorage.removeItem('profileApiAttempts');
  } catch (e) {
    console.error('Error al limpiar localStorage:', e);
  }
  
  console.log('✅ Bootstrap completado');
})(); 