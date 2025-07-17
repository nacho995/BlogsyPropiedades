// src/services/api.js
/**
 * Servicios de API para la aplicación
 * 
 * Este archivo se conecta directamente al backend HTTPS
 */

// Definimos las funciones que antes estaban en utils y utils/imageUtils
const combineUrls = (baseUrl, relativeUrl) => {
  if (!baseUrl) return relativeUrl;
  if (!relativeUrl) return baseUrl;
  
  // Eliminar / al final de baseUrl si existe
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  // Eliminar / al inicio de relativeUrl si existe
  const relative = relativeUrl.startsWith('/') ? relativeUrl : '/' + relativeUrl;
  
  return base + relative;
};

const detectAndPreventLoopError = (actionName, timeWindow = 5000, maxAttempts = 3) => {
  try {
    // Obtener o crear el registro de acciones
    const actionsKey = `actionLog_${actionName}`;
    const storedActions = JSON.parse(localStorage.getItem(actionsKey) || '[]');
    
    // Añadir la acción actual
    const now = new Date().getTime();
    storedActions.unshift(now);
    
    // Mantener solo las últimas 10 acciones para no ocupar mucho espacio
    if (storedActions.length > 10) {
      storedActions.length = 10;
    }
    
    // Guardar el registro actualizado
    localStorage.setItem(actionsKey, JSON.stringify(storedActions));
    
    // Verificar si hay demasiadas acciones en la ventana de tiempo
    const recentActions = storedActions.filter(timestamp => 
      (now - timestamp) < timeWindow
    );
    
    // Si hay demasiadas acciones recientes, es posible que estemos en un bucle
    if (recentActions.length >= maxAttempts) {
      console.warn(`⚠️ Posible bucle detectado en "${actionName}": ${recentActions.length} acciones en ${timeWindow}ms`);
      
      // Registrar la detección del bucle
      localStorage.setItem(`${actionName}_bucleDetectado`, 'true');
      
      return true; // Hay un bucle
    }
    
    return false; // No hay bucle
  } catch (error) {
    console.error('Error al detectar bucle:', error);
    return false; // En caso de error, asumimos que no hay bucle
  }
};

const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace(/^http:\/\//i, 'https://');
};

// URL base de la API
// Detectar entorno de desarrollo y cambiar la URL base si es necesario
const isLocalDevelopment = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// SOLUCIÓN DEFINITIVA: Usar el dominio correcto para cada entorno
// En desarrollo, usamos una ruta relativa para que el proxy de Vite funcione.
// En producción, usamos la URL absoluta del backend.
export const BASE_URL = isLocalDevelopment
  ? '' // En desarrollo, usamos rutas relativas para que el proxy de Vite funcione
  : 'https://nextjs-gozamadrid-qrfk.onrender.com'; // En producción, esta es la URL de nuestro backend

// Determinar si estamos usando HTTPS
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

// Usar la API directamente sin proxies
const API_BASE_URL = isLocalDevelopment ? '' : `${BASE_URL}/api`;

// Registrar la URL de la API usada con mensaje más claro sobre el entorno
console.log(
  `🌐 Usando API en: ${BASE_URL}${isLocalDevelopment ? ' - MODO DESARROLLO LOCAL' : ' - MODO PRODUCCIÓN'}`
);
console.log(`🔒 Frontend en: ${isHttps ? 'HTTPS' : 'HTTP'} - ${window.location.origin}`);

// Desactivar explícitamente cualquier proxy CORS
window.useCorsProxy = false;

// Función auxiliar para esperar un tiempo específico
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función auxiliar para detectar y prevenir bucles de error
const requestTimestamps = {};
const MAX_REQUESTS_PER_INTERVAL = 10; // Aumentado de 3 a 10
const INTERVAL_MS = 2000; // Intervalo de 2 segundos

/**
 * Función genérica para realizar peticiones a la API
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones para la petición (method, headers, body, etc.)
 * @returns {Promise<Object>} - Promise que se resuelve con la respuesta en formato JSON
 */
