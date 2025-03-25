// src/services/api.js
/**
 * Servicios de API para la aplicación
 * 
 * Este archivo adapta automáticamente el protocolo (HTTP/HTTPS) de la API 
 * para que coincida con el protocolo de la página web, evitando problemas
 * de contenido mixto en navegadores modernos.
 */

// Importar utilidades
import { sanitizeUrl, combineUrls } from '../utils/urlSanitizer';

// Determinar si estamos usando HTTPS (solo para registro)
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

// FORZAR HTTP para la API, independientemente del protocolo del frontend
// Esto es necesario porque el backend de AWS Elastic Beanstalk no soporta HTTPS directamente
const API_DOMAIN = 'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com';
const API_URL = `http://${API_DOMAIN}`;
const BASE_URL = API_URL;
const FALLBACK_API = API_URL;
const API_BASE_URL = API_URL;

// Registrar la URL de la API usada
console.log(`🌐 Usando API en: ${API_URL} (HTTP forzado - El backend no soporta HTTPS)`);
console.log(`🔒 Frontend en: ${isHttps ? 'HTTPS' : 'HTTP'} - ${window.location.origin}`);

// Si estamos en HTTPS, advertir sobre posibles problemas de contenido mixto
if (isHttps) {
  console.warn('⚠️ ADVERTENCIA: Frontend en HTTPS intentando conectar con API en HTTP');
  console.warn('⚠️ Para evitar problemas, asegúrate de configurar Cloudflare correctamente');
  
  // Registrar este tipo de evento para detectar posibles problemas
  try {
    localStorage.setItem('mixedContentWarning', JSON.stringify({
      timestamp: new Date().toISOString(),
      frontend: window.location.origin,
      backend: API_URL
    }));
  } catch (e) {
    console.error("Error al guardar advertencia de contenido mixto:", e);
  }
}

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
        // Verificar si hay demasiadas solicitudes en poco tiempo (posible bucle)
        const now = Date.now();
        const recentRequests = JSON.parse(localStorage.getItem('recentApiRequests') || '[]');
        
        // Limpiar solicitudes antiguas (más de 5 segundos)
        const filteredRequests = recentRequests.filter(req => (now - req.timestamp) < 5000);
        
        // Si hay más de 15 solicitudes en 5 segundos, puede ser un bucle
        if (filteredRequests.length > 15) {
            console.error('⚠️ Posible bucle de solicitudes detectado, abortando para evitar saturación');
            localStorage.setItem('apiRequestLoop', 'true');
            throw new Error('Bucle de solicitudes detectado. Por favor, recarga la página.');
        }
        
        // Registrar esta solicitud
        filteredRequests.push({
            endpoint,
            timestamp: now,
            method: options.method || 'GET'
        });
        localStorage.setItem('recentApiRequests', JSON.stringify(filteredRequests));
        
        // En producción, siempre usamos el endpoint estándar
        if (endpoint === '/user/me' || endpoint === '/user/profile') {
            // Verificar que tengamos un token antes de hacer peticiones de perfil
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('⚠️ Intento de obtener perfil sin token');
                throw new Error('No hay token de autenticación');
            }
        }
        
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
        
        // Verificar si hay problemas conocidos con el protocolo
        const protocolMismatch = JSON.parse(localStorage.getItem('protocolMismatch') || 'null');
        const now24h = now - (24 * 60 * 60 * 1000); // 24 horas atrás
        if (protocolMismatch && protocolMismatch.timestamp && new Date(protocolMismatch.timestamp).getTime() > now24h) {
            console.warn('⚠️ Detectado problema de protocolo previo, manejando situación');
            
            // Si estamos en HTTPS y la API sólo soporta HTTP, usar proxy o dar una respuesta alternativa
            if (isHttps && endpoint === '/user/login') {
                console.log('🔀 Login con protocolo ajustado para prevenir contenido mixto');
            }
        }
        
        // Normalizar endpoint
        const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        
        // Combinar URL base con endpoint - Usar la URL con el protocolo correcto
        let url = combineUrls(BASE_URL, normalizedEndpoint);
        
        // Generar un ID único para esta solicitud para seguimiento en logs
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        
        console.log(`🚀 [${requestId}] Enviando solicitud a: ${url}`);
        console.log(`📋 [${requestId}] Método: ${options.method || 'GET'}, Intentos: ${retryCount + 1}/${API_RETRY_COUNT + 1}`);
        
        if (options.body) {
            try {
                // Si el cuerpo es FormData, mostrar solo las claves
                if (options.body instanceof FormData) {
                    const keys = Array.from(options.body.keys());
                    console.log(`📦 [${requestId}] FormData con claves: ${keys.join(', ')}`);
                } else {
                    const bodyPreview = JSON.stringify(
                        typeof options.body === 'string' ? JSON.parse(options.body) : options.body
                    ).substring(0, 150);
                    console.log(`📦 [${requestId}] Cuerpo: ${bodyPreview}${bodyPreview.length >= 150 ? '...' : ''}`);
                }
            } catch (e) {
                // Si no podemos parsear el cuerpo, mostrar tipo
                console.log(`📦 [${requestId}] Cuerpo: [${typeof options.body}]`);
            }
        }
        
        // Configuración por defecto para la solicitud
        const fetchOptions = {
            method: options.method || 'GET',
            headers: options.omitContentType ? { ...options.headers } : {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            },
            ...options,
            // Añadir credenciales para permitir cookies y evitar problemas CORS/CORB
            credentials: 'include',
            // Añadir opción para manejar errores de red
            mode: 'cors'
        };
        
        // Si hay un cuerpo y es un objeto, convertirlo a JSON solo si no es FormData
        if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
            fetchOptions.body = JSON.stringify(options.body);
        } else if (options.body instanceof FormData) {
            // Si es FormData, pasarlo directamente y asegurarse de no tener Content-Type
            fetchOptions.body = options.body;
            // Eliminar Content-Type para que el navegador lo establezca con el boundary correcto
            if (fetchOptions.headers && fetchOptions.headers['Content-Type']) {
                delete fetchOptions.headers['Content-Type'];
            }
        }
        
        try {
            // Registrar cronómetro para medir tiempo de respuesta
            const startTime = performance.now();
            
            // Realizar la solicitud a la API
            const response = await fetch(url, fetchOptions);
            
            // Calcular tiempo de respuesta
            const responseTime = Math.round(performance.now() - startTime);
            console.log(`⏱️ [${requestId}] Tiempo de respuesta: ${responseTime}ms`);
            
            // Guardar en caché si es una operación GET exitosa
            if (response.ok && (options.method === 'GET' || !options.method)) {
                try {
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();
                    
                    // Solo guardar en caché si no estamos en modo incógnito o si localStorage está disponible
                    if (typeof localStorage !== 'undefined') {
                        const cacheKey = `api_cache_${endpoint}`;
                        localStorage.setItem(cacheKey, JSON.stringify({
                            data,
                            timestamp: Date.now()
                        }));
                    }
                } catch (cacheError) {
                    console.warn(`⚠️ Error al guardar respuesta en caché: ${cacheError.message}`);
                }
            }
            
            // Si la respuesta no es exitosa, manejar el error
            if (!response.ok) {
                console.error(`🛑 [${requestId}] Error HTTP: ${response.status} ${response.statusText}`);
                
                // Si es un error de autenticación, limpiar credenciales
                if (response.status === 401) {
                    console.warn('🔑 Error de autenticación, limpiando credenciales');
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    // Redirigir a login solo si no estamos ya en login
                    if (!window.location.pathname.includes('/login')) {
                        window.location.href = '/login';
                    }
                    throw new Error('Sesión expirada o inválida');
                }
                
                // Si es un error de protocolo o mix-content, registrarlo
                if (response.status === 0 || (response.type && response.type === 'opaque')) {
                    localStorage.setItem('protocolMismatch', JSON.stringify({
                        timestamp: new Date().toISOString(),
                        url: url
                    }));
                    console.error('⛔ Posible problema de protocolo (mixed-content) detectado');
                }
                
                // Si es un error 404 en producción, intentar la URL alternativa
                if (response.status === 404 && retryCount === 0) {
                    console.log(`⚠️ [${requestId}] Recurso no encontrado, intentando URL alternativa`);
                    // En este caso, intentamos con la misma URL pero asegurándonos que use HTTP
                    return fetchAPI(endpoint, options, retryCount + 1);
                }
                
                // Para otros errores, intentar analizar la respuesta
                try {
                    const errorData = await response.json();
                    console.error(`🔍 [${requestId}] Detalle del error:`, errorData);
                    
                    // Lanzar error con mensaje del servidor si está disponible
                    throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
                } catch (jsonError) {
                    // Si no podemos analizar la respuesta, usar mensaje genérico
                    throw new Error(`Error ${response.status}: ${response.statusText}`);
                }
            }
            
            // Si la respuesta es exitosa, intentar analizarla como JSON
            try {
                const data = await response.json();
                return data;
            } catch (jsonError) {
                console.warn(`⚠️ [${requestId}] No se pudo analizar respuesta como JSON:`, jsonError);
                // Devolver respuesta en texto plano
                return await response.text();
            }
        } catch (error) {
            console.error(`❌ [${requestId}] Error en fetchAPI:`, error.message);
            
            // Si hay un error de red y tenemos reintentos disponibles
            if ((error.name === 'TypeError' || error.message.includes('Failed to fetch')) && retryCount < API_RETRY_COUNT) {
                const backoffTime = Math.pow(2, retryCount) * 1000; // Exponential backoff
                console.log(`🔄 [${requestId}] Reintentando en ${backoffTime}ms (intento ${retryCount + 1}/${API_RETRY_COUNT})`);
                
                return new Promise(resolve => {
                    setTimeout(() => {
                        resolve(fetchAPI(endpoint, options, retryCount + 1));
                    }, backoffTime);
                });
            }
            
            // Registrar detalles del error para diagnóstico
            try {
                if (typeof localStorage !== 'undefined') {
                    const apiErrors = JSON.parse(localStorage.getItem('apiErrors') || '[]');
                    apiErrors.push({
                        endpoint,
                        error: error.message,
                        timestamp: new Date().toISOString(),
                        url: url
                    });
                    
                    // Limitar a los últimos 10 errores
                    if (apiErrors.length > 10) {
                        apiErrors.shift();
                    }
                    
                    localStorage.setItem('apiErrors', JSON.stringify(apiErrors));
                }
            } catch (e) {
                console.error('Error al guardar registro de error:', e);
            }
            
            throw error;
        }
    } catch (outerError) {
        console.error(`🔥 Error general en fetchAPI:`, outerError);
        throw outerError;
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
        // Verificar si hay un bucle de API activo
        if (localStorage.getItem('apiRequestLoop') === 'true') {
            console.error('⚠️ Bucle de API detectado en loginUser, abortando');
            throw new Error('Bucle de solicitudes detectado. Por favor, recarga la página.');
        }
        
        // Verificar si hay demasiados intentos de login en poco tiempo
        const loginAttemptsKey = 'loginApiAttempts';
        const now = Date.now();
        const recentAttempts = JSON.parse(localStorage.getItem(loginAttemptsKey) || '[]');
        const veryRecentAttempts = recentAttempts.filter(
            time => (now - time) < 5000 // últimos 5 segundos
        );
        
        // Si hay más de 3 intentos en 5 segundos, abortar para evitar bucles
        if (veryRecentAttempts.length > 3) {
            console.error('🛑 Demasiados intentos de login en muy poco tiempo, posible bucle');
            localStorage.setItem('apiRequestLoop', 'true');
            
            // Crear respuesta de emergencia para romper el bucle
            const emergencyToken = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const emergencyUser = {
                email: userData.email,
                name: userData.email.split('@')[0] || "Usuario",
                role: 'user',
                _emergency: true,
                _bucleDetected: true
            };
            
            // Limpiar intentos
            localStorage.removeItem(loginAttemptsKey);
            
            // Devolver respuesta de emergencia
            return {
                token: emergencyToken,
                user: emergencyUser,
                _emergency: true
            };
        }
        
        // Registrar este intento
        veryRecentAttempts.push(now);
        localStorage.setItem(loginAttemptsKey, JSON.stringify(veryRecentAttempts));
        
        console.log('📝 Intentando login con email:', userData.email);
        
        // Implementar retry para el login
        let retries = 0;
        const maxRetries = 1; // Reducido a 1 para evitar bucles en producción
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
  try {
    // Usar el token del localStorage si no se proporciona uno
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    console.log("Actualizando perfil con token:", authToken);
    
    // Crear el objeto con los datos del usuario
    const updateData = {};
    
    // Añadir nombre si existe
    if (userData.name) {
      updateData.name = userData.name;
    }
    
    // Convertir formData a JSON si es necesario
    if (userData.profilePic) {
      // Si es un archivo, necesitamos usar FormData
      if (userData.profilePic instanceof File) {
        const formData = new FormData();
        
        // Añadir los campos del formulario
        if (userData.name) {
          formData.append('name', userData.name);
        }
        
        formData.append('profilePic', userData.profilePic);
        
        // Usar fetchAPI con la ruta correcta
        return await fetchAPI('/user/update-profile', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          },
          body: formData,
          // No establecer Content-Type para que el navegador lo haga automáticamente con el boundary
          omitContentType: true
        });
      } else {
        // Si es una URL o string, simplemente agregar al objeto JSON
        updateData.profilePic = userData.profilePic;
      }
    }
    
    // Si no hay archivo, usar JSON
    if (!userData.profilePic || !(userData.profilePic instanceof File)) {
      return await fetchAPI('/user/update-profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
    }
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
    console.log("Intentando subir archivo a:", `${API_URL}/property/upload`);
    
    let response;
    let usePropertyRoute = false;
    
    try {
      // Intentar con la ruta de subida específica
      response = await fetch(`${API_URL}/property/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta exitosa del servidor (property/upload):", data);
        
        // Asegurar que cualquier URL en la respuesta use el mismo protocolo que la página
        if (data.imageUrl && isHttps && data.imageUrl.startsWith('http:')) {
          data.imageUrl = data.imageUrl.replace('http://', 'https://');
        }
        
        return data;
      }
    } catch (err) {
      console.log("Error con property/upload, intentando con blog/upload:", err);
      usePropertyRoute = true;
    }
    
    // Si falla, intentar con la ruta de blog
    if (usePropertyRoute || !response || !response.ok) {
      console.log("Intentando con ruta alternativa:", `${API_URL}/blog/upload`);
      
      response = await fetch(`${API_URL}/blog/upload`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta exitosa del servidor (blog/upload):", data);
        
        // Asegurar que cualquier URL en la respuesta use el mismo protocolo que la página
        if (data.imageUrl && isHttps && data.imageUrl.startsWith('http:')) {
          data.imageUrl = data.imageUrl.replace('http://', 'https://');
        }
        
        return data;
      }
    }
    
    // Si ambas rutas fallan, intentar con la ruta principal
    if (!response || !response.ok) {
      console.log("Intentando con ruta principal:", `${API_URL}/property`);
      
      response = await fetch(`${API_URL}/property`, {
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
    
    // Asegurar que cualquier URL en la respuesta use el mismo protocolo que la página
    if (data.imageUrl && isHttps && data.imageUrl.startsWith('http:')) {
      data.imageUrl = data.imageUrl.replace('http://', 'https://');
    }
    
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
    
    // Verificar si hay demasiadas solicitudes de perfil en poco tiempo (posible bucle)
    const profileAttemptsKey = 'profileApiAttempts';
    const now = Date.now();
    const recentAttempts = JSON.parse(localStorage.getItem(profileAttemptsKey) || '[]');
    const veryRecentAttempts = recentAttempts.filter(
      time => (now - time) < 5000 // últimos 5 segundos
    );
    
    // Si hay más de 3 intentos en 5 segundos, crear respuesta local
    if (veryRecentAttempts.length > 3) {
      console.warn('⚠️ Demasiados intentos de obtener perfil, usando datos locales');
      
      // Crear perfil de emergencia con datos almacenados
      const email = localStorage.getItem('email');
      const name = localStorage.getItem('name') || (email ? email.split('@')[0] : 'Usuario');
      const role = localStorage.getItem('role') || 'user';
      const profilePic = localStorage.getItem('profilePic') || 
                        localStorage.getItem('profilePic_local') || 
                        localStorage.getItem('profilePic_base64');
      
      // Limpiar intentos
      localStorage.removeItem(profileAttemptsKey);
      
      return {
        email,
        name,
        role,
        profilePic,
        _emergency: true,
        _localData: true
      };
    }
    
    // Registrar este intento
    veryRecentAttempts.push(now);
    localStorage.setItem(profileAttemptsKey, JSON.stringify(veryRecentAttempts));
    
    // Intentar obtener el perfil del usuario - ÚNICO INTENTO
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
      // Si falla, no intentar con ruta alternativa para evitar bucles
      console.error("Error al obtener perfil:", error.message);
      
      // Usar datos locales como respaldo
      const email = localStorage.getItem('email');
      const name = localStorage.getItem('name') || (email ? email.split('@')[0] : 'Usuario');
      
      return {
        email,
        name,
        role: localStorage.getItem('role') || 'user',
        profilePic: localStorage.getItem('profilePic'),
        _recovered: true
      };
    }
  } catch (outerError) {
    console.error('Error en getUserProfile:', outerError);
    throw outerError;
  }
}

// Replace axios with native fetch API

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
    const response = await fetch(`${API_URL}${endpoint}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// POST request
export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
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
    const response = await fetch(`${API_URL}${endpoint}`, {
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
      let formData;
      
      // Verificar si newImage es un objeto File o un string base64/URL
      if (newImage instanceof File) {
        formData = new FormData();
        formData.append('profilePic', newImage);
      } else {
        // Si es un string (base64 o URL), enviar como JSON
        return await fetchAPI('/user/update-profile', {
          method: 'POST',
          body: JSON.stringify({ profilePic: newImage })
        });
      }

      const response = await fetchAPI('/user/update-profile', {
        method: 'POST',
        body: formData,
        omitContentType: true,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Respuesta al actualizar imagen:', response);
      
      // Procesar la URL para asegurar que use el mismo protocolo que la página
      let imageUrl = response.profilePic || response.profileImage || response.imageUrl;
      if (imageUrl && isHttps && imageUrl.startsWith('http:')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }
      
      return { imageUrl };
    } else {
      // Si no hay nueva imagen, obtener los datos actuales del usuario
      const response = await fetchAPI('/user/me');
      
      console.log('Respuesta al obtener datos de usuario:', response);
      
      // Procesar la URL para asegurar que use el mismo protocolo que la página
      let imageUrl = response.profilePic || response.profileImage || response.imageUrl;
      if (imageUrl && isHttps && imageUrl.startsWith('http:')) {
        imageUrl = imageUrl.replace('http://', 'https://');
      }
      
      return { imageUrl };
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
    console.log("Subiendo imagen de propiedad a:", `${API_URL}/property/upload-image`);
    console.log("FormData contenido:", Array.from(formData.entries()));
    
    const response = await fetch(`${API_URL}/property/upload-image`, {
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
    
    // Asegurar que la URL devuelta use el mismo protocolo que la página
    let processedUrl = imageUrl;
    if (isHttps && processedUrl.startsWith('http:')) {
      processedUrl = processedUrl.replace('http://', 'https://');
    }
    
    return {
      src: processedUrl,
      alt: 'Imagen de propiedad'
    };
    
  } catch (error) {
    console.error('Error al subir imagen de propiedad:', error);
    throw error;
  }
};