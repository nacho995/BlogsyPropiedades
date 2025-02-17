// src/services/api.js

const API_BASE_URL = "http://localhost:3000"

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
 * @returns {Promise<Object>}
 */
export async function deleteBlogPost(id) {
  const response = await fetch(`${API_BASE_URL}/blog/${id}`, {
    method: 'DELETE'
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.message || 'Error al eliminar el blog post')
  }

  return response.json()
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
 * @param {Object} data - Datos para el login.
 * @returns {Promise<Object>}
 */
export async function loginUser(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al iniciar sesión")
    }

    return response.json()
  } catch (error) {
    console.error("Error al iniciar sesión:", error)
    throw new Error("Hubo un error al iniciar sesión.")
  }
}

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
 * Solicita el reseteo de contraseña.
 * @param {string} email - Correo del usuario.
 * @returns {Promise<Object>}
 */
export const requestPasswordReset = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/request-reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al solicitar reseteo")
    }

    return response.json()
  } catch (err) {
    throw new Error("Error al solicitar reseteo: " + err.message)
  }
}

/**
 * Resetea la contraseña.
 * @param {string} token - Token de reseteo.
 * @param {string} newPassword - Nueva contraseña.
 * @returns {Promise<Object>}
 */
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/user/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al cambiar la contraseña")
    }

    return response.json()
  } catch (err) {
    throw new Error("Error al cambiar la contraseña: " + err.message)
  }
}

/**
 * Actualiza el perfil del usuario.
 * @param {FormData} formData - Datos del formulario de actualización.
 * @returns {Promise<Object>}
 */
export const updateProfile = async (formData) => {
  try {
    const token = localStorage.getItem("token")
    // NOTA: Al enviar FormData no es necesario establecer el header "Content-Type"
    const response = await fetch(`${API_BASE_URL}/user/update-profile`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || "Error al actualizar el perfil")
    }
    return response.json()
  } catch (err) {
    console.error("Error al actualizar el perfil:", err)
    throw new Error("Error al actualizar el perfil: " + err.message)
  }
}

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
    const response = await fetch(`${API_BASE_URL}/property/${id}`, {
      method: 'DELETE'
    })
  
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error al eliminar el property post')
    }
  
    return response.json()
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