const fetchAPI = async (endpoint, options = {}) => {
  const { body, headers: customHeaders, ...restOptions } = options;
  const token = localStorage.getItem('token');
  
  // HOTFIX: Interceptar llamadas incorrectas a /auth/me y corregirlas (tanto relativas como absolutas)
  let correctedEndpoint = endpoint;
  
  // Caso 1: endpoint relativo simple
  if (endpoint === '/auth/me') {
    console.warn('🚨 HOTFIX: Interceptando llamada incorrecta a /auth/me - corrigiendo a /user/me');
    correctedEndpoint = '/user/me';
  } 
  // Caso 2: URL absoluta antigua de Render
  else if (endpoint.includes('nextjs-gozamadrid-qrfk.onrender.com/auth/me')) {
    console.warn('🚨 HOTFIX: Interceptando URL absoluta incorrecta a Render - corrigiendo dominio y ruta');
    correctedEndpoint = `${BASE_URL}/user/me`;
  }
  // Caso 3: URL nueva pero con ruta incorrecta
  else if (endpoint.includes('blogs.realestategozamadrid.com/auth/me')) {
    console.warn('🚨 HOTFIX: Interceptando URL con dominio correcto pero ruta incorrecta');
    correctedEndpoint = `${BASE_URL}/user/me`;
  }
  
  console.log(`[fetchAPI Debug] Endpoint: ${correctedEndpoint}`);
  console.log(`[fetchAPI Debug] Token from localStorage: ${token ? token.substring(0, 20) + '...' : 'NULL'}`);
  
  // Configurar headers por defecto
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders
  };

  // Agregar token de autorización si existe y está válido
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log(`[fetchAPI Debug] Final Request Headers:`, Object.keys(headers).reduce((acc, key) => {
    acc[key] = key === 'Authorization' ? 'Bearer ***...' : headers[key];
    return acc;
  }, {}));

  try {
    let response;
    
    // Determinar si estamos en modo desarrollo o producción
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    const requestUrl = isLocalDevelopment ? correctedEndpoint : `${BASE_URL}${correctedEndpoint}`;
    console.log(`🔄 Enviando solicitud a: ${requestUrl}`);
    response = await fetch(requestUrl, {
        ...restOptions,
        headers,
        body: body ? body : undefined,
    });

    if (!response.ok) {
      const requestUrl = isLocalDevelopment ? correctedEndpoint : `${BASE_URL}${correctedEndpoint}`;
      console.error(`❌ Error HTTP: ${response.status} en ${requestUrl}`);
      
      // Intentar parsear la respuesta como JSON para obtener el mensaje de error
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        // Si no es JSON, usar el texto de la respuesta
        const errorText = await response.text();
        errorData = { 
          error: true, 
          status: response.status, 
          message: errorText 
        };
      }
      
      throw new Error(errorData.message || `HTTP Error ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error en fetchAPI(${correctedEndpoint}):`, error);
    throw error;
  }
};

/**
 * Obtiene la configuración de Cloudinary para unsigned upload.
 * @returns {Promise<Object>} - Promise que se resuelve con los datos de configuración para unsigned upload
 */
