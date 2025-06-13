// Script para corregir URLs de API antes de que cargue la aplicación
(function() {
  console.log('⚡ [fix-api] Iniciando script de corrección temprana');
  
  const OLD_DOMAIN = 'nextjs-gozamadrid-qrfk.onrender.com';
  const NEW_DOMAIN = 'blogs.realestategozamadrid.com';
  
  // Guarda la implementación original de fetch
  const originalFetch = window.fetch;
  
  // Reemplaza el fetch global
  window.fetch = function(url, options = {}) {
    if (typeof url === 'string' && url.includes(OLD_DOMAIN)) {
      // Reemplazar el dominio antiguo por el nuevo
      const newUrl = url.replace(OLD_DOMAIN, NEW_DOMAIN);
      
      // Asegurar que las rutas principales tienen prefijo /api
      let finalUrl = newUrl;
      
      if (finalUrl.includes('/blogs') && !finalUrl.includes('/api/blogs')) {
        finalUrl = finalUrl.replace('/blogs', '/api/blogs');
      }
      
      if (finalUrl.includes('/properties') && !finalUrl.includes('/api/properties')) {
        finalUrl = finalUrl.replace('/properties', '/api/properties');
      }
      
      if (finalUrl.includes('/user/profile-image') && !finalUrl.includes('/api/user/profile-image')) {
        finalUrl = finalUrl.replace('/user/profile-image', '/api/user/profile-image');
      }
      
      if (finalUrl.includes('/auth/me')) {
        finalUrl = finalUrl.replace('/auth/me', '/api/user/me');
      }
      
      console.log(`🔄 [fix-api] Redirigiendo temprano: ${url} → ${finalUrl}`);
      return originalFetch.call(this, finalUrl, options);
    }
    
    return originalFetch.call(this, url, options);
  };
  
  // Interceptar XMLHttpRequest también
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string' && url.includes(OLD_DOMAIN)) {
      // Aplicar las mismas correcciones que para fetch
      let newUrl = url.replace(OLD_DOMAIN, NEW_DOMAIN);
      
      if (newUrl.includes('/blogs') && !newUrl.includes('/api/blogs')) {
        newUrl = newUrl.replace('/blogs', '/api/blogs');
      }
      
      if (newUrl.includes('/properties') && !newUrl.includes('/api/properties')) {
        newUrl = newUrl.replace('/properties', '/api/properties');
      }
      
      if (newUrl.includes('/user/profile-image') && !newUrl.includes('/api/user/profile-image')) {
        newUrl = newUrl.replace('/user/profile-image', '/api/user/profile-image');
      }
      
      if (newUrl.includes('/auth/me')) {
        newUrl = newUrl.replace('/auth/me', '/api/user/me');
      }
      
      console.log(`🔄 [fix-api] Redirigiendo XHR: ${url} → ${newUrl}`);
      return originalXHROpen.call(this, method, newUrl, ...rest);
    }
    
    return originalXHROpen.call(this, method, url, ...rest);
  };
  
  // Variable global para que otros scripts sepan que el fix está activo
  window.__API_FIX_ACTIVE = true;
  
  console.log('✅ [fix-api] Corrección temprana activada para URLs de API');
})();
