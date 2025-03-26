/**
 * Utilidades específicas para el manejo de imágenes
 * Separado para evitar dependencias circulares
 */

// Imagen de perfil por defecto en base64
export const fallbackImageBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJjdXJyZW50Q29sb3IiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBjbGFzcz0ibHVjaWRlIGx1Y2lkZS11c2VyIj48cGF0aCBkPSJNMjAgMjF2LTJhNCA0IDAgMCAwLTQtNEg4YTQgNCAwIDAgMC00IDR2MiIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iNyIgcj0iNCIvPjwvc3ZnPg==";

// Asegurar que las URL sean HTTPS
export const ensureHttps = (url) => {
  if (!url) return url;
  return url.replace('http://', 'https://');
};

// Función para verificar si una imagen es válida
export const validateAndProcessImage = async (imageSource) => {
  try {
    // Si no hay fuente de imagen, usar la imagen por defecto
    if (!imageSource) return fallbackImageBase64;
    
    // Si ya es un base64, devolverlo directamente
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
      return imageSource;
    }
    
    // Si es un string (URL), asegurar que sea HTTPS
    if (typeof imageSource === 'string') {
      return ensureHttps(imageSource);
    }
    
    // Si es un objeto con src o url
    if (typeof imageSource === 'object') {
      if (imageSource.src) {
        return ensureHttps(imageSource.src);
      }
      if (imageSource.url) {
        return ensureHttps(imageSource.url);
      }
      
      // Si es un objeto File (para subida de archivos)
      if (imageSource instanceof File || 
         (imageSource.type && imageSource.type.startsWith('image/'))) {
        // Devolver la URL para uso temporal
        return URL.createObjectURL(imageSource);
      }
    }
    
    // Si no pudimos procesar la imagen, usar fallback
    console.warn('Imagen no procesable, usando imagen predeterminada');
    return fallbackImageBase64;
  } catch (error) {
    console.error('Error al validar imagen:', error);
    return fallbackImageBase64;
  }
};

export default {
  fallbackImageBase64,
  ensureHttps,
  validateAndProcessImage
}; 