export const getCloudinarySignature = async () => {
  console.log('Configurando Cloudinary para upload unsigned...');
  try {
    // En lugar de obtener firma del backend, usar upload unsigned
    // Usando las credenciales que ya están configuradas en Render
    const cloudName = 'dv31mt6pd'; // Cloud name del backend
    
    // Intentar varios presets comunes o usar unsigned upload básico
    const possiblePresets = [
      'ml_default',       // Preset común de Machine Learning
      'unsigned',         // Preset genérico común
      'default',          // Preset básico
      'upload',           // Otro preset común
      'unsigned_upload'   // Preset personalizado
    ];
    
    console.log('Configuración de Cloudinary configurada para upload unsigned.');
    return {
      success: true,
      cloudName: cloudName,
      folder: 'blogsy-uploads', // Folder por defecto
      signed: false, // Para unsigned upload
      uploadPreset: possiblePresets[0], // Usar el primer preset
      fallbackPresets: possiblePresets.slice(1) // Otros presets como fallback
    };

  } catch (error) {
    console.error('Error en getCloudinarySignature:', error);
    // Re-lanzamos el error para que la función que llama (handleImageUpload) pueda manejarlo
    throw error; 
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

    const result = await fetchAPI('/api/blogs', {
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
  console.log('Obteniendo blogs del servidor...');
  try {
    const response = await fetchAPI('/api/blogs', {});
    console.log('Blogs recibidos del servidor:', response);
    console.log(`Se obtuvieron ${response?.length || 0} blogs`);
    return response || [];
  } catch (error) {
    console.error('Error al obtener blogs:', error);
    return [];
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

    return await fetchAPI(`/api/blogs/${id}`, {
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
    console.log(`Enviando PUT a /api/blogs/${id} con datos:`, data);
    
    return await fetchAPI(`/api/blogs/${id}`, {
      method: 'PUT',
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
  console.log(`Obteniendo blog por ID: ${id}`);
  try {
    return await fetchAPI(`/api/blogs/${id}`, {
      method: 'GET',
    });
  } catch (error) {
    console.error(`Error al obtener blog ${id}:`, error);
    throw error;
  }
};

/**
 * Funciones específicas de autenticación
 */
export const loginUser = async (credentials) => {
  try {
    // Validar que las credenciales sean válidas
    if (!credentials || typeof credentials !== 'object') {
      console.error('Error: credenciales inválidas, se esperaba un objeto');
      throw new Error('Credenciales inválidas: se requiere un objeto con email y password');
    }
    
    // Asegurar que email y password estén presentes
    if (!credentials.email || !credentials.password) {
      console.error('Error: faltan campos obligatorios en las credenciales', 
                   { email: !!credentials.email, password: !!credentials.password });
      throw new Error('Credenciales incompletas: se requiere email y password');
    }
    
    // Crear un objeto de datos limpio para el login
    const loginData = {
      email: credentials.email,
      password: credentials.password
    };
    
    console.log(`📝 Intentando login con email: ${loginData.email}`);
    
    // Enviar las credenciales como JSON string
    const body = JSON.stringify(loginData);
    
    // Log detallado
    console.log('Enviando solicitud de login:', JSON.parse(JSON.stringify(loginData))); // Clonar para evitar problemas de log
    
    // Construir la URL de login
    const loginUrl = '/api/user/login';
    
    // Enviar las credenciales
    const result = await fetchAPI(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: body
    });

    console.log('Resultado login:', result);
    
    // Verificar si hay un error en la respuesta
    if (result && result.error) {
      console.error(`Error en la autenticación: ${result.message}`);
      return { 
        success: false, 
        message: result.message || 'Error de autenticación'
      };
    }
    
    if (result && result.token) {
      // Almacenar el token y nombre de usuario
      localStorage.setItem('token', result.token);
      if (result.user && result.user.name) {
        localStorage.setItem('name', result.user.name);
      }

      // Guardar información adicional del usuario
      if (result.user) {
        if (result.user.profilePic) {
          localStorage.setItem('profilePic', result.user.profilePic);
        }
        if (result.user.role) {
          localStorage.setItem('role', result.user.role);
        }
        if (result.user.email) {
          localStorage.setItem('email', result.user.email);
        }
      }

      return { 
        success: true, 
        user: result.user || { id: result.id, email: credentials.email }, 
        token: result.token 
      };
    } else {
      return { 
        success: false, 
        message: result.message || 'Error de autenticación' 
      };
    }
  } catch (error) {
    console.error('Error en el login:', error);
    return { 
      success: false, 
      message: error.message || 'Error en el servidor. Por favor, intenta más tarde.' 
    };
  }
};

/**
 * Registra un nuevo usuario.
 * @param {Object} data - Datos del usuario.
 * @returns {Promise<Object>}
 */
export const registerUser = async (userData) => {
  console.log("Datos recibidos para registro:", userData);
  try {
    return await fetchAPI('/api/user/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  } catch (error) {
    console.error('Error en registerUser:', error);
    throw error;
  }
};

// Alias para mantener compatibilidad con el código existente
export const createUser = registerUser;

/**
 * Obtiene los datos del usuario autenticado mediante el token.
 * @returns {Promise<Object>} - Datos del usuario.
 */
export const getAuthenticatedUser = async () => {
  try {
    return await fetchAPI('/user/me');
  } catch (error) {
    console.error('Error al obtener usuario autenticado:', error);
    throw error;
  }
};

/**
 * Función de compatibilidad para getCurrentUser - redirige a getAuthenticatedUser
 * @returns {Promise<Object>} - Datos del usuario.
 */
export const getCurrentUser = async () => {
  console.log('🔄 getCurrentUser: Redirigiendo a getAuthenticatedUser con ruta /user/me');
  return await getAuthenticatedUser();
};

// Función para obtener el perfil del usuario
export async function getUserProfile(token) {
  try {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      throw new Error('No hay token de autenticación');
    }
    
    // Verificar si hay demasiadas solicitudes de perfil en poco tiempo (posible bucle)
    const profileAttemptsKey = 'profileApiAttempts';
    const now = Date.now();
    const recentAttempts = JSON.parse(localStorage.getItem(profileAttemptsKey) || '[]');
    const veryRecentAttempts = recentAttempts.filter(
      time => (now - time) < 2000 // últimos 2 segundos
    );
    
    // Si hay más de 2 intentos en 2 segundos, crear respuesta local
    if (veryRecentAttempts.length > 2) {
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
    
    console.log("🔍 getUserProfile: Consultando perfil del usuario autenticado...");
    
    // Enviar el token en las cabeceras
    const userDataFromApi = await fetchAPI('/user/me', {
      method: 'GET',
    });
    
    // Verificar si la llamada a fetchAPI fue exitosa y devolvió datos
    if (userDataFromApi && !userDataFromApi.error && (userDataFromApi.id || userDataFromApi._id)) {
      // Asegurar que el campo 'id' esté presente, copiándolo de '_id' si es necesario
      const finalUserData = {
        ...userDataFromApi,
        id: userDataFromApi.id || userDataFromApi._id, // Asegura que 'id' exista
        // Opcional: asegurar consistencia de profilePic/profileImage si es necesario
        profileImage: userDataFromApi.profileImage || userDataFromApi.profilePic || null 
      };
      // Eliminar _id si existe para evitar confusión
      delete finalUserData._id; 
      delete finalUserData.profilePic; // Eliminar profilePic si usamos solo profileImage

      console.log("getUserProfile: Success - Returning:", finalUserData);
      return finalUserData; 
    } else {
      // Si fetchAPI indicó un error, devolvió datos inválidos (sin id), o vacío
      const errorMessage = userDataFromApi?.message || 'Failed to fetch valid user profile from API (missing id?)';
      console.error("getUserProfile: fetchAPI('/user/me') failed or returned invalid data:", userDataFromApi);
      throw new Error(errorMessage);
    }

  } catch (error) {
    // Si fetchAPI lanzó una excepción o la verificación anterior falló
    console.error('getUserProfile: Error fetching profile from API. NO fallback to localStorage. Error:', error);
    // **NO DEVOLVER DATOS DE LOCALSTORAGE AQUÍ**
    // Re-lanzar el error para que el llamador (refreshUserData) lo maneje.
    throw error; 
    
    /* // Lógica de fallback eliminada
    const email = localStorage.getItem('email'); ... 
    */
  }
}

// Replace axios with native fetch API

// Helper function to handle fetch responses
const handleResponse = async (response) => {
  // Esta función ya no es necesaria si fetchAPI maneja las respuestas
  /*
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status}`);
  }
  return response.json();
  */
 // Se puede mantener si fetchAPI devuelve el objeto response completo en algún caso
 // o eliminarla si fetchAPI siempre devuelve el JSON parseado o un objeto de error.
 // Por ahora, la comentamos ya que fetchAPI parece manejar los errores.
};

// GET request (Ya usa fetchAPI indirectamente o directamente)
export const fetchData = async (endpoint) => {
  try {
    // Asumiendo que fetchAPI se usa directamente donde se necesita GET
    // O si queremos un wrapper específico para GET:
    return await fetchAPI(endpoint, { method: 'GET' }); 
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error; // Relanzar para que el componente maneje el error
  }
};

// POST request (Refactorizado para usar fetchAPI)
export const postData = async (endpoint, data) => {
  // *** LOG AL INICIO DE postData ***
  console.log(`[postData] Iniciando POST a endpoint: ${endpoint}`);
  // *******************************
  try {
    console.log(`[postData] Datos para ${endpoint}:`, data);
    const options = {
      method: 'POST',
      body: JSON.stringify(data),
    };
    // Llamada a fetchAPI (aquí deberían aparecer los logs internos de fetchAPI si todo va bien)
    const result = await fetchAPI(endpoint, options);
    console.log(`[postData] Resultado de fetchAPI para ${endpoint}:`, result); // Log del resultado
    
    if (result?.error) {
       // Lanzar error para que createPropertyPost lo capture
      throw new Error(result.message || 'Error en la solicitud POST devuelto por fetchAPI');
    }
    return result;
  } catch (error) {
    console.error(`[postData] Error en POST a ${endpoint}:`, error);
    // Relanzar el error para que createPropertyPost lo maneje
    // Devolver un objeto de error consistente ya no es necesario aquí si relanzamos
    throw error; 
  }
};

// PUT request (Refactorizado para usar fetchAPI)
export const updateData = async (endpoint, data) => {
  try {
    console.log(`PUT ${endpoint} con datos:`, data);
    const options = {
      method: 'PUT',
      body: JSON.stringify(data),
    };
    const result = await fetchAPI(endpoint, options);
    if (result?.error) {
      throw new Error(result.message || 'Error en la solicitud PUT');
    }
    return result;
  } catch (error) {
    console.error(`Error updating data at ${endpoint}:`, error);
    return { error: true, message: error.message || 'Error desconocido en PUT' }; 
  }
};

// DELETE request (Refactorizado para usar fetchAPI)
export const deleteData = async (endpoint) => {
  try {
    console.log(`DELETE ${endpoint}`);
    const options = {
      method: 'DELETE',
    };
    const result = await fetchAPI(endpoint, options);
    // fetchAPI devuelve { success: true } para DELETE exitoso (204)
    if (result?.error) {
      throw new Error(result.message || 'Error en la solicitud DELETE');
    }
    return result; 
  } catch (error) {
    console.error(`Error deleting data at ${endpoint}:`, error);
    return { error: true, message: error.message || 'Error desconocido en DELETE' }; 
  }
};

/**
 * Almacena la imagen de perfil en localStorage
 * Versión simplificada sin sincronización entre componentes
 * @param {string} imageUrl - URL de la imagen para guardar
 */
export const syncProfileImage = (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    // Verificar si la imagen es válida
    if (typeof imageUrl !== 'string' || 
        imageUrl === 'undefined' || 
        imageUrl === 'null') {
      console.warn('syncProfileImage: Imagen inválida proporcionada');
      return null;
    }
    
    console.log('syncProfileImage: Sincronizando imagen:', imageUrl.substring(0, 30) + '...');
    
    // 1. Guardar en localStorage para persistencia
    localStorage.setItem('profilePic', imageUrl);
    localStorage.setItem('profilePic_backup', imageUrl);
    localStorage.setItem('profilePic_lastUpdate', Date.now().toString());
    
    // 2. Actualizar userData si existe
    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (userData) {
        userData.profilePic = imageUrl;
        userData.profileImage = imageUrl;
        localStorage.setItem('userData', JSON.stringify(userData));
      }
    } catch (e) {
      console.warn('Error al actualizar userData:', e);
    }
    
    // 3. Intentar actualizar userResponse si existe
    try {
      const userResponse = localStorage.getItem('userResponse');
      if (userResponse) {
        const responseData = JSON.parse(userResponse);
        responseData.profilePic = imageUrl;
        responseData.profileImage = imageUrl;
        localStorage.setItem('userResponse', JSON.stringify(responseData));
      }
    } catch (e) {
      console.warn('Error al actualizar userResponse:', e);
    }
    
    // 4. Emitir evento de actualización para componentes que escuchan
    // Usar setTimeout para asegurar que los datos estén guardados antes
    setTimeout(() => {
      try {
        window.dispatchEvent(new CustomEvent('profileImageUpdated', {
          detail: { 
            profileImage: imageUrl, 
            timestamp: Date.now(), 
            source: 'syncProfileImage' 
          }
        }));
        console.log('Evento de actualización de imagen emitido con éxito');
      } catch (eventError) {
        console.warn('Error al emitir evento de actualización:', eventError);
      }
    }, 50);
    
    console.log('Imagen de perfil sincronizada correctamente');
    return imageUrl;
  } catch (error) {
    console.error('Error crítico al guardar imagen en localStorage:', error);
    return null;
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
      console.log('URL de imagen vacía');
      resolve(false);
      return;
    }
    
    // Si no es una cadena de texto, no es accesible
    if (typeof url !== 'string') {
      console.log('URL de imagen no es string:', typeof url, url);
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
      'www.realestategozamadrid.com',
      'api.realestategozamadrid.com',
      'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'
    ];
    
    // Verificar si la URL pertenece a un dominio confiable
    const isTrustedDomain = trustedDomains.some(domain => url.includes(domain));
    
    // Para dominios confiables, considerar accesible sin verificar
    if (isTrustedDomain) {
      console.log('URL de dominio confiable, asumiendo que es accesible:', url);
      resolve(true);
      return;
    }
    
    // Para dominios no confiables, verificar con el método de Image
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
    console.log("Subiendo imagen de propiedad a:", `${BASE_URL}/api/properties/upload-image`);
    console.log("FormData contenido:", Array.from(formData.entries()));
    
    const response = await fetch(`${BASE_URL}/api/properties/upload-image`, {
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
    
    // Comentado: No convertir a HTTPS para el backend de AWS sin certificado SSL válido
    // // Asegurar que la URL devuelta use el mismo protocolo que la página
    // let processedUrl = imageUrl;
    // if (isHttps && processedUrl.startsWith('http:')) {
    //   processedUrl = processedUrl.replace('http://', 'https://');
    // }
    
    return {
      src: imageUrl, // Usar URL original sin conversión
      alt: 'Imagen de propiedad'
    };
    
  } catch (error) {
    console.error('Error al subir imagen de propiedad:', error);
    throw error;
  }
};

/**
 * Función de prueba específica para verificar la conexión a la API
 * @returns {Promise<Object>} - Estado de la conexión
 */
export const testApiConnection = async () => {
  console.log('🔍 Probando conexión a la API en:', BASE_URL);
  
  try {
    // Prueba básica de conexión (endpoint root)
    const basicResponse = await fetch(`${BASE_URL}`, { method: 'GET' });
    console.log('📊 Respuesta de conexión a API: Status', basicResponse.status);
    
    // Prueba de endpoint de blogs
    const blogTestResponse = await fetch(`${BASE_URL}/api/blogs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('📚 Prueba de ruta de blogs: Status', blogTestResponse.status);
    
    // Prueba de endpoint de propiedades  
    const propertyTestResponse = await fetch(`${BASE_URL}/api/properties`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    console.log('🏠 Prueba de ruta de propiedades: Status', propertyTestResponse.status);
    
    // Verificar que todas las pruebas fueron exitosas
    if (basicResponse.ok && blogTestResponse.ok && propertyTestResponse.ok) {
      console.log('✅ Todas las rutas API están funcionando correctamente');
      return { success: true, message: 'API conectada correctamente' };
    } else {
      console.warn('⚠️ Algunas rutas tienen problemas:', {
        basic: basicResponse.status,
        blogs: blogTestResponse.status,
        properties: propertyTestResponse.status
      });
      return { 
        success: false, 
        message: 'Conexión parcial a la API',
        details: {
          basic: basicResponse.status,
          blogs: blogTestResponse.status,
          properties: propertyTestResponse.status
        }
      };
    }
  } catch (error) {
    console.error('❌ Error al probar conexión a la API:', error);
    return { success: false, message: 'Error de conexión', error: error.message };
  }
};

// Alias para mantener compatibilidad con el código existente
export const testConnection = testApiConnection;

/**
 * Sincroniza la imagen de perfil con el servidor para permitir sincronización entre dispositivos
 * @param {string} imageData - Datos de la imagen o URL 
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
export const syncProfileImageBetweenDevices = async (imageData) => {
  if (!imageData) {
    console.error("No se proporcionó imagen para sincronizar entre dispositivos");
    return { success: false, error: "Imagen no proporcionada" };
  }

  try {
    // Verificar si hay token disponible
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No hay token disponible para sincronización entre dispositivos");
      return { success: false, error: "No hay sesión activa" };
    }

    console.log("🔄 Iniciando sincronización de imagen entre dispositivos...");

    // Primero guardar localmente (por si falla la petición al servidor)
    syncProfileImage(imageData);

    // Verificar si la imagen es base64 o URL
    const isBase64 = imageData.startsWith('data:');
    
    let requestBody;
    let headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // Si es base64, enviar directamente
    if (isBase64) {
      console.log("📤 Enviando imagen base64 al servidor para sincronización entre dispositivos");
      requestBody = JSON.stringify({ 
        profilePic: imageData 
      });
    } 
    // Si es una URL, enviar la URL
    else {
      console.log("📤 Enviando URL de imagen al servidor para sincronización entre dispositivos");
      requestBody = JSON.stringify({ 
        profilePicUrl: imageData 
      });
    }

    // Obtenemos la URL base correcta
    // 1. Primero intentar usar la URL definida en localStorage
    let apiUrl;
    const storedApiUrl = localStorage.getItem('definitive_api_url');
    if (storedApiUrl) {
      apiUrl = storedApiUrl;
    } 
    // 2. Si no existe, verificar el protocolo actual y construir la URL
    else {
      const isHttps = window.location.protocol === 'https:';
      const API_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
      apiUrl = `${isHttps ? 'https' : 'http'}://${API_DOMAIN}`;
      
      // Guardar para futuros usos
      localStorage.setItem('definitive_api_url', apiUrl);
    }

    console.log(`🔄 Usando API URL: ${apiUrl} para sincronización de imagen`);

    // Enviar al servidor para almacenar en la cuenta del usuario
    const response = await fetch(`${apiUrl}/user/sync-profile-image`, {
      method: 'POST',
      headers,
      body: requestBody,
      credentials: 'include' // Incluir cookies para CORS
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error al sincronizar imagen entre dispositivos: ${response.status}`, errorText);
      
      // Si es un error de autorización, intentar refrescar el token
      if (response.status === 401) {
        console.warn("Token expirado. Intentando refrescar token...");
        // Aquí no refrescamos el token pero guardamos la imagen para que esté disponible la próxima vez
        localStorage.setItem('pendingProfileSync', 'true');
        localStorage.setItem('profilePic_pending', imageData);
      }
      
      // Usar respuesta de error como texto normal si no es JSON
      try {
        return { 
          success: false, 
          status: response.status,
          error: JSON.parse(errorText).message || "Error de servidor" 
        };
      } catch (e) {
        return { 
          success: false, 
          status: response.status,
          error: errorText || "Error desconocido" 
        };
      }
    }

    // Procesar respuesta del servidor
    const data = await response.json();
    console.log("✅ Imagen sincronizada correctamente entre dispositivos");

    // Registrar timestamp de última sincronización
    localStorage.setItem('profilePic_lastCloudSync', Date.now().toString());
    // Eliminar banderas de sincronización pendiente
    localStorage.removeItem('pendingProfileSync');
    localStorage.removeItem('profilePic_pending');

    // Notificar a toda la aplicación sobre la sincronización exitosa
    window.dispatchEvent(new CustomEvent('profileImageSynced', {
      detail: {
        success: true,
        timestamp: Date.now()
      }
    }));

    return {
      success: true,
      ...data
    };
  } catch (error) {
    console.error("Error crítico al sincronizar imagen entre dispositivos:", error);
    
    // En caso de error, asegurar que la imagen se guarde localmente
    try {
      if (imageData) {
        localStorage.setItem('profilePic', imageData);
        localStorage.setItem('profilePic_backup', imageData);
        // Marcar como pendiente para sincronizar más tarde
        localStorage.setItem('pendingProfileSync', 'true');
        localStorage.setItem('profilePic_pending', imageData);
      }
    } catch (saveError) {
      console.error("Error al guardar imagen localmente:", saveError);
    }
    
    return { 
      success: false, 
      error: error.message || "Error desconocido" 
    };
  }
};

/**
 * Obtener la imagen de perfil desde el servidor (útil al iniciar sesión en un nuevo dispositivo)
 * @returns {Promise<Object>} - Imagen de perfil desde el servidor
 */
export const fetchProfileImageFromServer = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn("No hay token disponible para obtener imagen desde servidor");
      return { success: false, error: "No hay sesión activa" };
    }

    console.log("🔍 Obteniendo imagen de perfil desde el servidor...");

    const response = await fetch(`${BASE_URL}/api/user/profile-image`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error(`Error al obtener imagen: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };

  } catch (error) {
    console.error("❌ Error al obtener imagen de perfil desde servidor:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Sube una imagen para un blog
 * @param {FormData} formData - FormData con la imagen
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const uploadImageBlog = async (formData) => {
  try {
    console.log("Subiendo imagen para blog...");
    
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${BASE_URL}/api/blogs/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error al subir imagen de blog:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data || !data.imageUrl) {
      throw new Error("No se recibió una URL de imagen válida");
    }

    console.log("Imagen de blog subida exitosamente:", data);
    return {
      src: data.imageUrl,
      alt: 'Imagen del blog'
    };
  } catch (error) {
    console.error('Error al subir imagen de blog:', error);
    throw error;
  }
};

/**
 * Sube una imagen de perfil y actualiza el perfil del usuario
 * @param {string} userId - ID del usuario
 * @param {File} imageFile - Archivo de imagen
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const uploadProfileImageAndUpdate = async (userId, imageFile) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }

    // Crear FormData
    const formData = new FormData();
    formData.append('profilePic', imageFile);

    console.log(`Subiendo imagen de perfil para usuario ${userId}...`);

    const response = await fetch(`${BASE_URL}/api/user/update-profile`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error al subir imagen:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Imagen de perfil subida exitosamente:", data);
    
    return data;
  } catch (error) {
    console.error('Error en uploadProfileImageAndUpdate:', error);
    throw error;
  }
};

/**
 * Función para obtener todas las propiedades
 * @returns {Promise<Array>}
 */
export const getProperties = async () => {
  console.log('Obteniendo propiedades del servidor...');
  try {
    const response = await fetchAPI('/api/properties');
    console.log('Propiedades recibidas del servidor:', response);
    console.log(`Se obtuvieron ${response?.length || 0} propiedades`);
    return response || [];
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    return [];
  }
};

/**
 * Función para eliminar una propiedad por ID
 * @param {string} id - Identificador de la propiedad
 * @returns {Promise<Object>}
 */
export const deletePropertyPost = async (id) => {
  console.log(`Eliminando propiedad ${id}`);
  try {
    return await fetchAPI(`/api/properties/${id}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(`Error al eliminar propiedad ${id}:`, error);
    throw error;
  }
};

/**
 * Función para crear una nueva propiedad
 * @param {Object} data - Datos de la propiedad
 * @returns {Promise<Object>}
 */
export const createPropertyPost = async (data) => {
  try {
    console.log("[createPropertyPost] Datos recibidos:", data);
    const token = localStorage.getItem('token');
    console.log("[createPropertyPost] TOKEN JUSTO ANTES DE LLAMAR A postData('/api/properties'): " + (token ? "EXISTE" : "NULL"));
    
    const result = await postData('/api/properties', data);
    
    console.log("[createPropertyPost] Respuesta del servidor:", result);
    
    if (!result || result.error) {
      console.error("[createPropertyPost] Error al crear propiedad:", result);
      throw new Error(result?.message || 'Error al crear la propiedad');
    }
    
    return result;
  } catch (error) {
    console.error("[createPropertyPost] Error crítico:", error);
    throw error;
  }
};

/**
 * Función para obtener una propiedad por ID
 * @param {string} id - Identificador de la propiedad
 * @returns {Promise<Object>}
 */
export const getPropertyById = async (id) => {
  console.log(`Obteniendo propiedad por ID: ${id}`);
  try {
    // Verificar si está disponible el conector directo
    if (typeof window !== 'undefined' && window.DirectBackend && window.DirectBackend.properties) {
      console.log('🔌 [API] Usando conector directo al backend para getPropertyById');
      const data = await window.DirectBackend.properties.getById(id);
      if (data && !data.error) {
        return data;
      } else {
        console.warn('⚠️ [API] Error con conector directo, fallback a fetchAPI', data);
        // Continuar con fetchAPI como fallback
      }
    }
    
    // Método tradicional con fetchAPI
    return await fetchAPI(`/api/properties/${id}`);
  } catch (error) {
    console.error(`Error al obtener propiedad ${id}:`, error);
    
    // Si hay un error y tenemos el conector de respaldo, intentar una vez más
    if (typeof window !== 'undefined' && window.DirectBackend && !error.isDirectBackendError) {
      try {
        console.log('🛟 [API] Intentando recuperar propiedad con conector directo como último recurso');
        return await window.DirectBackend.properties.getById(id);
      } catch (backupError) {
        console.error('❌ [API] También falló el intento de respaldo:', backupError);
      }
    }
    
    throw error;
  }
};

/**
 * Función para actualizar una propiedad
 * @param {string} id - Identificador de la propiedad
 * @param {Object} data - Datos actualizados de la propiedad
 * @returns {Promise<Object>}
 */
export const updatePropertyPost = async (id, data) => {
  console.log(`Actualizando propiedad ${id} con datos:`, data);
  try {
    return await fetchAPI(`/api/properties/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
  } catch (error) {
    console.error(`Error al actualizar propiedad ${id}:`, error);
    throw error;
  }
};

/**
 * Sube un archivo genérico
 * @param {FormData} formData - FormData con el archivo
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const uploadFile = async (formData) => {
  try {
    console.log("Subiendo archivo genérico...");
    
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: headers,
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error al subir archivo genérico:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Archivo subido exitosamente:", data);
    
    return data;
  } catch (error) {
    console.error('Error al subir archivo genérico:', error);
    throw error;
  }
};

/**
 * Función de fallback para subir imágenes cuando Cloudinary falla
 * Usa el endpoint del backend para subir imágenes
 * @param {File} file - Archivo a subir
 * @param {string} type - Tipo de upload ('blog' o 'property')
 * @returns {Promise<Object>} - Resultado del upload
 */
export const uploadImageFallback = async (file, type = 'blog') => {
  try {
    console.log(`🔄 Usando fallback del backend para subir imagen (${type}):`, file.name);
    
    const formData = new FormData();
    // Usar el nombre de campo correcto según el tipo
    if (type === 'property') {
      formData.append('image', file);
    } else {
      formData.append('image', file);
    }
    
    const token = localStorage.getItem('token');
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Elegir la ruta correcta según el tipo
    let uploadUrl;
    if (type === 'property') {
      uploadUrl = `${BASE_URL}/api/properties/upload-image`;
    } else {
      uploadUrl = `${BASE_URL}/api/blogs/upload`;
    }
    
    // Intentar subir al backend
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: headers,
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Error del backend: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.imageUrl || result.url || result.secure_url) {
      console.log(`✅ Upload exitoso usando backend (${type})`);
      return {
        src: result.imageUrl || result.url || result.secure_url,
        alt: file.name,
        fallback: true,
        type: type
      };
    } else {
      throw new Error('No se recibió URL de imagen del backend');
    }
    
  } catch (error) {
    console.error(`❌ Error en fallback del backend (${type}):`, error);
    throw error;
  }
};