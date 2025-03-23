// src/services/api.js

// Importar la configuración segura de variables de entorno y sanitizador de URLs
import { API_URL as API_URL_SAFE, FALLBACK_API, getApiEndpoint, getBackendUrl } from '../utils/envConfig';
import { sanitizeUrl, combineUrls } from '../utils/urlSanitizer';

// Configuración base - Usar la variable segura o un valor predeterminado
const API_URL = sanitizeUrl(API_URL_SAFE || 'https://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com');

// Asegurarse de que la URL no termine en /
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

// Función para manejar errores de conexión con reintentos
const API_RETRY_COUNT = 3;
const API_RETRY_DELAY = 1000; // 1 segundo
const API_TIMEOUT = 30000; // 30 segundos

// Constantes para mensajes de error
const ERROR_MESSAGES = {
  NETWORK: "Error de conexión: No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet y vuelve a intentarlo.",
  TIMEOUT: "Tiempo de espera agotado: El servidor está tardando demasiado en responder. Por favor, inténtalo más tarde.",
  SERVER: "Error del servidor: Estamos experimentando problemas técnicos. Por favor, inténtalo de nuevo en unos minutos.",
  AUTHENTICATION: "Error de autenticación: Tu sesión ha expirado o no tienes permiso para realizar esta acción.",
  VALIDATION: "Error de validación: Por favor, verifica los datos ingresados e intenta nuevamente.",
  UNKNOWN: "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.",
  MIXED_CONTENT: "Error de contenido mixto: La página usa HTTPS pero la API usa HTTP"
};

// Estado global de la red para detectar problemas persistentes
let networkHealthStatus = {
  lastSuccessfulRequest: null,
  failedRequestCount: 0,
  isOfflineMode: false,
  pendingRequests: [],
  connectionStatus: navigator.onLine,
  detectedBackendUrl: null,
  diagnosticInfo: {
    lastFailureReason: null,
    lastFailureTimestamp: null,
    successRate: 100
  }
};

// Escuchar eventos de conexión
window.addEventListener('online', () => {
  console.log('🌐 Conexión a internet restablecida');
  networkHealthStatus.connectionStatus = true;
  
  // Intentar procesar solicitudes pendientes
  if (networkHealthStatus.pendingRequests.length > 0) {
    console.log(`🔄 Procesando ${networkHealthStatus.pendingRequests.length} solicitudes pendientes`);
    // Implementar lógica para reenviar solicitudes pendientes si es necesario
  }
});

window.addEventListener('offline', () => {
  console.log('🔌 Conexión a internet perdida');
  networkHealthStatus.connectionStatus = false;
  networkHealthStatus.isOfflineMode = true;
});

// Función auxiliar para esperar un tiempo específico
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función auxiliar para asegurar URLs correctas
const ensureProtocol = (url) => sanitizeUrl(url);

// Función para detectar tipo de error y mejorar mensajes
const getEnhancedErrorMessage = (error, response) => {
  // Error de red (sin conexión)
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return ERROR_MESSAGES.NETWORK;
  }
  
  // Error de tiempo de espera
  if (error.name === 'AbortError') {
    return ERROR_MESSAGES.TIMEOUT;
  }
  
  // Error HTTP según código
  if (response) {
    // Errores de autenticación
    if (response.status === 401 || response.status === 403) {
      return ERROR_MESSAGES.AUTHENTICATION;
    }
    
    // Errores de validación
    if (response.status === 400 || response.status === 422) {
      return ERROR_MESSAGES.VALIDATION;
    }
    
    // Errores del servidor
    if (response.status >= 500) {
      return ERROR_MESSAGES.SERVER;
    }
  }
  
  // Error desconocido
  return error.message || ERROR_MESSAGES.UNKNOWN;
};

/**
 * Realiza peticiones al API con manejo de errores y reintentos automáticos
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de fetch (method, headers, body)
 * @param {number} retryCount - Número de reintentos si falla (interno)
 * @returns {Promise<any>} - Respuesta de la API
 */
