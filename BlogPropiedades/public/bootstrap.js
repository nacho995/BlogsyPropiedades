/**
 * Bootstrap script para la inicialización segura de la aplicación
 * Este script se ejecuta antes del bundle principal y establece
 * valores por defecto para las variables de entorno críticas
 */
(function() {
  console.log('🔄 Inicializando bootstrap...');
  
  // Verificar si estamos en HTTPS
  const isHttps = window.location.protocol === 'https:';
  
  // API URL correcta - SIEMPRE usar la URL de ElasticBeanstalk directamente
  const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
  const API_URL = `http://${API_DOMAIN}`;
  
  // Configuración de proxies para contenido mixto (HTTP desde HTTPS)
  const PROXY_CONFIG = {
    // Lista de servicios proxy confiables (con prioridad)
    SERVICES: [
      // AllOrigins - muy confiable y estable
      {
        name: 'allorigins',
        url: 'https://api.allorigins.win/raw?url=',
        encode: true,
        enabled: true
      },
      // CORS.SH - otro servicio confiable
      {
        name: 'corssh',
        url: 'https://cors.sh/?',
        encode: true,
        enabled: true
      },
      // CORS.IO - servicio alternativo
      {
        name: 'corsproxy',
        url: 'https://corsproxy.io/?',
        encode: true,
        enabled: true
      },
      // JSONP NINJA - para contenido específico
      {
        name: 'jsonp',
        url: 'https://jsonp.afeld.me/?url=',
        encode: true,
        enabled: true,
        onlyFor: ['GET']
      }
    ],
    // Política de reintentos
    MAX_RETRIES: 2,
    // Tiempo de espera entre reintentos (ms)
    RETRY_DELAY: 500,
    // Cache de respuestas
    CACHE_ENABLED: true,
    CACHE_TTL: 60000 // 1 minuto en ms
  };
  
  // Función para manejar conexiones HTTP desde HTTPS con proxies
  if (isHttps) {
    console.log('🔒 Detectado HTTPS - Configurando proxy para acceso a API HTTP');
    
    // Crear un objeto para almacenar las respuestas en caché
    const responseCache = new Map();
    
    // Función para obtener el mejor proxy disponible
    const getBestProxy = (method = 'GET') => {
      // Filtrar los proxies habilitados y compatibles con el método
      return PROXY_CONFIG.SERVICES.filter(proxy => 
        proxy.enabled && 
        (!proxy.onlyFor || proxy.onlyFor.includes(method))
      )[0] || null;
    };
    
    // Función para limpiar la caché antigua
    const cleanCache = () => {
      const now = Date.now();
      responseCache.forEach((value, key) => {
        if (now - value.timestamp > PROXY_CONFIG.CACHE_TTL) {
          responseCache.delete(key);
        }
      });
    };
    
    // Limpiar caché periódicamente
    setInterval(cleanCache, PROXY_CONFIG.CACHE_TTL);
    
    // Obtener representación de un método HTTP para el caché
    const getMethodKey = (method) => method || 'GET';

    // Generar una clave de caché para una solicitud
    const getCacheKey = (url, method, body) => {
      return `${method}:${url}:${body ? JSON.stringify(body) : ''}`;
    };
    
    // Guardar en caché una respuesta
    const cacheResponse = (url, method, body, responseData) => {
      if (!PROXY_CONFIG.CACHE_ENABLED) return;
      const key = getCacheKey(url, getMethodKey(method), body);
      responseCache.set(key, {
        data: responseData,
        timestamp: Date.now()
      });
    };
    
    // Obtener una respuesta de la caché
    const getCachedResponse = (url, method, body) => {
      if (!PROXY_CONFIG.CACHE_ENABLED) return null;
      
      const key = getCacheKey(url, getMethodKey(method), body);
      const cached = responseCache.get(key);
      
      if (cached && (Date.now() - cached.timestamp < PROXY_CONFIG.CACHE_TTL)) {
        return cached.data;
      }
      
      return null;
    };
    
    // Crear función para gestionar solicitudes HTTP a través de proxy
    const fetchViaProxy = async (url, options = {}, retryCount = 0) => {
      const method = options.method || 'GET';
      const proxy = getBestProxy(method);
      
      if (!proxy) {
        console.error('❌ No hay proxies disponibles para el método:', method);
        throw new Error(`No hay proxies CORS disponibles para ${method}`);
      }
      
      // Generar la URL para el proxy
      const proxyUrl = proxy.encode 
        ? `${proxy.url}${encodeURIComponent(url)}`
        : `${proxy.url}${url}`;
      
      console.log(`🌐 Usando proxy ${proxy.name} para: ${url}`);
      
      try {
        // Crear opciones para la solicitud al proxy
        const proxyOptions = { ...options };
        
        // Eliminar credenciales para evitar problemas con el proxy
        delete proxyOptions.credentials;
        
        // Realizar la solicitud al proxy
        const response = await fetch(proxyUrl, proxyOptions);
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
        }
        
        // Crear una respuesta que podemos devolver
        const responseData = {
          ok: response.ok,
          status: response.status,
          headers: response.headers,
          json: async () => {
            try {
              const jsonData = await response.json();
              // Guardar en caché
              cacheResponse(url, method, options.body, {
                ok: response.ok,
                status: response.status,
                jsonData
              });
              return jsonData;
            } catch (e) {
              console.error('Error al procesar JSON:', e);
              return {};
            }
          },
          text: async () => {
            try {
              return await response.text();
            } catch (e) {
              console.error('Error al procesar texto:', e);
              return '';
            }
          }
        };
        
        return responseData;
      } catch (error) {
        console.error(`❌ Error con proxy ${proxy.name}:`, error);
        
        // Intentar con otro proxy si hay más reintentos disponibles
        if (retryCount < PROXY_CONFIG.MAX_RETRIES) {
          // Desactivar temporalmente el proxy que falló
          proxy.enabled = false;
          
          // Reactivar después de un tiempo
          setTimeout(() => {
            proxy.enabled = true;
          }, 5000);
          
          console.log(`🔄 Reintentando con otro proxy (${retryCount + 1}/${PROXY_CONFIG.MAX_RETRIES})...`);
          
          // Esperar antes de reintentar
          await new Promise(resolve => setTimeout(resolve, PROXY_CONFIG.RETRY_DELAY));
          
          // Reintentar con otro proxy
          return fetchViaProxy(url, options, retryCount + 1);
        }
        
        // Si agotamos todos los reintentos, propagar el error
        throw new Error(`Todos los proxies fallaron: ${error.message}`);
      }
    };
    
    // Sobrescribir fetch para interceptar solicitudes HTTP desde HTTPS
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options = {}) {
      // Corregir cualquier URL que intente usar el dominio api.realestategozamadrid.com
      if (typeof url === 'string' && url.includes('api.realestategozamadrid.com')) {
        const correctedUrl = url.replace(/https?:\/\/api\.realestategozamadrid\.com/g, API_URL);
        console.log(`🔧 Corrigiendo URL de API incorrecta: ${url} -> ${correctedUrl}`);
        url = correctedUrl;
      }
      
      // Solo interceptar URLs que comienzan con http:// (no https://)
      if (typeof url === 'string' && url.toLowerCase().startsWith('http:')) {
        console.log(`🔄 Interceptando solicitud HTTP desde HTTPS: ${url}`);
        
        // Para solicitudes de login (u otras importantes), comprobar primero la caché
        const method = options.method || 'GET';
        const cachedResponse = getCachedResponse(url, method, options.body);
        
        if (cachedResponse) {
          console.log(`📦 Usando respuesta en caché para: ${url}`);
          return Promise.resolve({
            ok: cachedResponse.ok,
            status: cachedResponse.status,
            json: () => Promise.resolve(cachedResponse.jsonData),
            text: () => Promise.resolve(JSON.stringify(cachedResponse.jsonData)),
            headers: new Headers({
              'Content-Type': 'application/json',
              'X-Cache': 'HIT'
            })
          });
        }
        
        // Si no hay caché, usar el proxy
        return fetchViaProxy(url, options);
      }
      
      // Para otras URLs (HTTPS), usar el fetch original
      return originalFetch(url, options);
    };
    
    // Establecer variables de entorno correctas
    window.API_FALLBACKS = {
      HTTP_URL: API_URL,
      HTTPS_URL: null,
      LOGIN_URL: `${API_URL}/user/login`,
      REGISTER_URL: `${API_URL}/user/register`,
      PROFILE_URL: `${API_URL}/user/me`
    };
    
    // Establecer variables de entorno
    if (window.ENV_VARS) {
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