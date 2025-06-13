// Script para registrar el Service Worker

export function register() {
  // Solo registrar el Service Worker en producción y si el navegador lo soporta
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${window.location.origin}/sw.js`;
      
      console.log('🔍 [ServiceWorkerRegistration] Intentando registrar Service Worker:', swUrl);
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('✅ [ServiceWorkerRegistration] Service Worker registrado exitosamente:', registration);
          
          // Verificar actualizaciones al Service Worker
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.log('🔄 [ServiceWorkerRegistration] Nuevo Service Worker instalado y esperando activación');
                  
                  // Se puede notificar al usuario y ofrecer recargar la página
                  if (window.confirm('Se ha detectado una actualización. ¿Deseas recargar para aplicar los cambios?')) {
                    window.location.reload();
                  }
                } else {
                  console.log('✨ [ServiceWorkerRegistration] Service Worker instalado por primera vez');
                }
              }
            };
          };
        })
        .catch(error => {
          console.error('❌ [ServiceWorkerRegistration] Error al registrar Service Worker:', error);
        });
        
      // Verificar si hay un Service Worker activo y enviar mensaje para actualizarse
      if (navigator.serviceWorker.controller) {
        console.log('🔄 [ServiceWorkerRegistration] Enviando mensaje de actualización al Service Worker existente');
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
      }
    });
  } else {
    console.warn('⚠️ [ServiceWorkerRegistration] El navegador no soporta Service Workers');
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
        console.log('🚫 [ServiceWorkerRegistration] Service Worker desregistrado');
      })
      .catch(error => {
        console.error('❌ [ServiceWorkerRegistration] Error al desregistrar Service Worker:', error);
      });
  }
}
