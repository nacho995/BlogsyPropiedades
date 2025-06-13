// Service Worker para interceptar y corregir URLs incorrectas
const APP_DOMAIN = 'blogs.realestategozamadrid.com';
const OLD_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';

// Rutas que necesitan ser redirigidas
const ROUTES_TO_FIX = [
  '/blogs',
  '/properties',
  '/auth/me',
  '/user/profile-image'
];

self.addEventListener('install', (event) => {
  console.log('🛠️ [ServiceWorker] Instalado');
  self.skipWaiting(); // Forzar activación inmediata
});

self.addEventListener('activate', (event) => {
  console.log('🚀 [ServiceWorker] Activado');
  event.waitUntil(clients.claim()); // Tomar control de las páginas inmediatamente
});

// Función para verificar si una URL necesita ser interceptada
function needsIntercept(url) {
  const urlObj = new URL(url);
  
  // Solo interceptar peticiones al dominio antiguo
  if (urlObj.hostname === OLD_DOMAIN) {
    return true;
  }
  
  // O rutas específicas que sabemos que fallan
  if (urlObj.hostname === APP_DOMAIN) {
    return ROUTES_TO_FIX.some(route => urlObj.pathname === route);
  }
  
  return false;
}

// Función para corregir URLs
function fixUrl(url) {
  try {
    const urlObj = new URL(url);
    
    // Corregir dominio si es necesario
    if (urlObj.hostname === OLD_DOMAIN) {
      urlObj.hostname = APP_DOMAIN;
    }
    
    // Corregir rutas específicas
    if (urlObj.pathname === '/blogs') {
      urlObj.pathname = '/api/blogs';
    } else if (urlObj.pathname === '/properties') {
      urlObj.pathname = '/api/properties';
    } else if (urlObj.pathname === '/auth/me') {
      urlObj.pathname = '/api/user/me';
    } else if (urlObj.pathname === '/user/profile-image') {
      urlObj.pathname = '/api/user/profile-image';
    } else if (!urlObj.pathname.startsWith('/api/') && 
              (urlObj.pathname.startsWith('/blogs/') || 
               urlObj.pathname.startsWith('/properties/') || 
               urlObj.pathname.startsWith('/auth/') || 
               urlObj.pathname.startsWith('/user/'))) {
      // Agregar prefijo api a otras rutas que lo necesiten
      urlObj.pathname = `/api${urlObj.pathname}`;
    }
    
    return urlObj.toString();
  } catch (error) {
    console.error('❌ [ServiceWorker] Error al corregir URL:', error);
    return url; // Devolver URL original en caso de error
  }
}

// Interceptar todas las peticiones fetch
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Si la URL necesita ser interceptada
  if (needsIntercept(url)) {
    const correctedUrl = fixUrl(url);
    
    // Solo modificar si la URL ha cambiado
    if (correctedUrl !== url) {
      console.log(`🔄 [ServiceWorker] Redirigiendo: ${url} -> ${correctedUrl}`);
      
      // Crear nueva petición con la URL corregida pero manteniendo el resto de opciones
      const newRequest = new Request(correctedUrl, {
        method: event.request.method,
        headers: event.request.headers,
        body: event.request.body,
        mode: 'cors', // Permitir CORS para el nuevo dominio
        credentials: event.request.credentials,
        cache: event.request.cache,
        redirect: event.request.redirect
      });
      
      // Responder con la nueva petición
      event.respondWith(fetch(newRequest));
      return;
    }
  }
  
  // Para el resto de peticiones, comportamiento normal
  // Sin este return, el service worker bloquearía todas las peticiones
  return;
});

// Notificar cuando el service worker recibe un mensaje
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('🛡️ [ServiceWorker] Archivo cargado');
