// Funciones de utilidad para manejar la imagen de perfil

/**
 * Convierte las URLs HTTP a HTTPS
 */
export const ensureHttps = (url) => {
  if (!url) return null;
  return typeof url === 'string' ? url.replace('http://', 'https://') : url;
};

/**
 * Extrae y normaliza la URL de la imagen de perfil
 */
export const getProfileImageUrl = (user, defaultImage) => {
  if (!user) return defaultImage;
  
  console.log("Analizando imagen de usuario:", user.name);
  
  let imageUrl = null;
  
  // Caso 1: profilePic es un string directo
  if (typeof user.profilePic === 'string') {
    console.log("Imagen encontrada como string directo");
    imageUrl = user.profilePic;
  } 
  // Caso 2: profilePic es un objeto
  else if (user.profilePic && typeof user.profilePic === 'object') {
    console.log("Imagen encontrada como objeto, propiedades:", Object.keys(user.profilePic));
    
    // Intentar obtener la URL de diferentes propiedades
    if (user.profilePic.src) {
      console.log("Usando propiedad src:", user.profilePic.src);
      imageUrl = user.profilePic.src;
    } else if (user.profilePic.url) {
      console.log("Usando propiedad url:", user.profilePic.url);
      imageUrl = user.profilePic.url;
    } else if (user.profilePic.secure_url) {
      console.log("Usando propiedad secure_url:", user.profilePic.secure_url);
      imageUrl = user.profilePic.secure_url;
    } else {
      // Iterar sobre todas las propiedades buscando algo que parezca una URL
      for (const key in user.profilePic) {
        if (typeof user.profilePic[key] === 'string' && 
            (user.profilePic[key].startsWith('http') || 
             user.profilePic[key].includes('upload'))) {
          console.log(`Encontrada URL en propiedad ${key}:`, user.profilePic[key]);
          imageUrl = user.profilePic[key];
          break;
        }
      }
    }
  }
  
  // Si no encontramos nada, intentar con profileImage
  if (!imageUrl && user.profileImage) {
    console.log("Intentando con profileImage");
    if (typeof user.profileImage === 'string') {
      imageUrl = user.profileImage;
    } else if (user.profileImage && typeof user.profileImage === 'object') {
      if (user.profileImage.url) imageUrl = user.profileImage.url;
      else if (user.profileImage.src) imageUrl = user.profileImage.src;
    }
  }
  
  // Buscar en localStorage como último recurso
  if (!imageUrl) {
    const storedProfilePic = localStorage.getItem('profilePic');
    if (storedProfilePic) {
      console.log("Usando imagen almacenada en localStorage");
      imageUrl = storedProfilePic;
    }
  }
  
  // Si no encontramos ninguna imagen, usar la predeterminada
  if (!imageUrl) {
    console.log("No se encontró imagen, usando imagen por defecto");
    return defaultImage;
  }
  
  // Asegurar HTTPS
  console.log("URL final de imagen:", ensureHttps(imageUrl));
  return ensureHttps(imageUrl);
}; 