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

// Modificar la URL base para usar el servidor local en desarrollo o el proxy en producción
const API_DOMAIN = isLocalDevelopment 
  ? 'localhost:8081'  // Servidor de desarrollo local
  : null;  // En producción usaremos una ruta relativa para el proxy

// Usar HTTP para localhost, ruta relativa para producción (proxy API)
export const BASE_URL = isLocalDevelopment 
  ? `http://${API_DOMAIN}`  // Desarrollo local: HTTP
  : '/api';  // Producción: Usar el proxy configurado en Vercel

// Determinar si estamos usando HTTPS
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

// Usar la API directamente sin proxies
const API_BASE_URL = BASE_URL;

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
export const fetchAPI = async (endpoint, options = {}, retryCount = 0) => {
  // Crear un controlador de aborto para limitar el tiempo máximo de espera
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000); // 10 segundos de tiempo máximo
  
  try {
    // Construir la URL completa - Siempre en HTTPS
    let url = combineUrls(BASE_URL, endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
    
    // Asegurar que sea HTTPS para el backend de producción, pero mantener HTTP para desarrollo local
    if (url.startsWith('http://') && !url.includes('localhost') && !url.includes('127.0.0.1')) {
      // Solo convertir a HTTPS si NO es localhost o IP local
      url = url.replace('http://', 'https://');
    }
    
    console.log(`🔄 Enviando solicitud directa a: ${url}`);
    
    // Verificar si estamos en un bucle de solicitudes repetidas
    if (detectAndPreventLoopError('api_fetch_' + endpoint, 8000, 4)) {
      console.error(`🛑 Bucle de solicitudes detectado para ${endpoint}. Cancelando operación.`);
      clearTimeout(timeoutId);
      
      // Devolver respuesta vacía para evitar bucles
      if (endpoint.includes('/blog') || endpoint.includes('/property')) {
        return [];
      }
      
      return {
        error: true,
        message: 'Demasiadas solicitudes repetidas. Intente de nuevo más tarde.'
      };
    }
    
    // Preparar las cabeceras
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers
    };
    
    // Incluir token de autenticación si está disponible
    const token = localStorage.getItem('token');
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Agregar signal a las opciones para el aborto por tiempo
    const requestOptions = {
      ...options,
      headers,
      signal: controller.signal
    };

    // *** LOG DE DEPURACIÓN ***
    console.log(`[fetchAPI Debug] Endpoint: ${endpoint}`);
    console.log(`[fetchAPI Debug] Token from localStorage: ${token ? token.substring(0, 15) + '...' : 'NULL'}`);
    console.log('[fetchAPI Debug] Final Request Headers:', JSON.parse(JSON.stringify(requestOptions.headers))); // Clonar para evitar problemas de log
    // ************************

    // Realizar la petición fetch
    const response = await fetch(url, requestOptions);
    
    // Limpiar el timeout independientemente del resultado
    clearTimeout(timeoutId);
    
    // Clonar la respuesta antes de leerla, para evitar el error "body stream already read"
    const clonedResponse = response.clone();
    
    // Manejar diferentes códigos de estado HTTP
    if (!response.ok) {
      console.error(`❌ Error HTTP: ${response.status} en ${url}`);
      
      // Para 404, retornar un array vacío si el endpoint parece ser una colección de datos
      if (response.status === 404 && 
         (endpoint.includes('/blogs') || endpoint.includes('/properties'))) {
        console.warn(`⚠️ Endpoint ${endpoint} no encontrado, devolviendo array vacío`);
        return [];
      }
      
      try {
        // Intentar leer el mensaje de error como JSON
        const errorData = await clonedResponse.json();
        console.error('Mensaje de error del servidor:', errorData);
        return { 
          error: true, 
          status: response.status,
          message: errorData.message || 'Error del servidor',
          details: errorData
        };
      } catch (e) {
        // Si no es JSON, leer como texto
        try {
          const errorText = await response.text();
          return { 
            error: true, 
            status: response.status,
            message: errorText || 'Error del servidor sin detalles'
          };
        } catch (textError) {
          // Si todo falla, devolver un error genérico
          return { 
            error: true, 
            status: response.status,
            message: `Error ${response.status} sin detalles disponibles`
          };
        }
      }
    }
    
    // Procesar respuesta exitosa
    try {
      // Si es una respuesta vacía (como en un DELETE exitoso)
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        return { success: true };
      }
      
      // Intentar parsear como JSON
      const data = await response.json();
      return data;
    } catch (parseError) {
      console.error('Error al parsear respuesta JSON:', parseError);
      
      // En caso de error de parseo, intentar leer como texto
      try {
        const textData = await clonedResponse.text();
        if (!textData) return { success: true, message: 'Operación exitosa sin datos' };
        
        return {
          success: true,
          raw: textData
        };
      } catch (finalError) {
        console.error('Error al obtener texto de respuesta:', finalError);
        return { 
          success: true,
          warning: 'No se pudo leer el contenido de la respuesta'
        };
      }
    }
  } catch (error) {
    // Limpiar el timeout en caso de error
    clearTimeout(timeoutId);
    
    // Manejar errores específicos
    if (error.name === 'AbortError') {
      console.error('⏱️ La solicitud ha sido abortada por timeout');
      return { error: true, message: 'Timeout de solicitud', timeout: true };
    }
    
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.error('🌐 Error de red:', error.message);
      return { error: true, message: 'Error de conexión con el servidor', network: true };
    }
    
    console.error('❌ Error en fetchAPI:', error);
    return { error: true, message: error.message || 'Error desconocido' };
  }
};

