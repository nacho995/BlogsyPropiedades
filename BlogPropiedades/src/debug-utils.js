// debug-utils.js
// Utilidades para depurar problemas de subida de imágenes

/**
 * Realiza una prueba de subida de imagen directamente al endpoint del servidor
 * @param {File} imageFile - Archivo de imagen para probar
 * @param {string} name - Nombre de usuario opcional para actualizar
 * @returns {Promise<Object>} - Resultado de la prueba
 */
export const testImageUpload = async (imageFile, name = '') => {
  console.log("🧪 Iniciando prueba de subida de imagen");
  
  try {
    // Verificar si hay token válido
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        stage: 'pre-request',
        error: 'No hay token de autenticación disponible'
      };
    }
    
    // Crear FormData
    const formData = new FormData();
    
    // Agregar imagen
    if (imageFile) {
      console.log(`Subiendo archivo: ${imageFile.name}, tipo: ${imageFile.type}, tamaño: ${Math.round(imageFile.size / 1024)}KB`);
      formData.append('profilePic', imageFile);
    } else {
      return {
        success: false,
        stage: 'pre-request',
        error: 'No se proporcionó ningún archivo de imagen'
      };
    }
    
    // Agregar nombre si existe
    if (name) {
      formData.append('name', name);
    }
    
    // Determinar URL base
    const isHttps = window.location.protocol === 'https:';
    const API_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
    const API_URL = `${isHttps ? 'https' : 'http'}://${API_DOMAIN}`;
    const endpoint = `${API_URL}/user/update-profile`;
    
    console.log(`Enviando solicitud a: ${endpoint}`);
    console.log(`Protocolo: ${isHttps ? 'HTTPS' : 'HTTP'}`);
    
    // Mostrar contenido del FormData
    console.log("Contenido del FormData:");
    for (let pair of formData.entries()) {
      console.log(`- ${pair[0]}: ${pair[1] instanceof File ? 
        `Archivo: ${pair[1].name} (${pair[1].type}, ${Math.round(pair[1].size / 1024)}KB)` : 
        pair[1]}`);
    }
    
    // Realizar petición
    console.log("Enviando solicitud al servidor...");
    const startTime = Date.now();
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    
    const endTime = Date.now();
    console.log(`Solicitud completada en ${endTime - startTime}ms`);
    
    // Analizar respuesta
    console.log(`Respuesta del servidor: Status ${response.status} ${response.statusText}`);
    
    // Mostrar headers
    console.log("Headers recibidos:");
    response.headers.forEach((value, key) => {
      console.log(`- ${key}: ${value}`);
    });
    
    // Intentar obtener JSON
    let jsonData = null;
    let textData = null;
    
    try {
      // Clonar la respuesta para poder leerla como texto si falla JSON
      const clonedResponse = response.clone();
      
      jsonData = await response.json();
      console.log("Datos JSON recibidos:", jsonData);
    } catch (jsonError) {
      console.warn("No se pudo parsear la respuesta como JSON:", jsonError);
      
      try {
        textData = await response.text();
        console.log("Datos de texto recibidos:", textData);
      } catch (textError) {
        console.error("No se pudo leer la respuesta como texto:", textError);
      }
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      duration: endTime - startTime,
      jsonData,
      textData,
      headers: Object.fromEntries([...response.headers.entries()])
    };
    
  } catch (error) {
    console.error("❌ Error durante la prueba de subida:", error);
    return {
      success: false,
      stage: 'request',
      error: error.message || 'Error desconocido durante la solicitud'
    };
  }
};

/**
 * Verifica el estado de la imagen de perfil en localStorage y contextos
 * @returns {Object} - Estado actual de la imagen de perfil
 */
export const checkProfileImageState = () => {
  try {
    // Recopilar información sobre la imagen de perfil
    const localStorageImage = localStorage.getItem('profilePic');
    const backupImage = localStorage.getItem('profilePic_backup');
    const tempImage = localStorage.getItem('profilePic_temp');
    
    // Verificar valores en los diferentes almacenamientos
    return {
      localStorage: {
        profilePic: localStorageImage ? 
          `${localStorageImage.substring(0, 30)}... (${Math.round(localStorageImage.length / 1024)}KB)` : 
          'No disponible',
        profilePic_backup: backupImage ? 
          `${backupImage.substring(0, 30)}... (${Math.round(backupImage.length / 1024)}KB)` : 
          'No disponible',
        profilePic_temp: tempImage ? 
          `${tempImage.substring(0, 30)}... (${Math.round(tempImage.length / 1024)}KB)` : 
          'No disponible',
      },
      imagesMatch: localStorageImage === backupImage,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error al verificar estado de imagen:", error);
    return { error: error.message };
  }
};

/**
 * Forzar sincronización de imagen mediante evento personalizado
 * @param {string} imageData - Datos de la imagen (base64 o URL)
 * @returns {boolean} - true si se emitió el evento
 */
export const forceProfileImageSync = (imageData) => {
  if (!imageData) {
    console.error("No se proporcionó imagen para sincronizar");
    return false;
  }
  
  try {
    // Guardar en localStorage
    localStorage.setItem('profilePic', imageData);
    localStorage.setItem('profilePic_backup', imageData);
    localStorage.setItem('profilePic_lastUpdate', Date.now().toString());
    
    // Emitir evento de actualización
    window.dispatchEvent(new CustomEvent('profileImageUpdated', {
      detail: { profileImage: imageData, timestamp: Date.now() }
    }));
    
    console.log("Evento de sincronización de imagen emitido manualmente");
    return true;
  } catch (error) {
    console.error("Error al forzar sincronización:", error);
    return false;
  }
}; 