// src/services/api.js
/**
 * Servicios de API para la aplicación
 * 
 * Este archivo se conecta directamente al backend HTTPS
 */

// Importar utilidades
import { combineUrls, ensureHttps, detectAndPreventLoopError } from '../utils';

// URL base de la API
const API_DOMAIN = 'api.realestategozamadrid.com';
const BASE_URL = `https://${API_DOMAIN}`;

// Determinar si estamos usando HTTPS
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';

// Usar la API con HTTPS
const API_BASE_URL = BASE_URL;

// Registrar la URL de la API usada
console.log(`🌐 Usando API en: ${BASE_URL} - Acceso directo sin proxies`);
console.log(`🔒 Frontend en: ${isHttps ? 'HTTPS' : 'HTTP'} - ${window.location.origin}`);

// Desactivar explícitamente cualquier proxy CORS
window.useCorsProxy = false;

// Función auxiliar para esperar un tiempo específico
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para manejar errores con límite de intentos y timeout
export const fetchAPI = async (endpoint, options = {}, retryCount = 0) => {
  // Crear un controlador de aborto para limitar el tiempo máximo de espera
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 10000); // 10 segundos de tiempo máximo
  
  try {
    // Construir la URL completa - Siempre en HTTPS
    let url = combineUrls(BASE_URL, endpoint.startsWith('/') ? endpoint : `/${endpoint}`);
    
    // Asegurar que siempre sea HTTPS para el backend
    if (url.startsWith('http://')) {
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
    
    // Configuración por defecto de fetch con CORS permisivo
    const fetchOptions = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      mode: 'cors',
      credentials: 'include', // Incluir credenciales para CORS
      signal: controller.signal // Añadir la señal para poder abortar
    };
    
    // Agregar token de autorización si existe en localStorage
    const token = localStorage.getItem('token');
    if (token && !options.headers?.Authorization) {
      fetchOptions.headers.Authorization = `Bearer ${token}`;
    }
    
    // Agregar cuerpo si existe
    if (options.body) {
      // Si es FormData, no convertir a JSON ni establecer Content-Type
      if (options.body instanceof FormData) {
        fetchOptions.body = options.body;
        // Eliminar Content-Type para que el navegador lo establezca automáticamente con el boundary
        delete fetchOptions.headers['Content-Type'];
      } else {
        fetchOptions.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      }
    }
    
    // Intentar realizar la solicitud directa
    const response = await fetch(url, fetchOptions);
    
    // Si hay un error HTTP, manejar según el tipo
    if (!response.ok) {
      // Si el error fue manejado específicamente
      if (response.status === 401) {
        // Si entramos en bucle de 401, limpiar token
        if (detectAndPreventLoopError('auth_401', 10000, 3)) {
          console.warn("⚠️ Bucle de errores 401 detectado, limpiando credenciales");
          // Solo limpiar token de localStorage si no estamos en login/registro
          if (!endpoint.includes('/login') && !endpoint.includes('/register')) {
            localStorage.removeItem('token');
          }
        }
        
        return { 
          error: true, 
          status: 401,
          message: endpoint.includes('/login') ? 
            'Credenciales incorrectas. Por favor, verifica tu email y contraseña.' : 
            'Sesión expirada. Por favor, inicie sesión nuevamente.'
        };
      }
      
      // Para código 500 - Error de servidor
      if (response.status >= 500) {
        // Detectar bucle de errores 500
        detectAndPreventLoopError('server_500', 10000, 3);
        
        // Para endpoints de datos, devolver array vacío
        if (endpoint.includes('/blog') || endpoint.includes('/property')) {
          return [];
        }
        
        return {
          error: true,
          status: 500,
          message: 'Error interno del servidor. Por favor, intente más tarde.'
        };
      }
      
      // Para código 400 - Error de cliente
      if (response.status === 400) {
        // Si es login, devolver error específico
        return {
          error: true,
          status: 400,
          message: endpoint.includes('/login') ? 
            'Credenciales incorrectas. Por favor, verifica tu email y contraseña.' :
            'Error en la solicitud. Por favor, verifica los datos ingresados.'
        };
      }
      
      // Si el error no fue manejado, intentar analizar la respuesta como JSON
      try {
        const errorJson = await response.json();
        console.error(`Error HTTP ${response.status}:`, errorJson);
        
        // Si hay un mensaje en la respuesta, usarlo
        if (errorJson && errorJson.message) {
          return {
            error: true,
            status: response.status,
            message: errorJson.message
          };
        }
      } catch (jsonError) {
        // Si no es JSON, obtener el texto
        const errorText = await response.text();
        console.error(`Error HTTP ${response.status}:`, errorText);
      }
      
      // Finalmente, si no pudimos manejar mejor el error
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`);
    }
    
    // Procesar respuesta exitosa
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error(`❌ Error en fetchAPI:`, error);
    
    // No reintentar si es un error 401 o 500
    if (error.message && (error.message.includes('401') || error.message.includes('500'))) {
      // Verificar si estamos en un bucle de error 401
      if (error.message.includes('401') && detectAndPreventLoopError('api_401_error', 10000, 3)) {
        console.warn("⚠️ Bucle de errores 401 detectado, limpiando credenciales");
        localStorage.removeItem('token');
        localStorage.removeItem('name');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
      }
      
      // Para login, devolver objeto de error amigable
      if (endpoint.includes('/user/login')) {
        return { 
          error: true,
          message: 'Error de autenticación. Por favor, verifique sus credenciales o intente más tarde.'
        };
      }
      
      // Para otros endpoints, devolver objeto vacío o error según corresponda
      if (endpoint.includes('/blog') || endpoint.includes('/property')) {
        return [];
      }
      
      return { error: true, message: error.message };
    }
    
    // Si es un error de conexión y no hemos reintentado demasiadas veces, reintentar
    if (retryCount < 2 && (
      error.name === 'AbortError' || 
      error.message.includes('network') || 
      error.message.includes('connection')
    )) {
      console.log(`🔄 Reintentando solicitud (${retryCount + 1}/2)...`);
      // Esperar un poco antes de reintentar
      await sleep(1000 * (retryCount + 1));
      return fetchAPI(endpoint, options, retryCount + 1);
    }
    
    // Propagar el error para otros endpoints
    throw error;
  } finally {
    clearTimeout(timeoutId);
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
    const response = await fetch(`${BASE_URL}${endpoint}`);
    return handleResponse(response);
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

// POST request
export const postData = async (endpoint, data) => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
    // Si se proporciona una nueva imagen, actualizar directamente
    if (newImage) {
      if (typeof newImage === 'string') {
        localStorage.setItem('profilePic', newImage);
        return newImage;
      } else if (newImage && typeof newImage === 'object' && newImage.src) {
        localStorage.setItem('profilePic', newImage.src);
        return newImage.src;
      }
      throw new Error('Formato de imagen no válido');
    }

    // Obtener la imagen actual del localStorage
    const currentImage = localStorage.getItem('profilePic');
    if (!currentImage) return null;

    // Verificar si la imagen es una URL válida
    if (typeof currentImage !== 'string' || !currentImage.startsWith('http')) {
      console.warn('URL de imagen de perfil no válida:', currentImage);
      localStorage.removeItem('profilePic');
      return null;
    }

    // Verificar accesibilidad de la imagen
    const isAccessible = await checkImageAccessibility(currentImage);
    if (!isAccessible) {
      console.warn('Imagen de perfil no accesible:', currentImage);
      localStorage.removeItem('profilePic');
      return null;
    }

    return currentImage;
  } catch (error) {
    console.error('Error en syncProfileImage:', error);
    localStorage.removeItem('profilePic');
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
    // Si no hay URL o no es string, no es accesible
    if (!url || typeof url !== 'string') {
      console.log('URL de imagen inválida o no es string:', url);
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
      'api.realestategozamadrid.com',
      'gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'
    ];
    
    // Verificar si la URL pertenece a un dominio confiable
    const isTrustedDomain = trustedDomains.some(domain => url.includes(domain));
    
    // Si la URL contiene "uploads/properties" y es del servidor, verificar con fetch
    // ya que estos archivos pueden no existir (error 404)
    if (url.includes('uploads/properties') && (url.includes('api.realestategozamadrid.com') || 
        url.includes('gozamadrid-api-prod.eba-adypnjgx.eu-west-3.elasticbeanstalk.com'))) {
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