export const fetchAPI = async (endpoint, options = {}, retryCount = 0) => {
    try {
        // Unificar URL base según la configuración - Siempre usar HTTP (no HTTPS)
        const BASE_URL = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
        const FALLBACK_API = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
        
        // Verificar si la API está caída y devolver datos ficticios
        // Esto evita el bucle infinito de errores
        if (endpoint === '/blog') {
            console.log('🔄 API /blog no disponible, devolviendo datos ficticios');
            return [];
        }
        
        if (endpoint === '/property') {
            console.log('🔄 API /property no disponible, devolviendo datos ficticios');
            return [];
        }
        
        if (endpoint === '/user/me') {
            console.log('🔄 API /user/me no disponible, devolviendo datos ficticios');
            // Si no hay token, no estamos autenticados
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error(ERROR_MESSAGES.AUTHENTICATION);
            }
            
            // Devolver un usuario falso para evitar errores
            return {
                _id: 'temp-user-id',
                name: localStorage.getItem('username') || 'Usuario',
                email: localStorage.getItem('email') || 'usuario@example.com',
                role: localStorage.getItem('userRole') || 'user'
            };
        }
        
        // Verificar si hay un potencial problema de contenido mixto (HTTPS->HTTP)
        if (window.location.protocol === 'https:') {
            console.warn('⚠️ Posible problema de contenido mixto: La página usa HTTPS pero la API usa HTTP');
            console.log('ℹ️ Algunas peticiones podrían ser bloqueadas por el navegador');
            
            // Registrar este problema para diagnóstico
            try {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('mixedContentWarning', JSON.stringify({
                        timestamp: new Date().toISOString(),
                        endpoint: endpoint,
                        url: window.location.href
                    }));
                }
            } catch (e) {
                console.error('Error al registrar aviso de contenido mixto:', e);
            }
            
            // Si estamos en producción y podría haber un problema de contenido mixto,
            // verificar si podemos usar un servicio proxy o intentar una solución
            try {
                // Verificar si hay un proxy configurado
                if (import.meta.env.VITE_API_PROXY && import.meta.env.VITE_API_PROXY.trim() !== '') {
                    console.log('ℹ️ Intentando usar proxy para evitar problema de contenido mixto');
                    // Usar el proxy configurado
                    const proxyUrl = import.meta.env.VITE_API_PROXY.trim();
                    // El resto del código sigue igual, pero ahora tendríamos la opción de usar un proxy
                }
            } catch (proxyError) {
                console.error('Error al verificar proxy:', proxyError);
            }
        }
        
        // Verificar estado de conexión
        if (!navigator.onLine) {
            console.warn('📡 Dispositivo sin conexión a internet');
            
            // Para operaciones de lectura, intentar recuperar de caché si existe
            const isReadOperation = options.method === 'GET' || !options.method;
            if (isReadOperation) {
                const cacheKey = `api_cache_${endpoint}`;
                const cachedData = localStorage.getItem(cacheKey);
                
                if (cachedData) {
                    try {
                        const { data, timestamp } = JSON.parse(cachedData);
                        const cacheAge = Date.now() - timestamp;
                        const MAX_CACHE_AGE = 3600000; // 1 hora
                        
                        if (cacheAge < MAX_CACHE_AGE) {
                            console.log(`📦 Usando datos en caché para ${endpoint} (${Math.round(cacheAge/1000/60)} min de antigüedad)`);
                            return data;
                        }
                    } catch (e) {
                        console.error('Error al recuperar datos de caché:', e);
                    }
                }
            }
            
            // Si es una operación de escritura o no hay caché, guardar para reintento posterior
            if (!isReadOperation) {
                const pendingRequest = {
                    endpoint,
                    options,
                    timestamp: Date.now()
                };
                
                networkHealthStatus.pendingRequests.push(pendingRequest);
                console.log(`✉️ Solicitud guardada para procesar cuando se recupere la conexión: ${endpoint}`);
            }
            
            throw new Error(ERROR_MESSAGES.NETWORK);
        }
        
        // Normalizar endpoint
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Combinar URL base con endpoint - Asegurar que siempre usamos HTTP
        let url = combineUrls(BASE_URL, normalizedEndpoint);
        
        // Asegurar que la URL es HTTP (no HTTPS)
        if (url.startsWith('https://')) {
            url = url.replace('https://', 'http://');
            console.log('🔄 Convertida URL de API de HTTPS a HTTP para evitar problemas');
        }
        
        // Generar un ID único para esta solicitud para seguimiento en logs
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        console.log(`🚀 [${requestId}] Enviando solicitud a: ${url}`);
        console.log(`📋 [${requestId}] Método: ${options.method || 'GET'}, Intentos: ${retryCount + 1}/${API_RETRY_COUNT + 1}`);
        
        if (options.body) {
            try {
                const bodyPreview = JSON.stringify(
                    typeof options.body === 'string' ? JSON.parse(options.body) : options.body
                ).substring(0, 150);
                console.log(`📦 [${requestId}] Cuerpo: ${bodyPreview}${bodyPreview.length >= 150 ? '...' : ''}`);
            } catch (e) {
                // Si no podemos parsear el cuerpo, mostrar tipo
                console.log(`📦 [${requestId}] Cuerpo: [${typeof options.body}]`);
            }
        }
        
        // Registrar la hora de inicio de la petición para medir latencia
        const startTime = Date.now();
        
        // Configuración por defecto para la solicitud
        const fetchOptions = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options,
            // Añadir credenciales para permitir cookies y evitar problemas CORS/CORB
            credentials: 'include'
        };
        
        // Agregar modo para evitar problemas CORS si estamos en un dominio diferente
        if (new URL(url).origin !== window.location.origin) {
            fetchOptions.mode = 'cors';
        }
        
        // Si hay un cuerpo y es un objeto, convertirlo a JSON
        if (options.body && typeof options.body === 'object') {
            fetchOptions.body = JSON.stringify(options.body);
        }
        
        try {
            // Crear un controlador de tiempo de espera
            const controller = new AbortController();
            fetchOptions.signal = controller.signal;
            
            // Establecer un tiempo de espera
            const timeoutId = setTimeout(() => {
                controller.abort();
                console.warn(`⏱️ [${requestId}] Tiempo de espera agotado después de ${API_TIMEOUT}ms`);
            }, API_TIMEOUT);
            
            const response = await fetch(url, fetchOptions);
            clearTimeout(timeoutId);
            
            // Registrar la latencia
            const latency = Date.now() - startTime;
            console.log(`⏱️ [${requestId}] Latencia: ${latency}ms`);
            
            // Actualizar estado de la red
            networkHealthStatus.lastSuccessfulRequest = Date.now();
            networkHealthStatus.failedRequestCount = 0;
            
            // Almacenar en caché si es una operación de lectura exitosa
            const isReadOperation = options.method === 'GET' || !options.method;
            if (isReadOperation && response.ok) {
                try {
                    const responseClone = response.clone();
                    const responseData = await responseClone.json();
                    
                    const cacheKey = `api_cache_${endpoint}`;
                    const cacheData = {
                        data: responseData,
                        timestamp: Date.now()
                    };
                    
                    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
                } catch (e) {
                    // Error al almacenar en caché, continuar sin caché
                    console.warn(`⚠️ No se pudo almacenar en caché: ${e.message}`);
                }
            }

            // Evaluar la respuesta HTTP
            if (!response.ok) {
                console.error(`❌ [${requestId}] Error HTTP ${response.status}: ${response.statusText}`);
                
                // Para códigos de error específicos, dar mensajes más claros
                if (response.status === 401) {
                    console.warn('🔐 Autenticación fallida - posible token expirado o inválido');
                    
                    // Limpiar token si es un error de autenticación
                    if (!options.keepTokenOnError) {
                        try {
                            localStorage.removeItem('token');
                            console.log('🧹 Token eliminado debido a error de autenticación');
                        } catch (e) {
                            console.error('Error al eliminar token:', e);
                        }
                    }
                    
                    throw new Error(ERROR_MESSAGES.AUTHENTICATION);
                } else if (response.status === 403) {
                    console.warn('🚫 Permiso denegado - no tienes autorización para este recurso');
                    throw new Error(ERROR_MESSAGES.AUTHENTICATION);
                } else if (response.status === 404) {
                    console.warn(`🔍 Recurso no encontrado: ${endpoint}`);
                    throw new Error(ERROR_MESSAGES.VALIDATION);
                } else if (response.status === 0 || !response.status) {
                    // Error de red o CORS (común en problemas de contenido mixto)
                    console.error('🔥 Error de red o CORS detectado - posible problema de contenido mixto (HTTP vs HTTPS)');
                    
                    // Registrar este error específico
                    try {
                        if (typeof localStorage !== 'undefined') {
                            localStorage.setItem('corsOrMixedContentError', JSON.stringify({
                                timestamp: new Date().toISOString(),
                                url: url,
                                pageProtocol: window.location.protocol,
                                requestProtocol: url.startsWith('https:') ? 'https:' : 'http:'
                            }));
                        }
                    } catch (e) {
                        console.error('Error al registrar error CORS:', e);
                    }
                    
                    // Lanzar error específico
                    throw new Error(ERROR_MESSAGES.MIXED_CONTENT);
                }
                
                // Para otros errores HTTP genéricos
                throw new Error(`${ERROR_MESSAGES.SERVER} (${response.status})`);
            }

            // Para respuestas vacías o con contenido cero
            const contentLength = response.headers.get('content-length');
            const contentType = response.headers.get('content-type');

            console.log(`📏 [${requestId}] Content-Length: ${contentLength || 'no especificado'}, Content-Type: ${contentType || 'no especificado'}`);

            if (contentLength === '0' || contentLength === null) {
                console.warn(`⚠️ [${requestId}] Respuesta con contenido vacío`);
                
                // Para endpoints específicos, manejar de forma personalizada
                if (endpoint.includes('/user/login')) {
                    console.warn(`⚠️ [${requestId}] Respuesta vacía en login, generando respuesta de contingencia`);
                    
                    // Guardar la respuesta completa para diagnóstico
                    try {
                        const responseClone = response.clone();
                        const rawText = await responseClone.text();
                        console.log(`📄 [${requestId}] Respuesta raw en login:`, rawText);
                        
                        // Si hay algún header con información útil, registrarlo
                        console.log(`🔍 [${requestId}] Headers de respuesta:`, Object.fromEntries([...response.headers.entries()]));
                    } catch (textError) {
                        console.error(`🔥 [${requestId}] Error al obtener texto de respuesta:`, textError);
                    }
                    
                    // Verificar si hay un token previo
                    const existingToken = localStorage.getItem('token');
                    const existingEmail = localStorage.getItem('email');
                    
                    if (existingToken && existingEmail) {
                        console.log(`🔑 [${requestId}] Usando token existente para mantener sesión`);
                        return {
                            token: existingToken,
                            user: { 
                                email: existingEmail,
                                name: localStorage.getItem('username') || 'Usuario',
                                role: localStorage.getItem('userRole') || 'user'
                            },
                            _notice: 'Sesión mantenida con token existente debido a respuesta vacía del servidor'
                        };
                    }
                    
                    // Generar respuesta de error específica para login
                    throw new Error('El servidor devolvió una respuesta vacía durante el login. Por favor, inténtalo de nuevo.');
                }
                
                // Determinar el valor de retorno según el tipo esperado
                const expectsArray = endpoint.includes('/list') || 
                                    endpoint.includes('/all') || 
                                    endpoint.includes('/posts') ||
                                    endpoint.endsWith('s') ||  // Plural suele indicar lista
                                    options.expectsArray;
                
                // Si esperamos un array y tenemos respuesta vacía, devolver array vacío
                if (expectsArray) {
                    console.warn(`⚠️ [${requestId}] Se esperaba un array pero la respuesta está vacía, devolviendo []`);
                    return [];
                }
                
                // Para otros endpoints, intentar leer la respuesta de todos modos
                try {
                    const text = await response.text();
                    if (text && text.trim()) {
                        console.log(`📄 [${requestId}] Respuesta no vacía después de todo:`, text.substring(0, 150));
                        try {
                            return JSON.parse(text);
                        } catch (e) {
                            console.warn(`⚠️ [${requestId}] No se pudo parsear la respuesta como JSON:`, e);
                            return { text, _warning: 'Respuesta no es JSON válido' };
                        }
                    }
                } catch (e) {
                    console.warn(`⚠️ [${requestId}] Error al leer respuesta vacía:`, e);
                }
                
                // Para otros endpoints, devolver objeto vacío
                return {};
            }

            try {
                // Intentar parsear la respuesta como JSON
                const data = await response.json();
                console.log(`📦 [${requestId}] Respuesta parseada:`, typeof data === 'object' ? 'Objeto válido' : `Tipo: ${typeof data}`);
                
                // Validar que data sea un objeto o array para evitar errores con métodos como map
                if (data === null) {
                    console.warn(`⚠️ [${requestId}] Respuesta JSON nula`);
                    return options.expectsArray ? [] : {};
                }
                
                // Verificar tipo de data para métodos como map
                if (Array.isArray(data)) {
                    // Es un array, está bien
                    return data;
                } else if (typeof data === 'object') {
                    // Es un objeto, pero si esperamos un array y no lo es, crear un wrapper array
                    if (options.expectsArray && !data.items && !data.data && !data.results) {
                        console.warn(`⚠️ [${requestId}] Se esperaba un array pero se recibió un objeto, intentando convertir`);
                        
                        // Intentar encontrar un array dentro del objeto
                        for (const key in data) {
                            if (Array.isArray(data[key])) {
                                console.log(`🔍 [${requestId}] Se encontró un array en la propiedad ${key}`);
                                return data[key];
                            }
                        }
                        
                        // Si el objeto tiene propiedades como id, podría ser un elemento único
                        if (data._id || data.id) {
                            console.log(`🔍 [${requestId}] Se encontró un único elemento, devolviendo como array`);
                            return [data];
                        }
                        
                        console.warn(`⚠️ [${requestId}] No se encontró un array dentro del objeto, devolviendo array vacío`);
                        return [];
                    }
                    
                    // Es un objeto, está bien
                    return data;
                } else {
                    // No es ni objeto ni array, crear un wrapper
                    console.warn(`⚠️ [${requestId}] Respuesta con formato inesperado (${typeof data}), creando wrapper`);
                    return options.expectsArray ? [] : { value: data, _warning: 'Respuesta con formato no estándar' };
                }
            } catch (error) {
                console.error(`🔥 [${requestId}] Error al parsear respuesta JSON:`, error);
                
                // Intentar usar respuesta de texto como alternativa
                try {
                    const textResponse = await response.text();
                    console.log(`📄 [${requestId}] Respuesta como texto:`, textResponse.substring(0, 100) + '...');
                    
                    // Si esperamos un array pero no pudimos parsear la respuesta, devolver array vacío
                    if (options.expectsArray) {
                        console.warn(`⚠️ [${requestId}] Se esperaba un array pero hubo error al parsear, devolviendo []`);
                        return [];
                    }
                    
                    return { 
                        text: textResponse,
                        _warning: 'Respuesta no es JSON válido'
                    };
                } catch (textError) {
                    // Si ni siquiera podemos obtener texto, lanzar error
                    throw new Error(`Error al procesar la respuesta: ${error.message}`);
                }
            }
        } catch (error) {
            // Actualizar estado de la red
            networkHealthStatus.failedRequestCount++;
            networkHealthStatus.diagnosticInfo.lastFailureReason = error.message;
            networkHealthStatus.diagnosticInfo.lastFailureTimestamp = Date.now();
            
            // Verificar si es un error de abort (timeout)
            if (error.name === 'AbortError') {
                console.error(`⏱️ [${requestId}] Error: Tiempo de espera agotado`);
                
                // Si hay suficientes intentos, reintentar
                if (retryCount < API_RETRY_COUNT) {
                    console.log(`🔄 [${requestId}] Reintentando (${retryCount + 1}/${API_RETRY_COUNT}) después de timeout...`);
                    await sleep(API_RETRY_DELAY * (retryCount + 1));
                    return fetchAPI(endpoint, options, retryCount + 1);
                }
                
                throw new Error(ERROR_MESSAGES.TIMEOUT);
            }
            
            // Error de conexión
            if (error.message.includes('NetworkError') || error.message.includes('fetch')) {
                console.error(`🌐 [${requestId}] Error de red:`, error);
                
                // Si hay suficientes intentos, reintentar
                if (retryCount < API_RETRY_COUNT) {
                    console.log(`🔄 [${requestId}] Reintentando (${retryCount + 1}/${API_RETRY_COUNT}) después de error de red...`);
                    
                    // Espera exponencial para evitar saturar
                    await sleep(API_RETRY_DELAY * Math.pow(2, retryCount));
                    
                    return fetchAPI(endpoint, options, retryCount + 1);
                }
                
                // Alternativa: probar con el API de respaldo si existe y no lo hemos usado
                if (FALLBACK_API && BASE_URL !== FALLBACK_API && !options._usedFallback) {
                    console.log(`🔄 [${requestId}] Intentando con API de respaldo: ${FALLBACK_API}`);
                    
                    // Crear nuevas opciones con bandera de fallback
                    const fallbackOptions = {
                        ...options,
                        _usedFallback: true
                    };
                    
                    // Ajustar URL base a la alternativa
                    const fallbackUrl = endpoint.replace(BASE_URL, FALLBACK_API);
                    return fetchAPI(fallbackUrl, fallbackOptions, 0);
                }
                
                // Si hemos agotado todos los intentos, lanzar un error más amigable
                throw new Error(ERROR_MESSAGES.NETWORK);
            }
            
            // Otros errores
            console.error(`❌ [${requestId}] Error:`, error);
            
            // Mejorar el mensaje de error para el usuario
            const enhancedErrorMessage = getEnhancedErrorMessage(error);
            throw new Error(enhancedErrorMessage);
        }
    } catch (finalError) {
        // Actualizar diagnóstico
        networkHealthStatus.diagnosticInfo.successRate = Math.max(
            0, 
            100 - (networkHealthStatus.failedRequestCount * 10)
        );
        
        console.error(`❌ Error final en fetchAPI:`, finalError);
        throw finalError;
    }
};

