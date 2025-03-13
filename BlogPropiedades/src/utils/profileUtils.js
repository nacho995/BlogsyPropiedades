// Funciones de utilidad para manejar la imagen de perfil

// Imagen base64 pequeña como respaldo (avatar genérico azul)
export const fallbackImageBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM0OThkYiIvPjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSI0MCIgZmlsbD0iI2VjZjBmMSIvPjxwYXRoIGQ9Ik0xNjAgMTgwYzAtMzMuMTM3LTI2Ljg2My02MC02MC02MHMtNjAgMjYuODYzLTYwIDYweiIgZmlsbD0iI2VjZjBmMSIvPjwvc3ZnPg==";

/**
 * Convierte las URLs HTTP a HTTPS
 */
export const ensureHttps = (url) => {
  if (!url) return null;
  if (typeof url === 'string' && url.trim() === '') return null;
  if (typeof url === 'string' && url.startsWith('data:')) return url;
  if (typeof url === 'string' && url.startsWith('http:')) {
    return url.replace('http:', 'https:');
  }
  return url;
};

/**
 * Verifica si una URL es accesible - versión simplificada que evita problemas de CORS
 * En lugar de intentar verificar la accesibilidad, simplemente asumimos que las URLs
 * de ciertos dominios confiables son accesibles y las demás no.
 */
export const isImageUrlAccessible = async (url) => {
  // Si no hay URL o no es string, no es accesible
  if (!url || typeof url !== 'string') return false;
  
  // Las URLs de datos (base64) siempre son accesibles
  if (url.startsWith('data:')) return true;
  
  // Convertir a HTTPS si es HTTP
  url = ensureHttps(url);
  
  // Lista de dominios confiables
  const trustedDomains = [
    'cloudinary.com',
    'res.cloudinary.com',
    'images.unsplash.com',
    'goza-madrid.onrender.com'
  ];
  
  // Verificar si la URL pertenece a un dominio confiable
  return trustedDomains.some(domain => url.includes(domain));
};

/**
 * Extrae y normaliza la URL de la imagen de perfil
 */
export const getProfileImageUrl = (user, defaultImage) => {
  // Si no hay usuario, mostrar imagen por defecto
  if (!user) return fallbackImageBase64;
  
  // 1. Probar primero si profilePic es string
  if (typeof user.profilePic === 'string') {
    return ensureHttps(user.profilePic) || fallbackImageBase64;
  }
  
  // 2. Probar si profilePic es objeto con propiedad src
  if (user.profilePic && user.profilePic.src) {
    return ensureHttps(user.profilePic.src) || fallbackImageBase64;
  }
  
  // 3. Intentar con localStorage como respaldo
  const storedImage = localStorage.getItem('profilePic');
  if (storedImage) {
    return ensureHttps(storedImage) || fallbackImageBase64;
  }
  
  // 4. Si nada funciona, usar imagen por defecto o fallback
  return defaultImage || fallbackImageBase64;
};

/**
 * Convierte una imagen URL a base64
 * @param {string} url - URL de la imagen a convertir
 * @returns {Promise<string>} - Imagen en formato base64
 */
export const convertImageToBase64 = (url) => {
  return new Promise((resolve, reject) => {
    // Si ya es base64, devolverla directamente
    if (url && url.startsWith('data:')) {
      resolve(url);
      return;
    }
    
    // Si no es una URL válida, devolver la imagen por defecto
    if (!url || typeof url !== 'string' || url.trim() === '') {
      resolve(fallbackImageBase64);
      return;
    }
    
    // Asegurar que la URL sea HTTPS
    const secureUrl = ensureHttps(url);
    
    // Crear un elemento de imagen para cargar la URL
    const img = new Image();
    
    // Configurar un timeout para evitar esperar demasiado
    const timeout = setTimeout(() => {
      console.log('Timeout al convertir imagen a base64');
      resolve(fallbackImageBase64);
    }, 5000);
    
    img.crossOrigin = 'Anonymous'; // Intentar evitar problemas de CORS
    
    img.onload = () => {
      clearTimeout(timeout);
      
      try {
        // Crear un canvas para dibujar la imagen
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Dibujar la imagen en el canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Convertir el canvas a base64
        const dataURL = canvas.toDataURL('image/png');
        
        // Guardar en localStorage como respaldo
        localStorage.setItem('profilePic_base64', dataURL);
        
        resolve(dataURL);
      } catch (error) {
        console.error('Error al convertir imagen a base64:', error);
        resolve(fallbackImageBase64);
      }
    };
    
    img.onerror = () => {
      clearTimeout(timeout);
      console.log('Error al cargar imagen para convertir a base64');
      resolve(fallbackImageBase64);
    };
    
    img.src = secureUrl;
  });
};

