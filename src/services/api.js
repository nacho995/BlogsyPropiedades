// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_PUBLIC_API_URL || "http://localhost:4000"

/**
 * Crea un nuevo blog post.
 * @param {Object} data - Datos del blog post.
 * @returns {Promise<Object>}
 */
export async function postBlogPosts(data) {
  const response = await fetch(`${API_BASE_URL}/blog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al crear el blog post')
  }

  return response.json()
}

/**
 * Obtiene todos los blog posts.
 * @returns {Promise<Array>}
 */
export async function getBlogPosts() {
  const response = await fetch(`${API_BASE_URL}/blog`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al obtener los blog posts')
  }

  return response.json()
}

/**
 * Elimina un blog post por su id.
 * @param {string} id - Identificador del blog post.
 * @returns {Promise<string>} - Retorna el ID del blog eliminado
 */
export async function deleteBlogPost(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Error al eliminar el blog post');
    }

    const data = await response.json();
    // Retornamos el ID del blog eliminado para poder actualizar el estado
    return id;
  } catch (error) {
    console.error('Error al eliminar el blog:', error);
    throw error;
  }
}

/**
 * Actualiza un blog post.
 * @param {string} id - Identificador del blog post.
 * @param {Object} data - Datos actualizados del blog post.
 * @returns {Promise<Object>}
 */
export async function updateBlogPost(id, data) {
  const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al actualizar el blog post')
  }

  return response.json()
}

/**
 * Obtiene un blog post por su id.
 * @param {string} id - Identificador del blog post.
 * @returns {Promise<Object>}
 */
export async function getBlogById(id) {
  const response = await fetch(`${API_BASE_URL}/blog/${id}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al obtener el blog post')
  }

  return response.json()
}

/**
 * Registra un nuevo usuario.
 * @param {Object} data - Datos del usuario.
 * @returns {Promise<Object>}
 */
export async function createUser(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al crear el usuario")
    }

    return response.json()
  } catch (error) {
    console.error("Error al crear el usuario:", error)
    throw new Error("Hubo un error al crear el usuario.")
  }
}

/**
 * Inicia sesión de un usuario.
 * @param {Object} credentials - Credenciales del usuario (email y password).
 * @returns {Promise<Object>} - Datos del usuario y token.
 */
export const loginUser = async (credentials) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    
    // Si la respuesta no es exitosa, lanzamos un error con el mensaje del servidor
    if (!response.ok) {
      throw new Error(data.message || 'Error al iniciar sesión');
    }
    
    console.log('Respuesta del servidor:', data);
    return data;
  } catch (error) {
    // Si el error ya tiene un mensaje personalizado, lo usamos
    if (error.message) {
      throw error;
    }
    // Si no, lanzamos un error genérico
    throw new Error('Error de conexión con el servidor');
  }
};

/**
 * Obtiene la lista de usuarios.
 * @returns {Promise<Array>}
 */
