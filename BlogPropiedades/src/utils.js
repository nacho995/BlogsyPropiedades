/**
 * Archivo de utilidades generales para la aplicación
 */

// Función para detectar errores repetitivos
export const detectAndPreventLoopError = (errorKey, timeout = 5000, maxCount = 5) => {
  try {
    const now = Date.now();
    const recentErrors = JSON.parse(localStorage.getItem(`recentErrors_${errorKey}`) || '[]');
    
    // Filtrar para mantener solo errores recientes
    const veryRecentErrors = recentErrors.filter(time => (now - time) < timeout);
    
    // Guardar el registro del nuevo error
    veryRecentErrors.push(now);
    
    // Mantener solo los últimos 20 errores
    if (veryRecentErrors.length > 20) {
      veryRecentErrors.splice(0, veryRecentErrors.length - 20);
    }
    
    // Guardar la lista actualizada
    localStorage.setItem(`recentErrors_${errorKey}`, JSON.stringify(veryRecentErrors));
    
    // Detectar si hay demasiados errores en poco tiempo
    if (veryRecentErrors.length >= maxCount) {
      console.error(`Bucle de errores detectado para: ${errorKey}`);
      localStorage.removeItem(`recentErrors_${errorKey}`);
      return true; // Bucle detectado
    }
    
    return false; // No hay bucle
  } catch (error) {
    console.error('Error en detectAndPreventLoopError:', error);
    return false;
  }
};

// Función para combinar URLs
export const combineUrls = (baseUrl, relativeUrl) => {
  if (!baseUrl) return relativeUrl;
  if (!relativeUrl) return baseUrl;
  
  const base = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const relative = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
  
  return `${base}${relative}`;
};

// Para usar en lugar de ErrorHandler en los componentes
export default {
  detectAndPreventLoopError,
  combineUrls
};

// Debug utility
export const debugElement = (element, description = 'Debug') => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${description}]`, element);
  }
};

// Get image URL with fallback
export const getImageUrl = (imageSrc) => {
  if (!imageSrc || typeof imageSrc !== 'string') {
    return 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
  }
  
  // URL completa
  if (imageSrc.startsWith('http://') || imageSrc.startsWith('https://')) {
    return imageSrc;
  }
  
  // Para Cloudinary
  if (imageSrc.includes('cloudinary.com')) {
    return imageSrc.startsWith('//') ? `https:${imageSrc}` : imageSrc;
  }
  
  // Para rutas relativas
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  if (imageSrc.startsWith('/uploads/') || imageSrc.startsWith('uploads/')) {
    const cleanPath = imageSrc.startsWith('/') ? imageSrc : `/${imageSrc}`;
    return `${baseURL}${cleanPath}`;
  }
  
  return imageSrc;
};

// Property image utility
export const getPropertyImageUrl = (property) => {
  // Array de imágenes
  if (property.images && Array.isArray(property.images) && property.images.length > 0) {
    const firstImage = property.images[0];
    if (typeof firstImage === 'object' && firstImage.src) {
      return getImageUrl(firstImage.src);
    } else if (typeof firstImage === 'string') {
      return getImageUrl(firstImage);
    }
  }
  
  // Imagen principal
  if (property.image) {
    if (typeof property.image === 'object' && property.image.src) {
      return getImageUrl(property.image.src);
    } else if (typeof property.image === 'string') {
      return getImageUrl(property.image);
    }
  }
  
  return 'https://via.placeholder.com/400x300?text=Imagen+no+disponible';
};

// Función para formatear precios
export const formatPrice = (price) => {
  if (!price && price !== 0) return '€0';
  
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numericPrice)) return '€0';
  
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(numericPrice);
};

// Función para parsear precio con separadores de miles
export const parsePrice = (priceString) => {
  if (!priceString) return '';
  
  // Convertir a string si es número
  const value = priceString.toString();
  
  // Permitir solo números y puntos/comas como separadores
  const numericValue = value.replace(/[^\d,.]/g, '');
  
  // Convertir separadores europeos (punto como separador de miles, coma como decimal) a formato estándar
  let processedValue = numericValue;
  
  // Si hay una coma al final, la mantenemos para permitir decimales
  if (numericValue.includes(',')) {
    // Dividir en parte entera y decimal
    const parts = numericValue.split(',');
    if (parts.length === 2) {
      // Parte entera: remover puntos (separadores de miles)
      const integerPart = parts[0].replace(/\./g, '');
      // Parte decimal: máximo 2 dígitos
      const decimalPart = parts[1].substring(0, 2);
      processedValue = `${integerPart}.${decimalPart}`;
    } else {
      // Solo parte entera
      processedValue = parts[0].replace(/\./g, '');
    }
  } else {
    // Solo números y puntos (tratarlos como separadores de miles)
    processedValue = numericValue.replace(/\./g, '');
  }
  
  return processedValue;
};

// Función para formatear precio para vista previa (durante la escritura)
export const formatPricePreview = (price) => {
  if (!price) return '';
  
  const numericPrice = parseFloat(price.toString().replace(/[^\d.]/g, ''));
  if (isNaN(numericPrice)) return price;
  
  return new Intl.NumberFormat('es-ES').format(numericPrice);
}; 