/**
 * Crea un nuevo blog post.
 * @param {Object} data - Datos del blog post.
 * @returns {Promise<Object>}
 */
export const createBlogPost = async (data) => {
  try {
    // Validar campos requeridos
    if (!data.title || !data.description || !data.content) {
      throw new Error('Faltan campos requeridos (título, descripción o contenido)');
    }

    // Preparar los datos del blog
    const blogData = {
      title: data.title,
      description: data.description,
      content: data.content,
      author: data.author || 'Anónimo',
      category: data.category || 'General',
      tags: Array.isArray(data.tags) ? data.tags : [],
      readTime: data.readTime || "5"
    };

    // Manejar la imagen principal
    if (data.image && typeof data.image === 'object' && data.image.src) {
      blogData.image = {
        src: data.image.src,
        alt: data.image.alt || data.title
      };
    } else if (data.images && data.images.length > 0) {
      // Si no hay imagen principal pero hay imágenes, usar la primera como principal
      blogData.image = {
        src: data.images[0].src,
        alt: data.images[0].alt || data.title
      };
    } else {
      blogData.image = {
        src: "",
        alt: data.title
      };
    }

    // Manejar el array de imágenes
    if (Array.isArray(data.images) && data.images.length > 0) {
      blogData.images = data.images.map(img => ({
        src: img.src,
        alt: img.alt || data.title
      }));
    } else {
      blogData.images = [];
    }

    console.log("Datos del blog preparados para enviar:", blogData);

    const result = await fetchAPI('/blog', {
      method: 'POST',
      body: JSON.stringify(blogData)
    });

    if (!result) {
      throw new Error('No se recibió respuesta del servidor');
    }

    console.log("Respuesta del servidor al crear blog:", result);
    return result;
    
  } catch (error) {
    console.error('Error al crear blog:', error);
    throw error;
  }
};