/**
 * Obtiene la firma segura de Cloudinary desde el backend.
 * @returns {Promise<Object>} - Promise que se resuelve con los datos de la firma (signature, timestamp, apiKey, etc.)
 */
export const getCloudinarySignature = async () => {
  console.log('Solicitando firma de Cloudinary...');
  try {
    // No necesitamos enviar nada en el body para GET
    const signatureData = await fetchAPI('/api/cloudinary/signature', { method: 'GET' });
    
    if (signatureData.error) {
      console.error('Error al obtener la firma desde la API:', signatureData.message);
      throw new Error(signatureData.message || 'Error del servidor al obtener la firma');
    }
    
    if (!signatureData.success || !signatureData.signature) {
      console.error('Respuesta inválida del endpoint de firma:', signatureData);
      throw new Error('Respuesta inválida del servidor al obtener la firma');
    }
    
    console.log('Firma de Cloudinary obtenida con éxito.');
    return signatureData; // Devolvemos el objeto completo { success, signature, timestamp, apiKey, ... }

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

    const result = await fetchAPI('/blogs', {
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
    const blogs = await fetchAPI('/blogs');
    console.log("Blogs recibidos del servidor:", blogs);
    
    // Verificar la estructura de cada blog y procesar las imágenes
    if (Array.isArray(blogs)) {
      return blogs.map(blog => {
        console.log(`Blog ${blog._id} - Procesando...`);
        
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
        
        return {
          ...blog,
          images: processedImages
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error al obtener blogs:', error);
    // Devolver array vacío en caso de error
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
    console.log(`Enviando PATCH a /api/blogs/${id} con datos:`, data);
    
    return await fetchAPI(`/api/blogs/${id}`, {
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
    return await fetchAPI(`/api/blogs/${id}`);
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
    
    // Usar la URL específica para login
    const loginUrl = '/user/login';
    
    // Enviar las credenciales como JSON string
    const body = JSON.stringify(loginData);
    
    // Log detallado
    console.log('Enviando solicitud de login:', {
      url: loginUrl,
      method: 'POST',
      bodyLength: body.length,
      hasEmail: !!loginData.email,
      hasPassword: !!loginData.password
    });
    
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
    
    const result = await fetchAPI('/api/blogs/upload', {
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
      console.log("Intentando con ruta alternativa:", `${BASE_URL}/blog/upload`);
      
      response = await fetch(`${BASE_URL}/blog/upload`, {
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
  console.log('[createPropertyPost] Iniciando creación con datos:', data); // Log al inicio
  if (!data) {
    console.error('[createPropertyPost] No data provided');
    throw new Error('No se proporcionaron datos para crear la propiedad.');
  }

  // Asegurarse de que las imágenes sean solo un array de URLs (o el formato esperado)
  if (data.images && Array.isArray(data.images)) {
    console.log('[createPropertyPost] Enviando imágenes:', data.images);
  }

  try {
    // *** LOG JUSTO ANTES DE LA LLAMADA PROBLEMÁTICA ***
    const tokenCheckMomentaneo = localStorage.getItem('token');
    console.log(`[createPropertyPost] TOKEN JUSTO ANTES DE LLAMAR A postData('/properties'): ${tokenCheckMomentaneo ? 'EXISTE' : 'NULL'}`);
    // ***************************************************

    // Llamar a postData (Esta es la línea ~873 según la traza)
    const response = await postData('/properties', data);

    console.log('[createPropertyPost] Respuesta recibida de postData:', response);
    if (response && response.error) {
      // Usar el mensaje de error de postData si existe
      throw new Error(response.message || 'Error devuelto por postData al crear la propiedad');
    }
    return response;
  } catch (error) {
    console.error('[createPropertyPost] Error detallado:', error);
    // Asegurarse de relanzar un objeto Error
    throw new Error(error.message || 'Error desconocido en createPropertyPost');
  }
};

export const getPropertyPosts = async () => {
  try {
    console.log("Obteniendo propiedades del servidor...");
    const properties = await fetchAPI('/properties');
    console.log("Propiedades recibidas del servidor:", properties);
    
    // Verificar la estructura de cada propiedad y corregir las imágenes si es necesario
    if (Array.isArray(properties)) {
      return properties.map(property => {
        console.log(`Propiedad ${property._id} - Procesando...`);
        
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
        
        return property;
      });
    }
    
    return [];
  } catch (error) {
    console.error('Error al obtener propiedades:', error);
    // Devolver array vacío en caso de error
    return [];
  }
};

/**
 * Elimina una propiedad por su id.
 * @param {string} id - Identificador del property post.
 * @returns {Promise<Object>}
 */
export const deletePropertyPost = async (id) => {
  try {
    // Obtener el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token de autenticación disponible');
    }
    
    return await fetchAPI(`/api/properties/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
  console.log(`Actualizando propiedad ${id} con datos:`, data);
  if (!id || !data) {
    throw new Error('ID o datos faltantes para actualizar la propiedad.');
  }

  // Similar a create, verificar/ajustar el formato de las imágenes si es necesario
  if (data.images && Array.isArray(data.images)) {
    console.log('Enviando imágenes actualizadas:', data.images);
  }

  try {
    // ***** CORRECCIÓN AQUÍ *****
    const response = await updateData(`/api/properties/${id}`, data); // Usar /api/properties/:id
    // ***********************

    console.log('Respuesta de updatePropertyPost:', response);
    if (response && response.error) {
      throw new Error(response.message || 'Error al actualizar la propiedad');
    }
    return response;
  } catch (error) {
    console.error('Error detallado en updatePropertyPost:', error);
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
    return await fetchAPI(`/api/properties/${id}`);
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
    
    // Intentar obtener el perfil del usuario
    const userDataFromApi = await fetchAPI('/user/me', {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
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

// Añadir función de prueba para verificar la conexión con la API
export const testApiConnection = async () => {
  try {
    console.log(`🔍 Probando conexión a la API en: ${BASE_URL}`);
    
    // Intentar una conexión simple a la raíz de la API
    const response = await fetch(`${BASE_URL}/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`📊 Respuesta de conexión a API: Status ${response.status}`);
    
    // Probar la ruta de blogs específicamente
    const blogTestResponse = await fetch(`${BASE_URL}/api/blogs`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`📚 Prueba de ruta de blogs: Status ${blogTestResponse.status}`);
    
    // Probar la ruta de propiedades específicamente
    const propertyTestResponse = await fetch(`${BASE_URL}/api/properties`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    console.log(`🏠 Prueba de ruta de propiedades: Status ${propertyTestResponse.status}`);
    
    return {
      baseApi: response.status,
      blogs: blogTestResponse.status,
      properties: propertyTestResponse.status
    };
  } catch (error) {
    console.error('❌ Error en prueba de conexión a API:', error);
    return {
      error: true,
      message: error.message
    };
  }
};

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
      const API_DOMAIN = 'api.realestategozamadrid.com';
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

    const response = await fetch(`${BASE_URL}/user/sync-profile-image`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error(`Error al obtener imagen desde servidor: ${response.status}`);
      return { success: false, status: response.status, error: "Error al obtener imagen" };
    }

    const data = await response.json();
    
    if (data.profilePic) {
      console.log("✅ Imagen obtenida del servidor correctamente");
      
      // Actualizar localmente
      syncProfileImage(data.profilePic);
      
      return {
        success: true,
        profileImage: data.profilePic
      };
    } else {
      console.warn("El servidor no devolvió ninguna imagen de perfil");
      return { success: false, error: "No hay imagen de perfil en el servidor" };
    }
  } catch (error) {
    console.error("Error al obtener imagen de perfil desde servidor:", error);
    return { 
      success: false, 
      error: error.message || "Error desconocido" 
    };
  }
};

// Nueva función para subir imagen de perfil y actualizar usuario
export const uploadProfileImageAndUpdate = async (userId, file) => {
  const formData = new FormData();
  formData.append('profileImage', file);

  // Obtener token
  const token = localStorage.getItem('token');
  if (!token) {
    return { error: true, message: 'No autenticado' };
  }

  // Construir URL
  let url = combineUrls(BASE_URL, `/user/profile-image/${userId}`);
  url = ensureHttps(url);
  
  console.log(`🔄 Subiendo imagen de perfil a: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        // NO establecer Content-Type, el navegador lo hará con FormData
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status} al subir imagen perfil:`, data);
      return { error: true, status: response.status, message: data.message || 'Error del servidor' };
    }

    console.log("✅ Imagen de perfil subida y usuario actualizado:", data);
    return data; // Contiene { success: true, message: '...', user: { ... } }

  } catch (error) {
    console.error('❌ Error en uploadProfileImageAndUpdate:', error);
    return { error: true, message: error.message || 'Error de red o desconocido' };
  }
};