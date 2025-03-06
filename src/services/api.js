// src/services/api.js

// Configuración base
const API_URL = import.meta.env.VITE_API_PUBLIC_API_URL || 'http://localhost:4000';

// Mover handleResponse fuera de fetchAPI para que sea accesible por todas las funciones
const handleResponse = async (response) => {
  if (response.status === 401) {
    // Token expirado o inválido
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('name');
    localStorage.removeItem('profilePic');
    window.dispatchEvent(new Event('logout'));
    throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error en la solicitud');
  }
  
  return response.json();
};

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
    
    // Verificar si el token expiró (401)
    if (response.status === 401) {
      console.log("📢 Token posiblemente expirado");
      
      // En lugar de redireccionar directamente, emitir un evento para que el contexto decida
      const event = new CustomEvent('session-expired', {
        detail: { message: 'Tu sesión ha expirado' }
      });
      window.dispatchEvent(event);
      
      throw new Error('Sesión expirada');
    }
    
    // Verificar si la respuesta está vacía
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await handleResponse(response);
    }
    
    return await response.text();
  } catch (error) {
    console.error('Error en fetchAPI:', error.message);
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
 * Actualiza el perfil del usuario de manera que funcione en múltiples dispositivos
 */
export const updateProfile = async (userData) => {
  console.log("📸 INICIO updateProfile con datos:", userData);
  const formData = new FormData();
  
  if (userData.name) {
    formData.append('name', userData.name);
    console.log("👤 Actualizando nombre:", userData.name);
  }
  
  // Guardar imagen para que funcione en todos los dispositivos
  if (userData.profilePic && userData.profilePic instanceof File) {
    console.log("🖼️ Procesando imagen para subir:", userData.profilePic.name, "tamaño:", (userData.profilePic.size/1024).toFixed(2) + "KB");
    
    // Añadir imagen al FormData para enviar al servidor
    formData.append('profilePic', userData.profilePic);
    
    // Crear una copia local de la imagen como respaldo
    try {
      // Crear un FileReader para leer la imagen como URL
      const lector = new FileReader();
      
      // Crear una promesa para esperar a que termine de leer
      const promesaImagen = new Promise(resolver => {
        lector.onloadend = () => resolver(lector.result);
        lector.readAsDataURL(userData.profilePic);
      });
      
      // Esperar a que termine de leer la imagen
      const imagenLocal = await promesaImagen;
      console.log("📦 Imagen convertida a data URL, longitud:", imagenLocal.length);
      
      // Guardar en localStorage para poder usarla si falla la carga
      localStorage.setItem('profilePic_local', imagenLocal);
      
      // También guardar cuándo fue actualizada
      localStorage.setItem('profilePic_actualizada', new Date().toString());
      
      console.log("✅ Imagen guardada localmente como respaldo");
    } catch (error) {
      console.log("❌ No se pudo guardar imagen local:", error);
    }
  } else {
    console.log("⚠️ No hay imagen para subir o no es un archivo válido");
  }
  
  try {
    const token = localStorage.getItem('token');
    console.log("🔑 Token disponible:", token ? "Sí (longitud: " + token.length + ")" : "No");
    
    if (!token) {
      throw new Error("No hay token disponible");
    }
    
    // Añadir timestamp para evitar caché
    const timestamp = Date.now();
    console.log("🕒 Enviando petición al servidor con timestamp:", timestamp);
    
    const response = await fetch(`${API_URL}/user/update-profile?t=${timestamp}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    console.log("📡 Respuesta del servidor:", response.status, response.statusText);
    
    if (!response.ok) {
      console.warn("❌ Error del servidor:", response.status, response.statusText);
      
      // Si hay error en el servidor, usar datos locales como respaldo
      const errorBody = await response.text();
      console.log("📄 Cuerpo del error:", errorBody);
      
      const respaldoLocal = {
        name: userData.name || localStorage.getItem('name') || '',
        profilePic: localStorage.getItem('profilePic_local') || ''
      };
      console.log("🚨 Usando respaldo local:", respaldoLocal);
      
      return respaldoLocal;
    }
    
    const result = await response.json();
    console.log("✅ Datos recibidos del servidor:", result);
    
    // Actualizar localStorage con los nuevos datos
    const profilePic = result.profileImage || result.profilePic || localStorage.getItem('profilePic_local') || '';
    console.log("🖼️ URL de imagen actualizada:", profilePic);
    
    localStorage.setItem('profilePic', profilePic);
    console.log("📦 profilePic guardado en localStorage");
    
    // Actualizar objeto usuario en localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        console.log("👤 Datos actuales de user en localStorage:", user);
        
        user.profilePic = profilePic;
        user.lastUpdated = new Date().toISOString(); // Añadir timestamp
        localStorage.setItem('user', JSON.stringify(user));
        
        console.log("✅ user actualizado en localStorage");
      } catch (e) {
        console.error("❌ Error al actualizar user en localStorage:", e);
      }
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error completo al actualizar perfil:', error);
    
    // En caso de error, devolver datos locales como respaldo
    const respaldoEmergencia = {
      name: userData.name || localStorage.getItem('name') || '',
      profilePic: localStorage.getItem('profilePic_local') || ''
    };
    
    console.log("🆘 Devolviendo respaldo de emergencia:", respaldoEmergencia);
    return respaldoEmergencia;
  }
}

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
  formData.append('images', file);
  
  try {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    // No hay una ruta específica para subir archivos en propertyRouter
    // Debe usarse la ruta principal con propiedad vacía
    console.log("Subiendo archivo a:", `${API_URL}/property`);
    
    const response = await fetch(`${API_URL}/property`, {
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
    const response = await fetch(`${API_URL}/property/${id}`);
    return handleResponse(response);
  } catch (error) {
    console.error(`Error al obtener propiedad ${id}:`, error);
    throw error;
  }
};

/**
 * Obtiene los datos del usuario actual con diagnóstico
 */
export const getCurrentUser = async (tokenParam) => {
  console.log("🔍 INICIO getCurrentUser");
  
  const token = tokenParam || localStorage.getItem('token');
  console.log("🔑 Token disponible:", token ? "Sí (longitud: " + token.length + ")" : "No");
  
  if (!token) {
    console.log("❌ No hay token, no se puede obtener usuario");
    throw new Error('No hay token de autenticación');
  }

  try {
    // Añadir timestamp para evitar caché
    const timestamp = Date.now();
    console.log("🕒 Obteniendo usuario con timestamp:", timestamp);
    
    const response = await fetch(`${API_URL}/user/me?t=${timestamp}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log("📡 Respuesta al obtener usuario:", response.status, response.statusText);
    
    if (!response.ok) {
      // Si hay error del servidor, usar datos de localStorage como respaldo
      console.warn(`❌ Error ${response.status} al obtener usuario.`);
      
      const localData = {
        name: localStorage.getItem('name') || '',
        profilePic: localStorage.getItem('profilePic') || localStorage.getItem('profilePic_local') || '',
        _fromLocalStorage: true
      };
      
      console.log("🚨 Usando datos locales para usuario:", localData);
      return localData;
    }
    
    const userData = await response.json();
    console.log("✅ Datos de usuario recibidos del servidor:", userData);
    
    // Diagnóstico de fuentes de imagen
    console.log("🔍 Fuentes de imagen disponibles:");
    console.log("  - userData.profilePic:", userData.profilePic || "no disponible");
    console.log("  - userData.profileImage:", userData.profileImage || "no disponible");
    console.log("  - localStorage.profilePic:", localStorage.getItem('profilePic') || "no disponible");
    console.log("  - localStorage.profilePic_local:", localStorage.getItem('profilePic_local') || "no disponible");
    
    // Actualizar localStorage con los datos más recientes
    if (userData.profilePic || userData.profileImage) {
      localStorage.setItem('profilePic', userData.profilePic || userData.profileImage || '');
      console.log("📦 profilePic actualizado en localStorage:", userData.profilePic || userData.profileImage);
    }
    if (userData.name) {
      localStorage.setItem('name', userData.name);
      console.log("📦 name actualizado en localStorage:", userData.name);
    }
    
    return userData;
  } catch (error) {
    console.error('❌ Error completo en getCurrentUser:', error);
    
    // En caso de error de red, usar datos locales
    const respaldoEmergencia = {
      name: localStorage.getItem('name') || '',
      profilePic: localStorage.getItem('profilePic') || localStorage.getItem('profilePic_local') || '',
      _fromLocalStorage: true
    };
    
    console.log("🆘 Devolviendo respaldo de emergencia para usuario:", respaldoEmergencia);
    return respaldoEmergencia;
  }
};

/**
 * Verifica si el token actual es válido
 * @returns {Promise<Object>} Respuesta del servidor
 */
export const verifyToken = async () => {
  try {
    return await fetchAPI('/user/verify-token');
  } catch (error) {
    console.error('Error al verificar token:', error);
    throw error;
  }
};