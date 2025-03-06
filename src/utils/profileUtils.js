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
  
  let imageUrl = null;
  
  // Caso 1: profilePic es un string directo
  if (typeof user.profilePic === 'string') {
    imageUrl = user.profilePic;
  } 
  // Caso 2: profilePic es un objeto con src
  else if (user.profilePic && user.profilePic.src) {
    imageUrl = user.profilePic.src;
  } 
  // Caso 3: profilePic es un objeto con url
  else if (user.profilePic && user.profilePic.url) {
    imageUrl = user.profilePic.url;
  }
  // Caso 4: existe profileImage como alternativa
  else if (user.profileImage) {
    if (typeof user.profileImage === 'string') {
      imageUrl = user.profileImage;
    } else if (user.profileImage.src) {
      imageUrl = user.profileImage.src;
    } else if (user.profileImage.url) {
      imageUrl = user.profileImage.url;
    }
  }
  
  // Si no encontramos ninguna imagen, usar la predeterminada
  if (!imageUrl) {
    return defaultImage;
  }
  
  // Asegurar HTTPS
  return ensureHttps(imageUrl);
}; 