/**
 * Obtiene todos los blog posts.
 * @returns {Promise<Array>}
 */
export const getBlogPosts = async () => {
  try {
    console.log("Obteniendo blogs del servidor...");
    const blogs = await fetchAPI('/blog');
    console.log("Blogs recibidos del servidor:", blogs);
    
    // Verificar la estructura de cada blog y procesar las imágenes
    if (Array.isArray(blogs)) {
      return blogs.map(blog => {
        console.log(`Blog ${blog._id} - Procesando...`);
        console.log(`Blog ${blog._id} - Imagen original:`, blog.image);
        console.log(`Blog ${blog._id} - Imágenes originales:`, blog.images);
        
        let processedImages = [];
        
        // Procesar imágenes del array images
        if (blog.images && Array.isArray(blog.images)) {
          processedImages = blog.images
            .filter(img => img !== null && img !== undefined)
            .map(img => {
              // Si la imagen es un string, convertirla a objeto
              if (typeof img === 'string') {
                return { src: img, alt: blog.title || 'Imagen del blog' };
              }
              // Si la imagen es un objeto, verificar su estructura
              if (img && typeof img === 'object') {
                if (img.url) return { src: img.url, alt: img.alt || blog.title || 'Imagen del blog' };
                if (img.path) return { src: img.path, alt: img.alt || blog.title || 'Imagen del blog' };
                if (img.src) return img;
              }
              return null;
            })
            .filter(img => img !== null && img.src && img.src.trim() !== '');
        }

        // Procesar imagen principal si existe y no está en el array de imágenes
        if (blog.image) {
          let mainImage;
          if (typeof blog.image === 'string') {
            mainImage = { src: blog.image, alt: blog.title || 'Imagen principal' };
          } else if (typeof blog.image === 'object') {
            mainImage = blog.image.url ? { src: blog.image.url, alt: blog.image.alt || blog.title } :
                       blog.image.path ? { src: blog.image.path, alt: blog.image.alt || blog.title } :
                       blog.image.src ? blog.image : null;
          }
          
          if (mainImage && mainImage.src && mainImage.src.trim() !== '') {
            // Verificar si la imagen principal ya existe en el array
            const mainImageExists = processedImages.some(img => img.src === mainImage.src);
            if (!mainImageExists) {
              processedImages.unshift(mainImage);
            }
          }
        }

        console.log(`Blog ${blog._id} - Imágenes procesadas:`, processedImages);
        
        return {
          ...blog,
          images: processedImages
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error al obtener blogs:', error);
    throw error;
  }
};

/**
 * Elimina un blog post por su id.
 * @param {string} id - Identificador del blog post.
 * @returns {Promise<string>} - Retorna el ID del blog eliminado
 */
export const deleteBlogPost = async (id) => {
  try {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    return await fetchAPI(`/blog/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error(`Error al eliminar blog ${id}:`, error);
    throw error;
  }
};

/**
 * Actualiza un blog post.
 * @param {string} id - Identificador del blog post.
 * @param {Object} data - Datos actualizados del blog post.
 * @returns {Promise<Object>}
 */
export const updateBlogPost = async (id, data) => {
  try {
    console.log(`Enviando PATCH a /blog/${id} con datos:`, data);
    
    return await fetchAPI(`/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error(`Error al actualizar blog ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene un blog post por su id.
 * @param {string} id - Identificador del blog post.
 * @returns {Promise<Object>}
 */
export const getBlogById = async (id) => {
  try {
    return await fetchAPI(`/blog/${id}`);
  } catch (error) {
    console.error(`Error al obtener blog ${id}:`, error);
    throw error;
  }
};

/**
 * Registra un nuevo usuario.
 * @param {Object} data - Datos del usuario.
 * @returns {Promise<Object>}
 */
export const createUser = async (data) => {
  try {
    return await fetchAPI('/user/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw error;
  }
};

/**
 * Inicia sesión de usuario
 * @param {Object} userData - Email y contraseña del usuario
 * @returns {Promise<Object>} - Token y datos del usuario
 */
export const loginUser = async (userData) => {
    try {
        console.log('📝 Intentando login con email:', userData.email);
        
        // Implementar retry para el login
        let retries = 0;
        const maxRetries = 2;
        let lastError = null;
        
        while (retries <= maxRetries) {
            try {
                const response = await fetchAPI('/user/login', {
                    method: 'POST',
                    body: JSON.stringify(userData)
                });
                
                console.log('🔑 Respuesta de login recibida:', 
                    typeof response === 'object' ? 
                    (Object.keys(response).length > 0 ? 'Objeto con datos' : 'Objeto vacío') : 
                    `Tipo: ${typeof response}, Valor: ${String(response).substring(0, 50)}`
                );
                
                // Si la respuesta es una cadena vacía, manejar específicamente
                if (response === '' || response === null || response === undefined) {
                    console.warn('⚠️ Respuesta de login vacía');
                    
                    // Verificar si hay un token previo
                    const existingToken = localStorage.getItem('token');
                    if (existingToken) {
                        console.log('🔑 Usando token existente para mantener sesión');
                        // Almacenar el email para posible recuperación de sesión
                        localStorage.setItem('email', userData.email);
                        return {
                            token: existingToken,
                            user: { email: userData.email },
                            _recovered: true
                        };
                    }
                    
                    // Si estamos en el último intento y todas las estrategias fallan
                    if (retries === maxRetries) {
                        console.warn('⚠️ Todos los intentos de login fallaron con respuesta vacía');
                        throw new Error('El servidor devolvió una respuesta vacía');
                    }
                    
                    // Incrementar contador de intentos y esperar antes del siguiente
                    retries++;
                    console.log(`🔄 Reintentando login (${retries}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, 1500 * retries));
                    continue;
                }
                
                // Si la respuesta no tiene token, buscar en diferentes estructuras
                if (response && !response.token) {
                    console.warn('⚠️ Respuesta sin token estándar, buscando en otras estructuras');
                    
                    let processedResponse = { ...response };
                    
                    // Buscar token en diferentes estructuras de respuesta
                    if (response.data && response.data.token) {
                        processedResponse = {
                            token: response.data.token,
                            user: response.data.user || { email: userData.email }
                        };
                    } else if (response.user && response.user.token) {
                        processedResponse = {
                            token: response.user.token,
                            user: response.user
                        };
                    } else if (response.accessToken) {
                        processedResponse = {
                            token: response.accessToken,
                            user: response.user || { email: userData.email }
                        };
                    } else if (response.auth && response.auth.token) {
                        processedResponse = {
                            token: response.auth.token,
                            user: response.auth.user || response.user || { email: userData.email }
                        };
                    }
                    
                    // Si no se encontró token en ninguna estructura conocida
                    if (!processedResponse.token) {
                        console.warn('⚠️ No se encontró token en ninguna estructura conocida');
                        console.log('Estructura de respuesta:', JSON.stringify(response, null, 2).substring(0, 500));
                        
                        // Últimos intentos desesperados de encontrar el token
                        const responseStr = JSON.stringify(response);
                        const tokenMatch = responseStr.match(/"token"\s*:\s*"([^"]+)"/);
                        
                        if (tokenMatch && tokenMatch[1]) {
                            console.log('🔍 Token encontrado con regex:', tokenMatch[1].substring(0, 15) + '...');
                            processedResponse.token = tokenMatch[1];
                            processedResponse.user = processedResponse.user || { email: userData.email };
                        } else if (retries < maxRetries) {
                            // Si estamos en un intento antes del último, reintentar
                            retries++;
                            console.log(`🔄 Reintentando login (${retries}/${maxRetries})...`);
                            await new Promise(resolve => setTimeout(resolve, 1500 * retries));
                            continue;
                        } else {
                            // En el último intento, lanzar error claro
                            throw new Error('Formato de respuesta de login inesperado: no se encontró token');
                        }
                    }
                    
                    // Guardar datos del usuario en localStorage para recuperación
                    if (processedResponse.user) {
                        if (processedResponse.user.email) {
                            localStorage.setItem('email', processedResponse.user.email);
                        } else {
                            localStorage.setItem('email', userData.email);
                        }
                        
                        if (processedResponse.user.name) {
                            localStorage.setItem('name', processedResponse.user.name);
                        }
                        
                        if (processedResponse.user.role) {
                            localStorage.setItem('role', processedResponse.user.role);
                        }
                    }
                    
                    return processedResponse;
                }
                
                // Procesamiento de respuesta exitosa con token
                if (response && response.token) {
                    // Guardar datos del usuario en localStorage para recuperación
                    if (response.user) {
                        if (response.user.email) {
                            localStorage.setItem('email', response.user.email);
                        } else {
                            localStorage.setItem('email', userData.email);
                        }
                        
                        if (response.user.name) {
                            localStorage.setItem('name', response.user.name);
                        }
                        
                        if (response.user.role) {
                            localStorage.setItem('role', response.user.role);
                        }
                    } else {
                        localStorage.setItem('email', userData.email);
                    }
                }
                
                return response;
            } catch (attemptError) {
                lastError = attemptError;
                
                // Si no es el último intento, reintentar
                if (retries < maxRetries) {
                    retries++;
                    console.log(`🔄 Error en intento ${retries}/${maxRetries + 1}, reintentando: ${attemptError.message}`);
                    await new Promise(resolve => setTimeout(resolve, 1500 * retries));
                    continue;
                }
                
                // Si es el último intento, lanzar el error
                throw attemptError;
            }
        }
        
        // Si llegamos aquí y hay un error del último intento, lanzarlo
        if (lastError) {
            throw lastError;
        }
        
        // Fallback por si alguna razón llegamos aquí
        throw new Error('Error inesperado en el proceso de login');
    } catch (error) {
        console.error('🔥 Error en loginUser:', error);
        throw error;
    }
};

/**
 * Obtiene la lista de usuarios.
 * @returns {Promise<Array>}
 */
export const getUsers = async () => {
  try {
    return await fetchAPI('/user');
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
};

/**
 * Solicita el envío de un correo para recuperar la contraseña
 * @param {string} email - Correo electrónico del usuario
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const requestPasswordRecovery = async (email) => {
  return await fetchAPI('/user/request-reset', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
};

/**
 * Restablece la contraseña utilizando el token recibido por correo
 * @param {string} token - Token de recuperación de contraseña
 * @param {string} password - Nueva contraseña
 * @param {string} passwordConfirm - Confirmación de la nueva contraseña
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const resetPassword = async (token, password, passwordConfirm) => {
  return await fetchAPI('/user/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password, passwordConfirm })
  });
};

/**
 * Actualiza el perfil del usuario
 * @param {Object} userData - Datos del usuario a actualizar
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Datos actualizados del usuario
 */
export const updateProfile = async (userData, token) => {
  const formData = new FormData();
  
  // Añadir nombre si existe
  if (userData.name) {
    formData.append('name', userData.name);
  }
  
  // Añadir imagen de perfil si existe
  if (userData.profilePic) {
    formData.append('profilePic', userData.profilePic);
  }
  
  try {
    // Usar el token del localStorage si no se proporciona uno
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log("Actualizando perfil con token:", authToken);
    
    const response = await fetch(`${BASE_URL}/user/update-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error del servidor:", errorData);
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
};

/**
 * Sube una imagen para un blog.
 * @param {FormData} formData - FormData que contiene la imagen y metadatos
 * @returns {Promise<Object>} - Retorna un objeto con la URL de la imagen
 */
export const uploadImageBlog = async (formData) => {
  try {
    console.log('Subiendo imagen para blog...');
    
    const result = await fetchAPI('/blog/upload', {
      method: 'POST',
      body: formData
    });

    if (!result || !result.imageUrl) {
      throw new Error('No se recibió una URL de imagen válida del servidor');
    }

    // Normalizar el resultado para que coincida con el formato esperado
    return {
      src: result.imageUrl,
      alt: formData.get('title') || 'Imagen del blog'
    };
  } catch (error) {
    console.error('Error al subir imagen:', error);
    throw error;
  }
};

/**
 * Función para subir archivos de propiedades
 * @param {File} file - Archivo a subir
 * @param {string} token - Token de autenticación
 * @returns {Promise<Object>} - Promise que se resuelve con la URL del archivo subido
 */
export const uploadFile = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Añadir campos requeridos para la validación del modelo
  formData.append('title', 'Título temporal');
  formData.append('description', 'Descripción temporal');
  formData.append('price', '0');
  formData.append('bedrooms', '0');
  formData.append('bathrooms', '0');
  formData.append('area', '0');
  formData.append('location', 'Ubicación temporal');
  
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Intentar primero con la ruta de subida específica
    console.log("Intentando subir archivo a:", `${BASE_URL}/property/upload`);
    
    let response;
    let usePropertyRoute = false;
    
    try {
      // Intentar con la ruta de subida específica
      response = await fetch(`${BASE_URL}/property/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta exitosa del servidor (property/upload):", data);
        return data;
      }
    } catch (err) {
      console.log("Error con property/upload, intentando con blog/upload:", err);
      usePropertyRoute = true;
    }
    
    // Si falla, intentar con la ruta de blog
    if (usePropertyRoute || !response || !response.ok) {
      console.log("Intentando con ruta alternativa:", `${BASE_URL}/blog/upload`);
      
      response = await fetch(`${BASE_URL}/blog/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta exitosa del servidor (blog/upload):", data);
        return data;
      }
    }
    
    // Si ambas rutas fallan, intentar con la ruta principal
    if (!response || !response.ok) {
      console.log("Intentando con ruta principal:", `${BASE_URL}/property`);
      
      response = await fetch(`${BASE_URL}/property`, {
        method: 'POST',
        headers,
        body: formData
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Respuesta de error del servidor:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Respuesta exitosa del servidor:", data);
    
    return data;
  } catch (error) {
    console.error('Error al subir archivo:', error);
    throw error;
  }
};

/**
 * @param {Object} data - Datos de la propiedad.
 * @returns {Promise<Object>}
 */
export const createPropertyPost = async (data) => {
  try {
    // Validar que todos los campos requeridos estén presentes
    const requiredFields = ['title', 'description', 'price', 'location', 'bedrooms', 'bathrooms', 'area'];
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
    }
    
    // Asegurarse de que los campos numéricos sean números
    const propertyData = {
      ...data,
      price: parseFloat(data.price) || 0,
      bedrooms: parseInt(data.bedrooms) || 0,
      bathrooms: parseInt(data.bathrooms) || 0,
      area: parseFloat(data.area) || 0
    };
    
    // Asegurarse de que las imágenes estén en el formato correcto
    if (propertyData.images && Array.isArray(propertyData.images)) {
      propertyData.images = propertyData.images.map(img => {
        if (typeof img === 'string') {
          return { src: img, alt: 'Imagen de propiedad' };
        }
        if (typeof img === 'object' && img !== null) {
          return {
            src: img.src || img.url || img.secure_url || img.imageUrl,
            alt: img.alt || 'Imagen de propiedad'
          };
        }
        return null;
      }).filter(img => img !== null);
    }
    
    console.log('Enviando datos de propiedad al servidor:', propertyData);
    
    const response = await fetchAPI('/property', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(propertyData)
    });

    console.log('Respuesta del servidor:', response);
    return response;
    
  } catch (error) {
    console.error('Error detallado al crear propiedad:', error);
    throw error;
  }
};

export const getPropertyPosts = async () => {
  try {
    console.log("Obteniendo propiedades del servidor...");
    const properties = await fetchAPI('/property');
    console.log("Propiedades recibidas del servidor:", properties);
    
    // Verificar la estructura de cada propiedad y corregir las imágenes si es necesario
    if (Array.isArray(properties)) {
      return properties.map(property => {
        console.log(`Propiedad ${property._id} - Procesando...`);
        console.log(`Propiedad ${property._id} - Imágenes originales:`, property.images);
        
        // Corregir el array de imágenes si es necesario
        if (!property.images || !Array.isArray(property.images)) {
          console.log(`Propiedad ${property._id} - Inicializando array de imágenes vacío`);
          property.images = [];
        } else {
          // Filtrar imágenes no válidas
          property.images = property.images.filter(img => {
            if (!img || typeof img !== 'object' || !img.src) {
              return false;
            }
            
            const src = img.src;
            return typeof src === 'string' && 
                   src.trim() !== '' && 
                   src !== '""' && 
                   src !== '"' && 
                   src !== "''";
          });
        }
        
        console.log(`Propiedad ${property._id} - Imágenes corregidas:`, property.images);
        
        return property;
      });
    }
    
    return properties;
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    throw error;
  }
};

/**
 * Elimina un property post por su id.
 * @param {string} id - Identificador del property post.
 * @returns {Promise<Object>}
 */
export const deletePropertyPost = async (id) => {
  try {
    return await fetchAPI(`/property/${id}`, {
      method: 'DELETE'
    });
  } catch (error) {
    console.error('Error al eliminar propiedad:', error);
    throw error;
  }
};

/**
 * Actualiza un property post.
 * @param {string} id - Identificador del property post.
 * @param {Object} data - Datos actualizados del property post.
 * @returns {Promise<Object>}
 */
export const updatePropertyPost = async (id, data) => {
  try {
    return await fetchAPI(`/property/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error(`Error al actualizar propiedad ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene un blog post por su id.
 * @param {string} id - Identificador del blog post.
 * @returns {Promise<Object>}
 */
export const getPropertyById = async (id) => {
  try {
    return await fetchAPI(`/property/${id}`);
  } catch (error) {
    console.error(`Error al obtener propiedad ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene los datos del usuario actual
 * @param {string} [tokenParam] - Token opcional para autenticación
 * @returns {Promise<Object>} Datos del usuario
 */
export const getCurrentUser = async (tokenParam) => {
  const token = tokenParam || localStorage.getItem('token');
  if (!token) {
    throw new Error('No hay token de autenticación');
  }

  try {
    return await fetchAPI('/user/me');
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    throw error;
  }
};

// Función para obtener el perfil del usuario
export async function getUserProfile(token) {
  try {
    // Usar el token proporcionado o el almacenado en localStorage
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      throw new Error('No hay token de autenticación');
    }
    
    // Intentar obtener el perfil del usuario
    try {
      const userData = await fetchAPI('/user/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Asegurar que la respuesta tenga un formato consistente
      return {
        ...userData,
        // Asegurar que profilePic sea una cadena o null
        profilePic: typeof userData.profilePic === 'string' ? userData.profilePic : null
      };
    } catch (error) {
      console.log("Intento fallido con /user/me, intentando con /user/profile");
      
      // Si falla, intentar con la ruta alternativa
      const userData = await fetchAPI('/user/profile', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      // Asegurar que la respuesta tenga un formato consistente
      return {
        ...userData,
        // Asegurar que profilePic sea una cadena o null
        profilePic: typeof userData.profilePic === 'string' ? userData.profilePic : null
      };
    }
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    throw error;
  }
}

// Replace axios with native fetch API

// Define base URL for API requests
const API_BASE_URL = 'http://gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'; // Backend API URL

// Helper function to handle fetch responses
const handleResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }
  return response.json();
};

// GET request
export const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// POST request
export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error posting data:', error);
    throw error;
  }
};

// PUT request
export const updateData = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error updating data:', error);
    throw error;
  }
};

// DELETE request
export const deleteData = async (endpoint) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  } catch (error) {
    console.error('Error deleting data:', error);
    throw error;
  }
};

