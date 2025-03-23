// src/services/api.js

// Configuración base
const API_URL = import.meta.env.VITE_API_PUBLIC_API_URL || 'http://localhost:3000';

// Asegurarse de que la URL no termine en /
const BASE_URL = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;

/**
 * Realiza peticiones al API con manejo de errores
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de fetch (method, headers, body)
 * @returns {Promise<any>} - Respuesta de la API
 */
export const fetchAPI = async (endpoint, options = {}) => {
    try {
        const url = `${BASE_URL}${endpoint}`;
        console.log(`🚀 Enviando solicitud a: ${url}`);
        console.log('Opciones:', JSON.stringify(options, null, 2));

        // Verificar si el endpoint es para obtener un listado (debería devolver un array)
        const expectsArray = endpoint.includes('/property') || 
                          endpoint.includes('/blog') || 
                          endpoint.includes('/posts') || 
                          endpoint.endsWith('/user');
        
        console.log(`🔍 Endpoint ${endpoint} - ¿Espera un array? ${expectsArray}`);

        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        // Si hay token en localStorage, añadirlo a los headers
        const token = localStorage.getItem('token');
        if (token) {
            defaultHeaders['Authorization'] = `Bearer ${token}`;
        }

        const fetchOptions = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        const response = await fetch(url, fetchOptions);
        console.log(`📥 Respuesta recibida de: ${url}, Status: ${response.status}`);

        // Manejo especial para errores HTTP
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`🔥 Error HTTP ${response.status}: ${errorText}`);
            
            try {
                // Intentar parsear como JSON
                const errorData = JSON.parse(errorText);
                throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
            } catch (jsonError) {
                // Si no es JSON, lanzar error con el texto
                throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
            }
        }

        // Para respuestas vacías o con contenido cero
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || contentLength === null) {
            console.warn('⚠️ Respuesta con contenido vacío');
            
            // Si es endpoint de login y tenemos respuesta vacía, manejar especialmente
            if (endpoint.includes('/user/login')) {
                console.warn('⚠️ Respuesta vacía en login, generando respuesta de contingencia');
                
                // Verificar si hay un token previo
                const existingToken = localStorage.getItem('token');
                if (existingToken) {
                    console.log('🔑 Usando token existente para mantener sesión');
                    return {
                        token: existingToken,
                        user: { email: localStorage.getItem('email') || 'usuario@example.com' },
                        _notice: 'Sesión mantenida con token existente'
                    };
                }
                
                // Generar token temporal
                const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
                return {
                    temporaryToken: tempToken,
                    user: null,
                    isTemporary: true,
                    _notice: 'Sesión temporal creada'
                };
            }
            
            // Si esperamos un array y tenemos respuesta vacía, devolver array vacío
            if (expectsArray) {
                console.warn('⚠️ Se esperaba un array pero la respuesta está vacía, devolviendo []');
                return [];
            }
            
            // Para otros endpoints, devolver objeto vacío
            return {};
        }

        try {
            // Intentar parsear la respuesta como JSON
            const data = await response.json();
            console.log(`📦 Respuesta parseada:`, typeof data === 'object' ? 'Objeto válido' : `Tipo: ${typeof data}`);
            
            // Validar que data sea un objeto o array para evitar errores con métodos como map
            if (data === null) {
                console.warn('⚠️ Respuesta JSON nula');
                return expectsArray ? [] : {};
            }
            
            // Verificar tipo de data para métodos como map
            if (Array.isArray(data)) {
                // Es un array, está bien
                return data;
            } else if (typeof data === 'object') {
                // Es un objeto, pero si esperamos un array y no lo es, crear un wrapper array
                if (expectsArray && !data.items && !data.data && !data.results) {
                    console.warn('⚠️ Se esperaba un array pero se recibió un objeto, intentando convertir');
                    
                    // Intentar encontrar un array dentro del objeto
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            console.log(`🔍 Se encontró un array en la propiedad ${key}`);
                            return data[key];
                        }
                    }
                    
                    // Si el objeto tiene propiedades como id, podría ser un elemento único
                    if (data._id || data.id) {
                        console.log('🔍 Se encontró un único elemento, devolviendo como array');
                        return [data];
                    }
                    
                    console.warn('⚠️ No se encontró un array dentro del objeto, devolviendo array vacío');
                    return [];
                }
                
                // Es un objeto, está bien
                return data;
            } else {
                // No es ni objeto ni array, crear un wrapper
                console.warn(`⚠️ Respuesta con formato inesperado (${typeof data}), creando wrapper`);
                return expectsArray ? [] : { value: data, _warning: 'Respuesta con formato no estándar' };
            }
        } catch (error) {
            console.error('🔥 Error al parsear respuesta JSON:', error);
            
            // Si esperamos un array pero no pudimos parsear la respuesta, devolver array vacío
            if (expectsArray) {
                console.warn('⚠️ Se esperaba un array pero hubo error al parsear, devolviendo []');
                return [];
            }
            
            throw new Error(`Error al procesar la respuesta: ${error.message}`);
        }
    } catch (error) {
        console.error(`🔥 Error en fetchAPI (${endpoint}):`, error);
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
                return {
                    token: existingToken,
                    user: { email: userData.email },
                    _recovered: true
                };
            }
            
            // Generar token temporal
            const tempToken = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
            console.log('🔑 Generando token temporal:', tempToken.substring(0, 15) + '...');
            
            return {
                temporaryToken: tempToken,
                user: { email: userData.email },
                isTemporary: true
            };
        }
        
        // Si la respuesta no tiene token, buscar en diferentes estructuras
        if (response && !response.token) {
            console.warn('⚠️ Respuesta sin token estándar, buscando en otras estructuras');
            
            // Buscar token en diferentes estructuras de respuesta
            if (response.data && response.data.token) {
                return {
                    token: response.data.token,
                    user: response.data.user || { email: userData.email }
                };
            } else if (response.user && response.user.token) {
                return {
                    token: response.user.token,
                    user: response.user
                };
            } else if (response.accessToken) {
                return {
                    token: response.accessToken,
                    user: response.user || { email: userData.email }
                };
            } else if (response.auth && response.auth.token) {
                return {
                    token: response.auth.token,
                    user: response.auth.user || response.user || { email: userData.email }
                };
            }
        }
        
        return response;
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
const API_BASE_URL = 'https://your-api-endpoint.com'; // Update with your actual API URL

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
      throw new Error('No hay token de autenticación');
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
    throw error;
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