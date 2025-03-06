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
  // Si no hay usuario, mostrar imagen por defecto
  if (!user) return defaultImage;
  
  // 1. Probar primero si profilePic es string
  if (typeof user.profilePic === 'string') {
    return ensureHttps(user.profilePic);
  }
  
  // 2. Probar si profilePic es objeto con propiedad src
  if (user.profilePic && user.profilePic.src) {
    return ensureHttps(user.profilePic.src);
  }
  
  // 3. Intentar con localStorage como respaldo
  const storedImage = localStorage.getItem('profilePic');
  if (storedImage) {
    return ensureHttps(storedImage);
  }
  
  // 4. Si nada funciona, usar imagen por defecto
  return defaultImage;
}; 