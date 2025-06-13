// Script para registrar el Service Worker de emergencia
(function() {
  console.log('🔄 [Register-SW] Intentando registrar Service Worker de emergencia...');

  // Verificar si hay soporte para Service Workers
  if ('serviceWorker' in navigator) {
    // Registrar el service worker con alcance global
    navigator.serviceWorker.register('/sw-final.js', {
      scope: '/'
    }).then(registration => {
      console.log('✅ [Register-SW] Service Worker registrado con éxito:', registration.scope);
      
      // Verificar si hay actualizaciones disponibles
      registration.update();
      
      // Detectar si hay un nuevo service worker esperando
      if (registration.waiting) {
        console.log('🔄 [Register-SW] Hay un nuevo Service Worker esperando.');
        // Forzar la activación del nuevo service worker
        registration.waiting.postMessage({type: 'SKIP_WAITING'});
      }
      
      // Escuchar eventos de actualización
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 [Register-SW] Nuevo Service Worker instalándose...');
        
        newWorker.addEventListener('statechange', () => {
          console.log(`🔄 [Register-SW] Estado del Service Worker: ${newWorker.state}`);
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log('🔄 [Register-SW] Nuevo Service Worker instalado, recargando...');
              // Recargar la página para usar el nuevo service worker
              window.location.reload();
            }
          }
        });
      });
      
      // Detectar cuando un service worker toma el control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 [Register-SW] Nuevo Service Worker tomando el control...');
      });
      
    }).catch(error => {
      console.error('❌ [Register-SW] Error al registrar Service Worker:', error);
    });

    // Intentar forzar la toma de control inmediata
    navigator.serviceWorker.ready.then(registration => {
      console.log('🚀 [Register-SW] Service Worker listo para interceptar peticiones');
    });
    
    // Monitorear mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 [Register-SW] Mensaje del Service Worker:', event.data);
    });
  } else {
    console.warn('⚠️ [Register-SW] Los Service Workers no están soportados en este navegador.');
  }
})();