export async function getUsers() {
  try {
    const token = localStorage.getItem("token")
    const response = await fetch(`${API_BASE_URL}/user`, {
      headers: {
        // Corregimos el nombre del header a "Authorization" y añadimos el prefijo "Bearer"
        Authorization: `Bearer ${token}`
      }
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Error al obtener los usuarios")
    }
    console.log("response from service api", data)
    return data
  } catch (error) {
    console.error("Error al obtener los usuarios:", error)
    throw new Error("Hubo un error al obtener los usuarios.")
  }
}

/**
 * Solicita el envío de un correo para recuperar la contraseña
 * @param {string} email - Correo electrónico del usuario
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const requestPasswordRecovery = async (email) => {
  const response = await fetch(`${API_BASE_URL}/reset-password/recover-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al solicitar recuperación de contraseña');
  }

  return response.json();
};

/**
 * Restablece la contraseña utilizando el token recibido por correo
 * @param {string} token - Token de recuperación de contraseña
 * @param {string} password - Nueva contraseña
 * @param {string} passwordConfirm - Confirmación de la nueva contraseña
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const resetPassword = async (token, password, passwordConfirm) => {
  const response = await fetch(`${API_BASE_URL}/reset-password/${token}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ password, passwordConfirm })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Error al restablecer la contraseña');
  }

  return response.json();
};

/**
 * Actualiza el perfil del usuario.
 * @param {FormData} formData - Datos del formulario de actualización.
 * @returns {Promise<Object>}
 */
export const updateProfile = async (userData, token) => {
  try {
    console.log("Enviando datos de perfil:", userData);
    
    // Crear FormData para enviar archivos
    const formData = new FormData();
    
    // Añadir campos de texto
    if (userData.name) {
      formData.append('name', userData.name);
    }
    
    // Añadir archivo si existe
    if (userData.profilePic && userData.profilePic instanceof File) {
      formData.append('profilePic', userData.profilePic);
    }
    
    // Configurar opciones de fetch con el token
    const options = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    };
    
    console.log("Opciones de fetch:", {
      method: options.method,
      headers: options.headers,
      bodyType: typeof options.body
    });
    
    // Realizar la petición
    const response = await fetch(`${API_BASE_URL}/user/update-profile`, options);
    
    // Verificar si la respuesta es exitosa
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error en la respuesta:", errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    // Devolver los datos de la respuesta
    return await response.json();
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    throw error; // Re-lanzar el error para manejarlo en el componente
  }
};

/**
 * Función que sube una imagen al servidor.
 * @param {File} file - Archivo de imagen a subir.
 * @returns {Promise<Object>} Promise que se resuelve con la URL de la imagen subida.
 */
export const uploadImageCallBack = (file) => {
  return new Promise((resolve, reject) => {
    // Se crea el objeto FormData y se adjunta el archivo
    const formData = new FormData()
    formData.append('file', file)

    // Se realiza la llamada fetch al endpoint de subida de imagen
    fetch(`${API_BASE_URL}/blog/upload`, {
      method: 'POST',
      body: formData
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            reject(errorData.message || "Error al subir la imagen")
          })
        }
        return response.json()
      })
      .then(result => {
        resolve({ imageUrl: result.imageUrl });
      })
      .catch(error => {
        reject(error)
      })
  })
}
/** 
* @param {Object} data - Datos del blog post.
* @returns {Promise<Object>}
*/
export async function postProperties(data) {
 const response = await fetch(`${API_BASE_URL}/property`, {
   method: 'POST',
   headers: {
     'Content-Type': 'application/json'
   },
   body: JSON.stringify(data)
 })

 if (!response.ok) {
   const errorData = await response.json()
   throw new Error(errorData.message || 'Error al crear la propiedad')
 }

 return response.json()
}

export async function getPropertyPosts() {
    const response = await fetch(`${API_BASE_URL}/property`)
  
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error al obtener los property posts')
    }
  
    return response.json()
  }
  
  /**
   * Elimina un property post por su id.
   * @param {string} id - Identificador del property post.
   * @returns {Promise<Object>}
   */
  export async function deletePropertyPost(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/property/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el property post');
      }

      return await response.json();
    } catch (error) {
      console.error('Error al eliminar la propiedad:', error);
      throw error;
    }
  }
  
  /**
   * Actualiza un property post.
   * @param {string} id - Identificador del property post.
   * @param {Object} data - Datos actualizados del property post.
   * @returns {Promise<Object>}
   */
  export async function updatePropertyPost(id, data) {
    const response = await fetch(`${API_BASE_URL}/property/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
  
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error al actualizar el property post')
    }
  
    return response.json()
  }
  
  /**
   * Obtiene un blog post por su id.
   * @param {string} id - Identificador del blog post.
   * @returns {Promise<Object>}
   */
  export async function getPropertyById(id) {
    const response = await fetch(`${API_BASE_URL}/property/${id}`)
  
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error al obtener el property post')
    }
  
    return response.json()
  }

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
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en getCurrentUser:', errorText);
      throw new Error(`Error al obtener los datos del usuario: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Datos recibidos del usuario:', data);
    return data;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    throw error;
  }
};