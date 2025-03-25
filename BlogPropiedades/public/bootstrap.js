/**
 * Bootstrap script para la inicialización segura de la aplicación
 * Este script se ejecuta antes del bundle principal y establece
 * valores por defecto para las variables de entorno críticas
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
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
        
        // Intentar usar un proxy CORS si está disponible
        // Lista de proxies CORS que podemos usar
        const CORS_PROXIES = [
          'https://corsproxy.io/?',
          'https://api.allorigins.win/raw?url=',
          'https://cors.sh/?'
        ];
        
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
            
            // Si todos los proxies fallan, intentar directamente con HTTPS
            console.log('🔄 Reintentando con protocolo HTTPS');
            const httpsUrl = url.replace('http:', 'https:');
            
            // Intentar reemplazar el dominio del backend si es necesario
            const apiDomain = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
            const httpsWithApi = httpsUrl.includes(apiDomain) 
              ? httpsUrl.replace(apiDomain, 'api.realestategozamadrid.com')
              : httpsUrl;
            
            return originalFetch(httpsWithApi, options);
          });
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
        
        // Convertir a HTTPS primero
        const httpsUrl = url.replace('http:', 'https:');
        
        // Intentar reemplazar el dominio del backend si es necesario
        const apiDomain = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
        if (httpsUrl.includes(apiDomain)) {
          const secureUrl = httpsUrl.replace(apiDomain, 'api.realestategozamadrid.com');
          return originalXHROpen.call(this, method, secureUrl, async, user, password);
        }
        
        return originalXHROpen.call(this, method, httpsUrl, async, user, password);
      }
      
      // Para otras URLs, usar el open original
      return originalXHROpen.call(this, method, url, async, user, password);
    };
    
    // Definir fallbacks para URLs de API
    window.API_FALLBACKS = {
      HTTP_URL: 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com',
      HTTPS_URL: 'https://api.realestategozamadrid.com',
      CORS_PROXIES: CORS_PROXIES
    };
    
    // Establecer variables de entorno correctas
    if (window.ENV_VARS) {
      window.ENV_VARS.VITE_BACKEND_URL = 'https://api.realestategozamadrid.com';
      window.ENV_VARS.VITE_API_URL = 'https://api.realestategozamadrid.com';
      window.ENV_VARS.VITE_API_PUBLIC_API_URL = 'https://api.realestategozamadrid.com';
      window.ENV_VARS.VITE_FALLBACK_API = 'https://api.realestategozamadrid.com';
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