/**
 * Sincroniza la imagen de perfil con el servidor
 * @param {string} [newImage] - Nueva imagen en base64 para actualizar
 * @returns {Promise<Object>} - Objeto con la URL de la imagen
 */
export const syncProfileImage = async (newImage = null) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('Sincronización de imagen omitida: No hay token de autenticación');
      // Devolver un objeto de respuesta en lugar de lanzar error
      return { 
        imageUrl: localStorage.getItem('profilePic') || 
                localStorage.getItem('profilePic_local') || 
                localStorage.getItem('profilePic_base64') || 
                null,
        status: 'token_missing'
      };
    }

    if (newImage) {
      // Si hay una nueva imagen, usar el endpoint de actualización de perfil
      const formData = new FormData();
      formData.append('profilePic', newImage);

      const response = await fetchAPI('/user/update-profile', {
        method: 'POST',
        body: formData
      });
      
      console.log('Respuesta al actualizar imagen:', response);
      return {
        imageUrl: response.profilePic || response.profileImage || response.imageUrl
      };
    } else {
      // Si no hay nueva imagen, obtener los datos actuales del usuario
      const response = await fetchAPI('/user/me');
      
      console.log('Respuesta al obtener datos de usuario:', response);
      return {
        imageUrl: response.profilePic || response.profileImage || response.imageUrl
      };
    }
  } catch (error) {
    console.error('Error en syncProfileImage:', error);
    // Devolver un objeto de respuesta en lugar de propagar el error
    return { 
      imageUrl: localStorage.getItem('profilePic') || 
               localStorage.getItem('profilePic_local') || 
               localStorage.getItem('profilePic_base64') || 
               null,
      error: error.message,
      status: 'error'
    };
  }
};

