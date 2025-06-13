// Script para detener el ciclo de recargas causado por el Service Worker
(function() {
  // Variable para detectar si estamos en un ciclo de recargas
  const reloadCount = parseInt(localStorage.getItem('reloadCount') || '0');
  console.log(`🔄 Detección de ciclos: Este es el intento de recarga #${reloadCount + 1}`);
  
  if (reloadCount > 2) {
    console.warn('⚠️ Ciclo de recargas detectado! Desactivando Service Worker...');
    
    // Desregistrar todos los Service Workers para romper el ciclo
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for (let registration of registrations) {
          console.log('🛑 Desregistrando Service Worker:', registration.scope);
          registration.unregister();
        }
        // Limpiar caché
        if ('caches' in window) {
          caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
              console.log('🧹 Limpiando caché:', cacheName);
              caches.delete(cacheName);
            });
          });
        }
        
        // Limpiamos contador y evitamos ciclos futuros
        localStorage.setItem('swDisabled', 'true');
        localStorage.removeItem('reloadCount');
        
        alert('Se ha detectado un ciclo de recargas y se ha desactivado el Service Worker. La página debería funcionar normalmente ahora.');
      });
    }
  } else {
    // Incrementar el contador de recargas
    localStorage.setItem('reloadCount', (reloadCount + 1).toString());
    
    // Resetear el contador después de 10 segundos si no hay más recargas
    setTimeout(() => {
      localStorage.removeItem('reloadCount');
    }, 10000);
  }
  
  // Prevenir diálogos de actualización para evitar ciclos
  if ('serviceWorker' in navigator) {
    // Interceptar y bloquear la activación de Service Workers nuevos
    window.addEventListener('load', function() {
      navigator.serviceWorker.addEventListener('controllerchange', function() {
        // No recargar la página, permitir que el Service Worker haga su trabajo sin prompts
        console.log('🛡️ Cambio de controlador del Service Worker detectado pero evitando recarga automática');
      });
    });
  }
})();