/**
 * Verifica si una imagen es válida y accesible, y la convierte a base64 si es necesario
 * @param {string} url - URL de la imagen a verificar
 * @returns {Promise<string>} - URL de la imagen verificada o imagen por defecto
 */
export const validateAndProcessImage = async (url) => {
  // Si no hay URL, devolver la imagen por defecto
  if (!url) {
    console.log('URL de imagen vacía, usando imagen por defecto');
    return fallbackImageBase64;
  }
  
  // Si ya es base64, devolverla directamente
  if (url.startsWith('data:')) {
    console.log('La imagen ya está en formato base64, devolviéndola directamente');
    return url;
  }
  
  try {
    // Verificar si la URL es accesible
    console.log('Verificando accesibilidad de la imagen:', url);
    
    // Verificar si la URL pertenece a un dominio confiable
    const isAccessible = await isImageUrlAccessible(url);
    
    if (isAccessible) {
      console.log('La imagen es accesible, intentando convertir a base64');
      
      // Intentar convertir a base64 para evitar problemas de CORS
      try {
        const base64Image = await convertImageToBase64(url);
        
        // Verificar si la conversión fue exitosa
        if (base64Image && base64Image !== fallbackImageBase64) {
          console.log('Conversión a base64 exitosa');
          
          // Guardar en localStorage como respaldo
          localStorage.setItem('profilePic_base64', base64Image);
          
          return base64Image;
        } else {
          console.log('La conversión a base64 devolvió la imagen por defecto, intentando usar URL directa');
          
          // Si la conversión falló pero la URL es accesible, intentar usar la URL directa
          return ensureHttps(url);
        }
      } catch (error) {
        console.error('Error al convertir imagen a base64:', error);
        
        // Verificar si la URL es HTTPS
        const secureUrl = ensureHttps(url);
        
        // Guardar la URL segura en localStorage
        localStorage.setItem('profilePic_url', secureUrl);
        
        return secureUrl;
      }
    } else {
      console.log('La imagen no es accesible, buscando alternativas');
      
      // Si no es accesible, intentar usar una copia local
      const localImage = localStorage.getItem('profilePic_base64');
      if (localImage) {
        console.log('Usando imagen base64 local guardada');
        return localImage;
      }
      
      // Si no hay copia local, intentar con la URL guardada
      const savedUrl = localStorage.getItem('profilePic_url');
      if (savedUrl && savedUrl !== url) {
        console.log('Intentando con URL guardada previamente:', savedUrl);
        
        // Verificar si la URL guardada es accesible
        const isSavedUrlAccessible = await isImageUrlAccessible(savedUrl);
        if (isSavedUrlAccessible) {
          console.log('La URL guardada es accesible');
          return savedUrl;
        }
      }
      
      console.log('No se encontraron alternativas válidas, usando imagen por defecto');
      return fallbackImageBase64;
    }
  } catch (error) {
    console.error('Error al validar imagen:', error);
    
    // Intentar usar imagen base64 local
    const localImage = localStorage.getItem('profilePic_base64');
    if (localImage) {
      console.log('Error en validación, usando imagen base64 local');
      return localImage;
    }
    
    console.log('No hay imagen local disponible, usando imagen por defecto');
    return fallbackImageBase64;
  }
}; 