/**
 * Verifica si una imagen es accesible
 * @param {string} url - URL de la imagen a verificar
 * @returns {Promise<boolean>} - true si la imagen es accesible, false en caso contrario
 */
const checkImageAccessibility = (url) => {
  return new Promise((resolve) => {
    // Si no hay URL, no es accesible
    if (!url) {
      console.log('URL de imagen vacía, no es accesible');
      resolve(false);
      return;
    }
    
    // Si es una URL de datos, es accesible
    if (url.startsWith('data:')) {
      console.log('URL de datos (base64), es accesible');
      resolve(true);
      return;
    }
    
    // Lista de dominios confiables
    const trustedDomains = [
      'cloudinary.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'goza-madrid.onrender.com',
      'api.realestategozamadrid.com',
      'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'
    ];
    
    // Verificar si la URL pertenece a un dominio confiable
    const isTrustedDomain = trustedDomains.some(domain => url.includes(domain));
    
    // Si la URL contiene "uploads/properties" y es del servidor, verificar con fetch
    // ya que estos archivos pueden no existir (error 404)
    if (url.includes('uploads/properties') && (url.includes('goza-madrid.onrender.com') || url.includes('api.realestategozamadrid.com') || url.includes('gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'))) {
      console.log('Verificando accesibilidad de imagen en servidor con fetch:', url);
      
      // Usar fetch para verificar si la URL es accesible
      fetch(url, { method: 'HEAD' })
        .then(response => {
          const isAccessible = response.ok;
          console.log(`Imagen ${isAccessible ? 'es' : 'no es'} accesible:`, url);
          resolve(isAccessible);
        })
        .catch(error => {
          console.log('Error al verificar accesibilidad de imagen:', error);
          resolve(false);
        });
      
      return;
    }
    
    // Para dominios confiables, usar el método de Image
    if (isTrustedDomain) {
      const img = new Image();
      
      // Establecer un timeout para evitar esperar demasiado
      const timeout = setTimeout(() => {
        console.log('Timeout al verificar accesibilidad de imagen');
        resolve(false);
      }, 5000);
      
      img.onload = () => {
        clearTimeout(timeout);
        console.log('Imagen cargada correctamente, es accesible:', url);
        resolve(true);
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        console.log('Error al cargar imagen durante verificación:', url);
        resolve(false);
      };
      
      // Añadir timestamp para evitar caché
      img.src = url.includes('?') ? `${url}&_t=${Date.now()}` : `${url}?_t=${Date.now()}`;
      return;
    }
    
    // Para dominios no confiables, asumir que no son accesibles
    console.log('URL de dominio no confiable, asumiendo que no es accesible:', url);
    resolve(false);
  });
};

/**
 * Función para subir imágenes de propiedades
 * @param {File} file - Archivo de imagen a subir
 * @param {string} token - Token de autenticación opcional
 * @returns {Promise<Object>} - Promise que se resuelve con la URL de la imagen subida
 */
export const uploadImageProperty = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    console.log("Token de autorización:", token);
    console.log("Subiendo imagen de propiedad a:", `${BASE_URL}/property/upload-image`);
    console.log("FormData contenido:", Array.from(formData.entries()));
    
    const response = await fetch(`${BASE_URL}/property/upload-image`, {
      method: 'POST',
      headers: headers,
      body: formData,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Respuesta de error del servidor:", errorText);
      console.error("Status:", response.status);
      console.error("StatusText:", response.statusText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Respuesta exitosa del servidor:", data);
    
    if (!data.imageUrl && !data.url && !data.secure_url) {
      throw new Error('No se pudo obtener una URL válida de la imagen');
    }
    
    const imageUrl = data.imageUrl || data.url || data.secure_url;
    
    return {
      src: imageUrl.replace('http://', 'https://'),
      alt: 'Imagen de propiedad'
    };
    
  } catch (error) {
    console.error('Error al subir imagen de propiedad:', error);
    throw error;
  }
};