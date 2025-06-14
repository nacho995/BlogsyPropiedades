// Service Worker para interceptar y corregir todas las solicitudes de red
// Esta es la solución más radical posible para corregir el problema

const OLD_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
const NEW_DOMAIN = 'blogs.realestategozamadrid.com';
const VERSION = '1.0.2'; // Versión para control de actualizaciones

// Almacenamos la versión para evitar múltiples recargas
const CACHE_NAME = 'api-fix-cache-v2';

// Activar el service worker tan pronto como se instale
self.addEventListener('install', (event) => {
  console.log(`🚀 [SW-FINAL] Service Worker instalado (${VERSION})`);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Guardar versión en cache para control de actualizaciones
      return cache.put('version', new Response(VERSION));
    })
  );
  
  // No forzar activación - permitir que el navegador lo controle
});

self.addEventListener('activate', (event) => {
  console.log(`✅ [SW-FINAL] Service Worker activado (${VERSION})`);
  
  // Limpiar cachés antiguas
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('api-fix-cache-') && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
  
  // No forzamos claims() para evitar recargas en bucle
});

// Interceptar TODAS las solicitudes de red
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Si es una solicitud al dominio antiguo, reescribirla
  if (url.hostname === OLD_DOMAIN) {
    // Crear una nueva URL con el dominio correcto
    const newUrl = new URL(event.request.url);
    newUrl.hostname = NEW_DOMAIN;
    
    // Corregir las rutas específicas
    if (url.pathname === '/blogs') {
      newUrl.pathname = '/api/blogs';
      console.log(`🔄 [SW-FINAL] Redirigiendo: ${url.href} → ${newUrl.href}`);
    } 
    else if (url.pathname === '/properties') {
      newUrl.pathname = '/api/properties';
      console.log(`🔄 [SW-FINAL] Redirigiendo: ${url.href} → ${newUrl.href}`);
    }
    else if (url.pathname === '/user/profile-image') {
      newUrl.pathname = '/api/user/profile-image';
      console.log(`🔄 [SW-FINAL] Redirigiendo: ${url.href} → ${newUrl.href}`);
    }
    else if (url.pathname === '/auth/me') {
      newUrl.pathname = '/api/user/me';
      console.log(`🔄 [SW-FINAL] Redirigiendo: ${url.href} → ${newUrl.href}`);
    }
    else {
      // Si no es una ruta específica, agregar /api al inicio de la ruta
      newUrl.pathname = '/api' + url.pathname;
      console.log(`🔄 [SW-FINAL] Redirigiendo genérica: ${url.href} → ${newUrl.href}`);
    }
    
    // Crear una nueva solicitud con la URL corregida
    const newRequest = new Request(newUrl.href, {
      method: event.request.method,
      headers: event.request.headers,
      body: event.request.body,
      mode: 'cors',
      credentials: 'include',
      redirect: 'follow'
    });
    
    // Responder con la nueva solicitud
    event.respondWith(
      fetch(newRequest)
        .then(response => {
          console.log(`✅ [SW-FINAL] Respuesta correcta para: ${newUrl.href}`);
          return response;
        })
        .catch(error => {
          console.error(`❌ [SW-FINAL] Error al recuperar: ${newUrl.href}`, error);
          // Reintento con otra variante de ruta en caso de error
          if (!newUrl.pathname.includes('/api') && !newUrl.pathname.endsWith('/')) {
            const retryUrl = new URL(newUrl.href);
            retryUrl.pathname = '/api' + retryUrl.pathname;
            console.log(`🔄 [SW-FINAL] Reintentando con: ${retryUrl.href}`);
            return fetch(retryUrl);
          }
          throw error;
        })
    );
    return;
  }
  
  // Para todas las demás solicitudes, dejarlas pasar sin modificar
  // event.respondWith(fetch(event.request));
});
