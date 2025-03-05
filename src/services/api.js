// src/services/api.js

// Configuración base
const API_URL = import.meta.env.VITE_API_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * Función para realizar peticiones HTTP con fetch
 * @param {string} endpoint - Endpoint de la API
 * @param {Object} options - Opciones de fetch (method, body, etc)
 * @returns {Promise<any>} - Respuesta de la API
 */
const fetchAPI = async (endpoint, options = {}) => {
  // Añadir token de autenticación si existe
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const url = `${API_URL}${endpoint}`;
  
  try {
    console.log(`Realizando petición ${options.method || 'GET'} a ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      // Clonar la respuesta antes de leerla para evitar el error "body stream already read"
      const clonedResponse = response.clone();
      
      // Intentar obtener el mensaje de error del servidor
      let errorMessage;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || `Error ${response.status}: ${response.statusText}`;
      } catch (e) {
        // Si no podemos obtener un JSON, intentamos obtener el texto
        try {
          errorMessage = await clonedResponse.text();
        } catch (textError) {
          // Si todo falla, usamos el status y statusText
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
      }
      
      console.error(`Error en respuesta del servidor (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }
    
    // Verificar si la respuesta está vacía
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return await response.text();
  } catch (error) {
    console.error(`Error en petición a ${url}:`, error);
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
    return await fetchAPI('/blog', {
      method: 'POST',
      body: JSON.stringify(data)
    });
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
    return await fetchAPI('/blog');
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
    return await fetchAPI(`/blog/${id}`, {
      method: 'DELETE'
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
 * Inicia sesión de un usuario.
 * @param {Object} credentials - Credenciales del usuario (email y password).
 * @returns {Promise<Object>} - Datos del usuario y token.
 */
export const loginUser = async (credentials) => {
  try {
    return await fetchAPI('/user/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  } catch (error) {
    console.error('Error en login:', error);
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
  return await fetchAPI('/reset-password/recover-password', {
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
  return await fetchAPI(`/reset-password/${token}`, {
    method: 'PATCH',
    body: JSON.stringify({ password, passwordConfirm })
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
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    throw error;
  }
};

/**
 * Función para subir imágenes de blogs
 * @param {File} file - Archivo de imagen a subir
 * @param {string} token - Token de autenticación opcional
 * @returns {Promise<Object>} - Promise que se resuelve con la URL de la imagen subida
 */
export const uploadImageBlog = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log("Subiendo imagen de blog a:", `${API_URL}/blog/upload`);
    
    const response = await fetch(`${API_URL}/blog/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Respuesta de error del servidor:", errorText);
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log("Respuesta exitosa del servidor:", data);
    
    return data;
  } catch (error) {
    console.error('Error al subir imagen de blog:', error);
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
  formData.append('images', file); // Cambiar 'file' a 'images' para que coincida con el middleware
  
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Usar la ruta correcta para subir imágenes de propiedades
    console.log("Subiendo archivo a:", `${API_URL}/property/upload`);
    
    const response = await fetch(`${API_URL}/property/upload`, {
      method: 'POST',
      headers,
      body: formData
    });
    
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
    console.log("Enviando datos de propiedad al servidor:", data);
    
    // Volver a la ruta original
    return await fetchAPI('/property', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  } catch (error) {
    console.error('Error detallado al crear propiedad:', error);
    throw error;
  }
};

export const getPropertyPosts = async () => {
  try {
    return await fetchAPI('/property');
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
    return await fetchAPI('/user/profile');
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    throw error;
  }
};